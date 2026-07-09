import Link from "next/link";
import { requireUser } from "@/lib/supabase/server";
import type { Contact, PersonalFact, Tag } from "@/lib/types";
import {
  Avatar,
  EmptyState,
  ImportanceStars,
  LinkedInBadge,
  PageHeader,
  RelationshipBadge,
} from "@/components/ui";
import { ContactFilters } from "@/components/contact-filters";
import { daysUntilBirthday, relativeDate, urgencyScore } from "@/lib/dates";
import { Download, Plus, Upload } from "lucide-react";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
  type?: string;
  linkedin?: string;
  due?: string;
  importance?: string;
  sort?: string;
  archived?: string;
};

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const { supabase, user } = await requireUser();

  const [contactsRes, factsRes, tagsRes, contactTagsRes] = await Promise.all([
    supabase
      .from("contacts")
      .select("*")
      .eq("owner_id", user.id)
      .order("full_name"),
    supabase.from("personal_facts").select("contact_id, label, value").eq("owner_id", user.id),
    supabase.from("tags").select("*").eq("owner_id", user.id),
    supabase.from("contact_tags").select("contact_id, tag_id").eq("owner_id", user.id),
  ]);

  const allContacts = (contactsRes.data ?? []) as Contact[];
  const facts = (factsRes.data ?? []) as Pick<PersonalFact, "contact_id" | "label" | "value">[];
  const tags = (tagsRes.data ?? []) as Tag[];
  const tagById = new Map(tags.map((t) => [t.id, t]));
  const tagsByContact = new Map<string, Tag[]>();
  for (const ct of contactTagsRes.data ?? []) {
    const list = tagsByContact.get(ct.contact_id) ?? [];
    const tag = tagById.get(ct.tag_id);
    if (tag) list.push(tag);
    tagsByContact.set(ct.contact_id, list);
  }
  const factsByContact = new Map<string, string[]>();
  for (const f of facts) {
    const list = factsByContact.get(f.contact_id) ?? [];
    list.push(`${f.label} ${f.value}`);
    factsByContact.set(f.contact_id, list);
  }

  const now = new Date();
  let contacts = allContacts.filter((c) =>
    sp.archived === "1" ? c.archived_at !== null : c.archived_at === null
  );

  if (sp.q) {
    const q = sp.q.toLowerCase();
    contacts = contacts.filter((c) => {
      const haystack = [
        c.full_name,
        c.preferred_name,
        c.company,
        c.role_title,
        c.city,
        c.country,
        c.notes,
        c.how_i_know_them,
        c.relationship_context,
        ...(factsByContact.get(c.id) ?? []),
        ...(tagsByContact.get(c.id) ?? []).map((t) => t.name),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }

  if (sp.type) contacts = contacts.filter((c) => c.relationship_type === sp.type);
  if (sp.linkedin) contacts = contacts.filter((c) => c.linkedin_status === sp.linkedin);
  if (sp.importance) {
    const min = Number(sp.importance);
    contacts = contacts.filter((c) => (c.importance_score ?? 3) >= min);
  }
  if (sp.due === "overdue") {
    contacts = contacts.filter(
      (c) => c.next_follow_up_at && new Date(c.next_follow_up_at) <= now
    );
  } else if (sp.due === "week") {
    const weekOut = new Date(now.getTime() + 7 * 86400000);
    contacts = contacts.filter(
      (c) =>
        c.next_follow_up_at &&
        new Date(c.next_follow_up_at) > now &&
        new Date(c.next_follow_up_at) <= weekOut
    );
  }

  switch (sp.sort) {
    case "last_contacted":
      contacts.sort((a, b) => {
        const at = a.last_contacted_at ? new Date(a.last_contacted_at).getTime() : 0;
        const bt = b.last_contacted_at ? new Date(b.last_contacted_at).getTime() : 0;
        return at - bt;
      });
      break;
    case "next_follow_up":
      contacts.sort((a, b) => {
        const at = a.next_follow_up_at ? new Date(a.next_follow_up_at).getTime() : Infinity;
        const bt = b.next_follow_up_at ? new Date(b.next_follow_up_at).getTime() : Infinity;
        return at - bt;
      });
      break;
    case "birthday":
      contacts.sort((a, b) => {
        const ad = daysUntilBirthday(a) ?? Infinity;
        const bd = daysUntilBirthday(b) ?? Infinity;
        return ad - bd;
      });
      break;
    case "urgency":
      contacts.sort((a, b) => urgencyScore(b) - urgencyScore(a));
      break;
  }

  const hasAny = allContacts.length > 0;

  return (
    <>
      <PageHeader title="Contacts" subtitle={`${contacts.length} shown`}>
        <Link href="/contacts/import" className="btn-secondary">
          <Upload size={16} /> Import
        </Link>
        <a href="/api/export" className="btn-secondary">
          <Download size={16} /> Export
        </a>
        <Link href="/contacts/new" className="btn-primary hidden md:inline-flex">
          <Plus size={16} /> Add contact
        </Link>
      </PageHeader>

      <ContactFilters />

      {!hasAny ? (
        <EmptyState
          title="No contacts yet"
          description="Add the people you want to stay in touch with — colleagues, mentors, founders, friends from conferences."
          action={{ href: "/contacts/new", label: "Add your first contact" }}
        />
      ) : contacts.length === 0 ? (
        <EmptyState
          title="No matches"
          description="Try adjusting your search or filters."
        />
      ) : (
        <ul className="card divide-y divide-slate-100">
          {contacts.map((c) => {
            const overdue = c.next_follow_up_at && new Date(c.next_follow_up_at) <= now;
            const contactTags = tagsByContact.get(c.id) ?? [];
            return (
              <li key={c.id}>
                <Link
                  href={`/contacts/${c.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50"
                >
                  <Avatar name={c.full_name} size={42} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {c.full_name}
                      </p>
                      <ImportanceStars score={c.importance_score} />
                    </div>
                    <p className="truncate text-xs text-slate-500">
                      {[c.role_title, c.company].filter(Boolean).join(" · ") || "—"}
                      {c.city ? ` · ${c.city}` : ""}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <RelationshipBadge type={c.relationship_type} />
                      <LinkedInBadge status={c.linkedin_status} />
                      {contactTags.slice(0, 3).map((t) => (
                        <span key={t.id} className="chip bg-violet-50 text-violet-700">
                          {t.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="hidden shrink-0 text-right sm:block">
                    <p className="text-xs text-slate-500">
                      Last: {relativeDate(c.last_contacted_at)}
                    </p>
                    <p className={`text-xs ${overdue ? "font-medium text-red-600" : "text-slate-500"}`}>
                      Next: {c.next_follow_up_at ? relativeDate(c.next_follow_up_at) : "—"}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
