"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/server";
import { addDays } from "date-fns";

function revalidateReminderPaths(contactId?: string | null) {
  revalidatePath("/reminders");
  revalidatePath("/dashboard");
  if (contactId) revalidatePath(`/contacts/${contactId}`);
}

export async function completeReminder(id: string, contactId?: string | null) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("reminders")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("owner_id", user.id);
  if (error) return { error: error.message };
  revalidateReminderPaths(contactId);
  return { ok: true };
}

export async function snoozeReminder(id: string, days: number, contactId?: string | null) {
  const { supabase, user } = await requireUser();
  const until = addDays(new Date(), days).toISOString();
  const { error } = await supabase
    .from("reminders")
    .update({ status: "snoozed", snoozed_until: until, due_at: until })
    .eq("id", id)
    .eq("owner_id", user.id);
  if (error) return { error: error.message };
  revalidateReminderPaths(contactId);
  return { ok: true };
}

export async function cancelReminder(id: string, contactId?: string | null) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("reminders")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("owner_id", user.id);
  if (error) return { error: error.message };
  revalidateReminderPaths(contactId);
  return { ok: true };
}

export async function createCustomReminder(input: {
  contact_id?: string | null;
  title: string;
  description?: string | null;
  due_at: string;
  priority?: number;
}) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("reminders").insert({
    owner_id: user.id,
    contact_id: input.contact_id ?? null,
    title: input.title,
    description: input.description || null,
    reminder_type: "custom",
    due_at: input.due_at,
    priority: input.priority ?? 3,
  });
  if (error) return { error: error.message };
  revalidateReminderPaths(input.contact_id);
  return { ok: true };
}
