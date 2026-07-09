"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/server";
import { addDays } from "date-fns";

export async function logInteraction(input: {
  contact_id: string;
  channel: string;
  direction?: string;
  interaction_at?: string; // ISO
  summary?: string | null;
  message_text?: string | null;
  outcome?: string | null;
}) {
  const { supabase, user } = await requireUser();

  const interactionAt = input.interaction_at ?? new Date().toISOString();

  const { error } = await supabase.from("interactions").insert({
    owner_id: user.id,
    contact_id: input.contact_id,
    channel: input.channel,
    direction: input.direction ?? "outbound",
    interaction_at: interactionAt,
    summary: input.summary || null,
    message_text: input.message_text || null,
    outcome: input.outcome || null,
  });
  if (error) return { error: error.message };

  // Reminder engine: update last_contacted_at and recompute next follow-up.
  const { data: contact } = await supabase
    .from("contacts")
    .select("id, follow_up_interval_days, last_contacted_at")
    .eq("id", input.contact_id)
    .eq("owner_id", user.id)
    .single();

  if (contact) {
    const interval = contact.follow_up_interval_days ?? 90;
    const nextFollowUp = addDays(new Date(interactionAt), interval).toISOString();
    const isNewer =
      !contact.last_contacted_at ||
      new Date(interactionAt) >= new Date(contact.last_contacted_at);

    if (isNewer) {
      await supabase
        .from("contacts")
        .update({
          last_contacted_at: interactionAt,
          next_follow_up_at: nextFollowUp,
        })
        .eq("id", contact.id)
        .eq("owner_id", user.id);

      // Push out any open follow-up reminders to the new date.
      await supabase
        .from("reminders")
        .update({ due_at: nextFollowUp, status: "pending", snoozed_until: null })
        .eq("contact_id", contact.id)
        .eq("owner_id", user.id)
        .eq("reminder_type", "follow_up")
        .in("status", ["pending", "snoozed"]);
    }
  }

  revalidatePath(`/contacts/${input.contact_id}`);
  revalidatePath("/dashboard");
  revalidatePath("/reminders");
  return { ok: true };
}

export async function deleteInteraction(id: string, contactId: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("interactions")
    .delete()
    .eq("id", id)
    .eq("owner_id", user.id);
  if (error) return { error: error.message };
  revalidatePath(`/contacts/${contactId}`);
  return { ok: true };
}
