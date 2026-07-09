"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/server";

export async function updateSettings(input: {
  full_name?: string | null;
  timezone?: string | null;
  default_follow_up_interval_days?: number;
  birthday_reminder_days_before?: number;
  linkedin_followup_days?: number;
  weekly_digest_enabled?: boolean;
}) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("profiles")
    .update(input)
    .eq("id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { ok: true };
}
