import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Contact, Interaction, MessageDraft, PersonalFact, Reminder, Tag } from "@/lib/types";

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(rows: Record<string, unknown>[], columns: string[]): string {
  const header = columns.join(",");
  const lines = rows.map((r) => columns.map((c) => csvEscape(r[c])).join(","));
  return [header, ...lines].join("\r\n");
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [contactsRes, factsRes, interactionsRes, remindersRes, draftsRes, tagsRes, contactTagsRes] =
    await Promise.all([
      supabase.from("contacts").select("*").eq("owner_id", user.id).order("full_name"),
      supabase.from("personal_facts").select("*").eq("owner_id", user.id),
      supabase.from("interactions").select("*").eq("owner_id", user.id),
      supabase.from("reminders").select("*").eq("owner_id", user.id),
      supabase.from("message_drafts").select("*").eq("owner_id", user.id),
      supabase.from("tags").select("*").eq("owner_id", user.id),
      supabase.from("contact_tags").select("contact_id, tag_id").eq("owner_id", user.id),
    ]);

  const contacts = (contactsRes.data ?? []) as Contact[];
  const facts = (factsRes.data ?? []) as PersonalFact[];
  const interactions = (interactionsRes.data ?? []) as Interaction[];
  const reminders = (remindersRes.data ?? []) as Reminder[];
  const drafts = (draftsRes.data ?? []) as MessageDraft[];
  const tags = (tagsRes.data ?? []) as Tag[];

  const tagById = new Map(tags.map((t) => [t.id, t.name]));
  const tagsByContact = new Map<string, string[]>();
  for (const ct of contactTagsRes.data ?? []) {
    const list = tagsByContact.get(ct.contact_id) ?? [];
    const name = tagById.get(ct.tag_id);
    if (name) list.push(name);
    tagsByContact.set(ct.contact_id, list);
  }
  const factsByContact = new Map<string, string[]>();
  for (const f of facts) {
    const list = factsByContact.get(f.contact_id) ?? [];
    list.push(`${f.label}: ${f.value}`);
    factsByContact.set(f.contact_id, list);
  }
  const nameById = new Map(contacts.map((c) => [c.id, c.full_name]));

  const contactRows = contacts.map((c) => ({
    ...c,
    tags: (tagsByContact.get(c.id) ?? []).join("; "),
    personal_facts: (factsByContact.get(c.id) ?? []).join("; "),
  }));

  const contactColumns = [
    "full_name", "preferred_name", "role_title", "company", "city", "country",
    "email", "phone", "whatsapp_phone", "linkedin_url", "relationship_type",
    "source", "how_i_know_them", "relationship_context", "linkedin_status",
    "importance_score", "closeness_score", "birthday_day", "birthday_month",
    "birthday_year", "last_contacted_at", "next_follow_up_at",
    "follow_up_interval_days", "notes", "tags", "personal_facts", "created_at",
  ];

  const sections = [
    "=== CONTACTS ===",
    toCsv(contactRows, contactColumns),
    "",
    "=== INTERACTIONS ===",
    toCsv(
      interactions.map((i) => ({ ...i, contact_name: nameById.get(i.contact_id) ?? "" })),
      ["contact_name", "channel", "direction", "interaction_at", "summary", "message_text", "outcome"]
    ),
    "",
    "=== REMINDERS ===",
    toCsv(
      reminders.map((r) => ({ ...r, contact_name: r.contact_id ? nameById.get(r.contact_id) ?? "" : "" })),
      ["contact_name", "title", "reminder_type", "due_at", "status", "priority", "completed_at"]
    ),
    "",
    "=== MESSAGE DRAFTS ===",
    toCsv(
      drafts.map((d) => ({ ...d, contact_name: nameById.get(d.contact_id) ?? "" })),
      ["contact_name", "channel", "reason", "tone", "generated_text", "edited_text", "status", "created_at", "sent_at"]
    ),
  ].join("\r\n");

  return new NextResponse(sections, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="relateloop-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
