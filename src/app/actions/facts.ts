"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/server";

export async function addFact(input: {
  contact_id: string;
  label: string;
  value: string;
  fact_type: string;
  is_sensitive: boolean;
}) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("personal_facts").insert({
    owner_id: user.id,
    contact_id: input.contact_id,
    label: input.label,
    value: input.value,
    fact_type: input.fact_type,
    is_sensitive: input.is_sensitive,
  });
  if (error) return { error: error.message };
  revalidatePath(`/contacts/${input.contact_id}`);
  return { ok: true };
}

export async function updateFact(
  id: string,
  contactId: string,
  patch: { label?: string; value?: string; fact_type?: string; is_sensitive?: boolean }
) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("personal_facts")
    .update(patch)
    .eq("id", id)
    .eq("owner_id", user.id);
  if (error) return { error: error.message };
  revalidatePath(`/contacts/${contactId}`);
  return { ok: true };
}

export async function deleteFact(id: string, contactId: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("personal_facts")
    .delete()
    .eq("id", id)
    .eq("owner_id", user.id);
  if (error) return { error: error.message };
  revalidatePath(`/contacts/${contactId}`);
  return { ok: true };
}
