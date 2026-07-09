"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/server";
import { generateDraft } from "@/lib/messages";
import type { Contact, PersonalFact } from "@/lib/types";

export async function generateAndSaveDraft(input: {
  contact_id: string;
  channel: string;
  reason: string;
  tone: string;
  length: "short" | "medium" | "long";
  fact_ids: string[];
  reminder_id?: string | null;
}) {
  const { supabase, user } = await requireUser();

  const { data: contact } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", input.contact_id)
    .eq("owner_id", user.id)
    .single<Contact>();
  if (!contact) return { error: "Contact not found" };

  let facts: PersonalFact[] = [];
  if (input.fact_ids.length > 0) {
    const { data } = await supabase
      .from("personal_facts")
      .select("*")
      .eq("owner_id", user.id)
      .eq("contact_id", input.contact_id)
      .in("id", input.fact_ids);
    facts = (data ?? []) as PersonalFact[];
  }

  const text = generateDraft({
    contact,
    facts,
    reason: input.reason,
    tone: input.tone,
    length: input.length,
  });

  const { data: draft, error } = await supabase
    .from("message_drafts")
    .insert({
      owner_id: user.id,
      contact_id: input.contact_id,
      reminder_id: input.reminder_id ?? null,
      channel: input.channel,
      reason: input.reason,
      tone: input.tone,
      generated_text: text,
      status: "draft",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/contacts/${input.contact_id}`);
  revalidatePath("/messages");
  return { id: draft.id as string, text };
}

export async function saveEditedDraft(id: string, editedText: string, contactId: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("message_drafts")
    .update({ edited_text: editedText })
    .eq("id", id)
    .eq("owner_id", user.id);
  if (error) return { error: error.message };
  revalidatePath(`/contacts/${contactId}`);
  revalidatePath("/messages");
  return { ok: true };
}

export async function markDraftSent(id: string, contactId: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("message_drafts")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", id)
    .eq("owner_id", user.id);
  if (error) return { error: error.message };
  revalidatePath(`/contacts/${contactId}`);
  revalidatePath("/messages");
  return { ok: true };
}

export async function deleteDraft(id: string, contactId: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("message_drafts")
    .delete()
    .eq("id", id)
    .eq("owner_id", user.id);
  if (error) return { error: error.message };
  revalidatePath(`/contacts/${contactId}`);
  revalidatePath("/messages");
  return { ok: true };
}
