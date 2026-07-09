// Daily reminder engine.
// Invoked once a day via pg_cron + pg_net (see supabase/migrations/0002_cron.sql).
// Responsibilities:
//  1. Create follow-up reminders for contacts where next_follow_up_at <= now.
//  2. Create birthday reminders for upcoming birthdays (per-user window).
//  3. Create LinkedIn request follow-up reminders when a request has been
//     pending longer than the user's threshold.
//  4. Avoid duplicate reminders.

import { createClient } from "npm:@supabase/supabase-js@2";

type Contact = {
  id: string;
  owner_id: string;
  full_name: string;
  preferred_name: string | null;
  importance_score: number | null;
  next_follow_up_at: string | null;
  birthday_month: number | null;
  birthday_day: number | null;
  linkedin_status: string | null;
  linkedin_requested_at: string | null;
};

type Profile = {
  id: string;
  birthday_reminder_days_before: number | null;
  linkedin_followup_days: number | null;
};

Deno.serve(async (req) => {
  const authHeader = req.headers.get("Authorization") ?? "";
  const expected = `Bearer ${Deno.env.get("CRON_SECRET")}`;
  if (!Deno.env.get("CRON_SECRET") || authHeader !== expected) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const now = new Date();
  const results = { follow_up: 0, birthday: 0, linkedin_request_followup: 0 };

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, birthday_reminder_days_before, linkedin_followup_days");
  if (profilesError) {
    return new Response(JSON.stringify({ error: profilesError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
  const profileById = new Map<string, Profile>(
    (profiles ?? []).map((p: Profile) => [p.id, p]),
  );

  const { data: contacts, error: contactsError } = await supabase
    .from("contacts")
    .select(
      "id, owner_id, full_name, preferred_name, importance_score, next_follow_up_at, birthday_month, birthday_day, linkedin_status, linkedin_requested_at",
    )
    .is("archived_at", null);
  if (contactsError) {
    return new Response(JSON.stringify({ error: contactsError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: openReminders } = await supabase
    .from("reminders")
    .select("contact_id, reminder_type, status, due_at")
    .in("status", ["pending", "snoozed"]);

  const hasOpenReminder = (contactId: string, type: string) =>
    (openReminders ?? []).some(
      (r) => r.contact_id === contactId && r.reminder_type === type,
    );

  const thisYear = now.getFullYear();
  const { data: birthdayRemindersThisYear } = await supabase
    .from("reminders")
    .select("contact_id, due_at")
    .eq("reminder_type", "birthday")
    .gte("due_at", `${thisYear}-01-01`)
    .lte("due_at", `${thisYear}-12-31`);

  const hasBirthdayReminderThisYear = (contactId: string) =>
    (birthdayRemindersThisYear ?? []).some((r) => r.contact_id === contactId);

  const inserts: Record<string, unknown>[] = [];

  for (const contact of (contacts ?? []) as Contact[]) {
    const profile = profileById.get(contact.owner_id);
    const name = contact.preferred_name || contact.full_name;

    // 1. Follow-up reminders
    if (
      contact.next_follow_up_at &&
      new Date(contact.next_follow_up_at) <= now &&
      !hasOpenReminder(contact.id, "follow_up")
    ) {
      inserts.push({
        owner_id: contact.owner_id,
        contact_id: contact.id,
        title: `Follow up with ${name}`,
        description: "Regular check-in is due.",
        reminder_type: "follow_up",
        due_at: contact.next_follow_up_at,
        priority: contact.importance_score ?? 3,
      });
      results.follow_up++;
    }

    // 2. Birthday reminders
    if (contact.birthday_month && contact.birthday_day) {
      const windowDays = profile?.birthday_reminder_days_before ?? 7;
      let birthday = new Date(
        Date.UTC(thisYear, contact.birthday_month - 1, contact.birthday_day),
      );
      if (birthday < now) {
        birthday = new Date(
          Date.UTC(thisYear + 1, contact.birthday_month - 1, contact.birthday_day),
        );
      }
      const msUntil = birthday.getTime() - now.getTime();
      const daysUntil = msUntil / (1000 * 60 * 60 * 24);
      if (
        daysUntil <= windowDays &&
        birthday.getFullYear() === thisYear &&
        !hasBirthdayReminderThisYear(contact.id) &&
        !hasOpenReminder(contact.id, "birthday")
      ) {
        inserts.push({
          owner_id: contact.owner_id,
          contact_id: contact.id,
          title: `Birthday: ${name}`,
          description: `Birthday on ${birthday.toISOString().slice(0, 10)}. Send wishes.`,
          reminder_type: "birthday",
          due_at: birthday.toISOString(),
          priority: 4,
        });
        results.birthday++;
      }
    }

    // 3. LinkedIn request follow-ups
    if (
      contact.linkedin_status === "requested" &&
      contact.linkedin_requested_at &&
      !hasOpenReminder(contact.id, "linkedin_request_followup")
    ) {
      const thresholdDays = profile?.linkedin_followup_days ?? 14;
      const requestedAt = new Date(contact.linkedin_requested_at);
      const daysPending =
        (now.getTime() - requestedAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysPending >= thresholdDays) {
        inserts.push({
          owner_id: contact.owner_id,
          contact_id: contact.id,
          title: `LinkedIn request pending: ${name}`,
          description: `Request sent ${Math.floor(daysPending)} days ago. Check status or follow up.`,
          reminder_type: "linkedin_request_followup",
          due_at: now.toISOString(),
          priority: 3,
        });
        results.linkedin_request_followup++;
      }
    }
  }

  if (inserts.length > 0) {
    const { error: insertError } = await supabase.from("reminders").insert(inserts);
    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return new Response(JSON.stringify({ ok: true, created: results }), {
    headers: { "Content-Type": "application/json" },
  });
});
