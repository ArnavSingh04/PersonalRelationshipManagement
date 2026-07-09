import Link from "next/link";
import { requireUser } from "@/lib/supabase/server";
import type { Contact, MessageDraft } from "@/lib/types";
import { Avatar, EmptyState, PageHeader } from "@/components/ui";
import { CHANNELS, labelFor, MESSAGE_REASONS } from "@/lib/constants";
import { formatDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const { supabase, user } = await requireUser();

  const [draftsRes, contactsRes] = await Promise.all([
    supabase
      .from("message_drafts")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("contacts").select("*").eq("owner_id", user.id),
  ]);

  const drafts = (draftsRes.data ?? []) as MessageDraft[];
  const contactById = new Map(
    ((contactsRes.data ?? []) as Contact[]).map((c) => [c.id, c])
  );

  return (
    <>
      <PageHeader
        title="Messages"
        subtitle="Every draft you've generated, across all contacts."
      />

      {drafts.length === 0 ? (
        <EmptyState
          title="No message drafts yet"
          description="Open any contact and use the Drafts tab to generate a warm, editable message. Drafts you generate are saved here."
          action={{ href: "/contacts", label: "Browse contacts" }}
        />
      ) : (
        <ul className="space-y-2">
          {drafts.map((d) => {
            const contact = contactById.get(d.contact_id);
            return (
              <li key={d.id} className="card px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  {contact && (
                    <>
                      <Avatar name={contact.full_name} size={28} />
                      <Link
                        href={`/contacts/${contact.id}?tab=messages`}
                        className="text-sm font-medium text-slate-900 hover:underline"
                      >
                        {contact.full_name}
                      </Link>
                    </>
                  )}
                  <span className="chip bg-indigo-50 text-indigo-700">
                    {labelFor(CHANNELS, d.channel)}
                  </span>
                  <span className="chip bg-slate-100 text-slate-600">
                    {labelFor(MESSAGE_REASONS, d.reason)}
                  </span>
                  {d.status === "sent" && (
                    <span className="chip bg-emerald-50 text-emerald-700">sent</span>
                  )}
                  <span className="ml-auto text-xs text-slate-400">
                    {formatDate(d.created_at)}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                  {d.edited_text || d.generated_text}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
