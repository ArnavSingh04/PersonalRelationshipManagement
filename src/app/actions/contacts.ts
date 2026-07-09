"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { addDays } from "date-fns";

export type ContactFormValues = {
  full_name: string;
  preferred_name?: string | null;
  role_title?: string | null;
  company?: string | null;
  city?: string | null;
  country?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp_phone?: string | null;
  linkedin_url?: string | null;
  relationship_type: string;
  source?: string | null;
  how_i_know_them?: string | null;
  relationship_context?: string | null;
  linkedin_status?: string | null;
  importance_score?: number | null;
  closeness_score?: number | null;
  birthday_month?: number | null;
  birthday_day?: number | null;
  birthday_year?: number | null;
  follow_up_interval_days?: number | null;
  notes?: string | null;
  tags?: string[]; // tag names
};

function clean(values: ContactFormValues) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(values)) {
    if (k === "tags") continue;
    out[k] = v === "" || v === undefined ? null : v;
  }
  return out;
}

async function syncTags(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  userId: string,
  contactId: string,
  tagNames: string[]
) {
  const names = [...new Set(tagNames.map((t) => t.trim()).filter(Boolean))];

  await supabase.from("contact_tags").delete().eq("contact_id", contactId);
  if (names.length === 0) return;

  const { data: existing } = await supabase
    .from("tags")
    .select("id, name")
    .eq("owner_id", userId)
    .in("name", names);

  const existingNames = new Set((existing ?? []).map((t) => t.name));
  const toCreate = names.filter((n) => !existingNames.has(n));

  let created: { id: string; name: string }[] = [];
  if (toCreate.length > 0) {
    const { data } = await supabase
      .from("tags")
      .insert(toCreate.map((name) => ({ owner_id: userId, name })))
      .select("id, name");
    created = data ?? [];
  }

  const allTags = [...(existing ?? []), ...created];
  await supabase.from("contact_tags").insert(
    allTags.map((t) => ({
      contact_id: contactId,
      tag_id: t.id,
      owner_id: userId,
    }))
  );
}

export async function createContact(values: ContactFormValues) {
  const { supabase, user } = await requireUser();

  const intervalDays = values.follow_up_interval_days ?? 90;
  const nextFollowUp = addDays(new Date(), intervalDays).toISOString();

  const { data: contact, error } = await supabase
    .from("contacts")
    .insert({
      ...clean(values),
      owner_id: user.id,
      follow_up_interval_days: intervalDays,
      next_follow_up_at: nextFollowUp,
      linkedin_requested_at:
        values.linkedin_status === "requested" ? new Date().toISOString() : null,
    })
    .select("id, full_name, preferred_name, importance_score")
    .single();

  if (error) return { error: error.message };

  // Default follow-up reminder (acceptance criteria: new contacts get one).
  await supabase.from("reminders").insert({
    owner_id: user.id,
    contact_id: contact.id,
    title: `Follow up with ${contact.preferred_name || contact.full_name}`,
    description: "First scheduled check-in.",
    reminder_type: "follow_up",
    due_at: nextFollowUp,
    priority: contact.importance_score ?? 3,
  });

  if (values.tags) await syncTags(supabase, user.id, contact.id, values.tags);

  revalidatePath("/contacts");
  revalidatePath("/dashboard");
  return { id: contact.id as string };
}

export async function updateContact(id: string, values: ContactFormValues) {
  const { supabase, user } = await requireUser();

  const { data: before } = await supabase
    .from("contacts")
    .select("linkedin_status, linkedin_requested_at")
    .eq("id", id)
    .eq("owner_id", user.id)
    .single();

  const patch: Record<string, unknown> = clean(values);
  if (
    values.linkedin_status === "requested" &&
    before?.linkedin_status !== "requested"
  ) {
    patch.linkedin_requested_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("contacts")
    .update(patch)
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) return { error: error.message };

  if (values.tags) await syncTags(supabase, user.id, id, values.tags);

  revalidatePath(`/contacts/${id}`);
  revalidatePath("/contacts");
  revalidatePath("/dashboard");
  return { id };
}

export async function archiveContact(id: string) {
  const { supabase, user } = await requireUser();
  await supabase
    .from("contacts")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id)
    .eq("owner_id", user.id);
  await supabase
    .from("reminders")
    .update({ status: "cancelled" })
    .eq("contact_id", id)
    .eq("owner_id", user.id)
    .in("status", ["pending", "snoozed"]);
  revalidatePath("/contacts");
  revalidatePath("/dashboard");
  redirect("/contacts");
}

export async function unarchiveContact(id: string) {
  const { supabase, user } = await requireUser();
  await supabase
    .from("contacts")
    .update({ archived_at: null })
    .eq("id", id)
    .eq("owner_id", user.id);
  revalidatePath(`/contacts/${id}`);
  revalidatePath("/contacts");
}

export async function deleteContact(id: string) {
  const { supabase, user } = await requireUser();
  await supabase.from("contacts").delete().eq("id", id).eq("owner_id", user.id);
  revalidatePath("/contacts");
  revalidatePath("/dashboard");
  redirect("/contacts");
}

export async function updateLinkedInStatus(contactId: string, status: string) {
  const { supabase, user } = await requireUser();
  const patch: Record<string, unknown> = { linkedin_status: status };
  if (status === "requested") {
    patch.linkedin_requested_at = new Date().toISOString();
  }
  const { error } = await supabase
    .from("contacts")
    .update(patch)
    .eq("id", contactId)
    .eq("owner_id", user.id);
  if (error) return { error: error.message };
  revalidatePath(`/contacts/${contactId}`);
  revalidatePath("/contacts");
  return { ok: true };
}
