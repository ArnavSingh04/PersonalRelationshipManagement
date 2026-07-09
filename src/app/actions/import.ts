"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/server";
import { addDays } from "date-fns";

export type ImportRow = {
  full_name: string;
  preferred_name?: string;
  role_title?: string;
  company?: string;
  city?: string;
  country?: string;
  email?: string;
  phone?: string;
  whatsapp_phone?: string;
  linkedin_url?: string;
  relationship_type?: string;
  source?: string;
  how_i_know_them?: string;
  relationship_context?: string;
  linkedin_status?: string;
  importance_score?: number;
  closeness_score?: number;
  birthday_day?: number;
  birthday_month?: number;
  birthday_year?: number;
  last_contacted_at?: string;
  follow_up_interval_days?: number;
  notes?: string;
  tags?: string; // comma or semicolon separated
  personal_facts?: string; // "label: value; label: value"
};

export type DuplicateInfo = {
  rowIndex: number;
  existingContactId: string;
  existingName: string;
  matchedOn: string;
};

/** Check candidate rows against existing contacts for duplicates. */
export async function checkDuplicates(rows: ImportRow[]): Promise<DuplicateInfo[]> {
  const { supabase, user } = await requireUser();
  const { data: existing } = await supabase
    .from("contacts")
    .select("id, full_name, company, email, phone, linkedin_url")
    .eq("owner_id", user.id);

  const dups: DuplicateInfo[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const match = (existing ?? []).find((c) => {
      if (row.linkedin_url && c.linkedin_url && row.linkedin_url.trim() === c.linkedin_url)
        return true;
      if (row.email && c.email && row.email.trim().toLowerCase() === c.email.toLowerCase())
        return true;
      if (row.phone && c.phone && row.phone.replace(/\D/g, "") === c.phone.replace(/\D/g, ""))
        return true;
      if (
        row.full_name &&
        row.company &&
        c.full_name.toLowerCase() === row.full_name.trim().toLowerCase() &&
        (c.company ?? "").toLowerCase() === row.company.trim().toLowerCase()
      )
        return true;
      return false;
    });
    if (match) {
      const matchedOn = row.linkedin_url === match.linkedin_url && row.linkedin_url
        ? "LinkedIn URL"
        : row.email && match.email && row.email.toLowerCase() === match.email.toLowerCase()
          ? "Email"
          : row.phone && match.phone
            ? "Phone"
            : "Name + company";
      dups.push({
        rowIndex: i,
        existingContactId: match.id,
        existingName: match.full_name,
        matchedOn,
      });
    }
  }
  return dups;
}

export async function importContacts(
  rows: ImportRow[],
  decisions: Record<number, "create" | "skip">
): Promise<{ created: number; skipped: number; errors: string[] }> {
  const { supabase, user } = await requireUser();
  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    if (decisions[i] === "skip") {
      skipped++;
      continue;
    }
    const row = rows[i];
    if (!row.full_name?.trim()) {
      errors.push(`Row ${i + 1}: missing full_name`);
      continue;
    }

    const interval = row.follow_up_interval_days || 90;
    const base = row.last_contacted_at ? new Date(row.last_contacted_at) : new Date();
    const nextFollowUp = addDays(base, interval).toISOString();

    const { data: contact, error } = await supabase
      .from("contacts")
      .insert({
        owner_id: user.id,
        full_name: row.full_name.trim(),
        preferred_name: row.preferred_name || null,
        role_title: row.role_title || null,
        company: row.company || null,
        city: row.city || null,
        country: row.country || null,
        email: row.email || null,
        phone: row.phone || null,
        whatsapp_phone: row.whatsapp_phone || null,
        linkedin_url: row.linkedin_url || null,
        relationship_type: row.relationship_type || "professional",
        source: row.source || null,
        how_i_know_them: row.how_i_know_them || null,
        relationship_context: row.relationship_context || null,
        linkedin_status: row.linkedin_status || "unknown",
        importance_score: row.importance_score || 3,
        closeness_score: row.closeness_score || 2,
        birthday_day: row.birthday_day || null,
        birthday_month: row.birthday_month || null,
        birthday_year: row.birthday_year || null,
        last_contacted_at: row.last_contacted_at
          ? new Date(row.last_contacted_at).toISOString()
          : null,
        next_follow_up_at: nextFollowUp,
        follow_up_interval_days: interval,
        notes: row.notes || null,
      })
      .select("id")
      .single();

    if (error) {
      errors.push(`Row ${i + 1} (${row.full_name}): ${error.message}`);
      continue;
    }
    created++;

    // Tags: create missing, then link.
    const tagNames = [
      ...new Set(
        (row.tags ?? "")
          .split(/[;,]/)
          .map((t) => t.trim())
          .filter(Boolean)
      ),
    ];
    if (tagNames.length > 0) {
      const { data: existingTags } = await supabase
        .from("tags")
        .select("id, name")
        .eq("owner_id", user.id)
        .in("name", tagNames);
      const existingByName = new Map((existingTags ?? []).map((t) => [t.name, t.id]));
      const toCreate = tagNames.filter((n) => !existingByName.has(n));
      if (toCreate.length > 0) {
        const { data: newTags } = await supabase
          .from("tags")
          .insert(toCreate.map((name) => ({ owner_id: user.id, name })))
          .select("id, name");
        for (const t of newTags ?? []) existingByName.set(t.name, t.id);
      }
      await supabase.from("contact_tags").insert(
        tagNames
          .filter((n) => existingByName.has(n))
          .map((n) => ({
            contact_id: contact.id,
            tag_id: existingByName.get(n)!,
            owner_id: user.id,
          }))
      );
    }

    // Personal facts in "label: value; label: value" form.
    const factEntries = (row.personal_facts ?? "")
      .split(";")
      .map((f) => f.trim())
      .filter(Boolean);
    if (factEntries.length > 0) {
      await supabase.from("personal_facts").insert(
        factEntries.map((entry) => {
          const idx = entry.indexOf(":");
          const label = idx > 0 ? entry.slice(0, idx).trim() : "Note";
          const value = idx > 0 ? entry.slice(idx + 1).trim() : entry;
          return {
            owner_id: user.id,
            contact_id: contact.id,
            label,
            value,
            fact_type: "general",
          };
        })
      );
    }
  }

  revalidatePath("/contacts");
  revalidatePath("/dashboard");
  return { created, skipped, errors };
}
