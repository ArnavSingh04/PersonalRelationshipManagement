import { notFound } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import type { Contact, Tag } from "@/lib/types";
import { PageHeader } from "@/components/ui";
import { ContactForm } from "@/components/contact-form";

export const dynamic = "force-dynamic";

export default async function EditContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await requireUser();

  const { data: contact } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", id)
    .eq("owner_id", user.id)
    .single<Contact>();

  if (!contact) notFound();

  const { data: tagRows } = await supabase
    .from("contact_tags")
    .select("tags(id, owner_id, name, color, created_at)")
    .eq("contact_id", id);
  const tags = (tagRows ?? [])
    .map((r) => r.tags as unknown as Tag)
    .filter(Boolean);

  return (
    <>
      <PageHeader title={`Edit ${contact.full_name}`} />
      <ContactForm contact={contact} existingTags={tags} />
    </>
  );
}
