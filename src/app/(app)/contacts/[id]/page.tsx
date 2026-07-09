import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import type {
  Contact,
  Interaction,
  MessageDraft,
  PersonalFact,
  Reminder,
  Tag,
} from "@/lib/types";
import {
  Avatar,
  ImportanceStars,
  LinkedInBadge,
  RelationshipBadge,
} from "@/components/ui";
import { FactsEditor } from "@/components/facts-editor";
import { InteractionForm } from "@/components/interaction-form";
import { ReminderActions } from "@/components/reminder-actions";
import { MessageComposer } from "@/components/message-composer";
import { LinkedInStatusSelect } from "@/components/linkedin-status-select";
import { ContactDangerActions } from "@/components/contact-danger-actions";
import { birthdayLabel, formatDate, relativeDate, urgencyScore } from "@/lib/dates";
import { CHANNELS, labelFor, MESSAGE_REASONS, REMINDER_TYPES } from "@/lib/constants";
import {
  Cake,
  ExternalLink,
  Mail,
  MapPin,
  Pencil,
  Phone,
} from "lucide-react";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "context", label: "Personal context" },
  { key: "timeline", label: "Timeline" },
  { key: "reminders", label: "Reminders" },
  { key: "messages", label: "Drafts" },
] as const;

export default async function ContactDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab = "overview" } = await searchParams;
  const { supabase, user } = await requireUser();

  const { data: contact } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", id)
    .eq("owner_id", user.id)
    .single<Contact>();

  if (!contact) notFound();

  const [factsRes, interactionsRes, remindersRes, draftsRes, tagsRes] = await Promise.all([
    supabase
      .from("personal_facts")
      .select("*")
      .eq("contact_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("interactions")
      .select("*")
      .eq("contact_id", id)
      .order("interaction_at", { ascending: false }),
    supabase
      .from("reminders")
      .select("*")
      .eq("contact_id", id)
      .order("due_at"),
    supabase
      .from("message_drafts")
      .select("*")
      .eq("contact_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("contact_tags")
      .select("tags(id, owner_id, name, color, created_at)")
      .eq("contact_id", id),
  ]);

  const facts = (factsRes.data ?? []) as PersonalFact[];
  const interactions = (interactionsRes.data ?? []) as Interaction[];
  const reminders = (remindersRes.data ?? []) as Reminder[];
  const drafts = (draftsRes.data ?? []) as MessageDraft[];
  const tags = (tagsRes.data ?? [])
    .map((r) => r.tags as unknown as Tag)
    .filter(Boolean);

  const activeReminders = reminders.filter((r) => r.status === "pending");
  const snoozedReminders = reminders.filter((r) => r.status === "snoozed");
  const doneReminders = reminders.filter(
    (r) => r.status === "completed" || r.status === "cancelled"
  );
  const overdue =
    contact.next_follow_up_at && new Date(contact.next_follow_up_at) <= new Date();

  return (
    <>
      {/* Header */}
      <div className="card mb-6 p-4 md:p-6">
        <div className="flex flex-wrap items-start gap-4">
          <Avatar name={contact.full_name} size={56} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold text-slate-900">{contact.full_name}</h1>
              <ImportanceStars score={contact.importance_score} />
              {contact.archived_at && (
                <span className="chip bg-slate-200 text-slate-600">Archived</span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-slate-500">
              {[contact.role_title, contact.company].filter(Boolean).join(" · ") || "—"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <RelationshipBadge type={contact.relationship_type} />
              <LinkedInBadge status={contact.linkedin_status} />
              {tags.map((t) => (
                <span key={t.id} className="chip bg-violet-50 text-violet-700">
                  {t.name}
                </span>
              ))}
            </div>
          </div>
          <Link href={`/contacts/${id}/edit`} className="btn-secondary">
            <Pencil size={15} /> Edit
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-sm md:grid-cols-4">
          <div>
            <p className="text-xs text-slate-400">Last contacted</p>
            <p className="font-medium text-slate-700">{relativeDate(contact.last_contacted_at)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Next follow-up</p>
            <p className={`font-medium ${overdue ? "text-red-600" : "text-slate-700"}`}>
              {contact.next_follow_up_at ? formatDate(contact.next_follow_up_at) : "—"}
              {overdue && " (overdue)"}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Birthday</p>
            <p className="font-medium text-slate-700">
              <Cake size={13} className="mr-1 inline text-pink-500" />
              {birthdayLabel(contact)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Urgency score</p>
            <p className="font-medium text-slate-700">{urgencyScore(contact)}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-slate-200">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/contacts/${id}?tab=${t.key}`}
            className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition ${
              tab === t.key
                ? "border-indigo-600 text-indigo-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
            {t.key === "reminders" && activeReminders.length > 0 && (
              <span className="ml-1.5 rounded-full bg-indigo-100 px-1.5 text-xs text-indigo-700">
                {activeReminders.length}
              </span>
            )}
          </Link>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-4">
          <div className="card p-4 md:p-6">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Details</h2>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-slate-400">How I know them</dt>
                <dd className="text-slate-700">{contact.how_i_know_them || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Source</dt>
                <dd className="text-slate-700">{contact.source || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Location</dt>
                <dd className="text-slate-700">
                  <MapPin size={13} className="mr-1 inline text-slate-400" />
                  {[contact.city, contact.country].filter(Boolean).join(", ") || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Follow-up interval</dt>
                <dd className="text-slate-700">
                  every {contact.follow_up_interval_days ?? 90} days
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Email</dt>
                <dd className="text-slate-700">
                  {contact.email ? (
                    <a href={`mailto:${contact.email}`} className="text-indigo-600 hover:underline">
                      <Mail size={13} className="mr-1 inline" />
                      {contact.email}
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Phone / WhatsApp</dt>
                <dd className="text-slate-700">
                  <Phone size={13} className="mr-1 inline text-slate-400" />
                  {contact.phone || contact.whatsapp_phone || "—"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-slate-400">Relationship context</dt>
                <dd className="text-slate-700">{contact.relationship_context || "—"}</dd>
              </div>
              {contact.notes && (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-slate-400">Notes</dt>
                  <dd className="whitespace-pre-wrap text-slate-700">{contact.notes}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="card p-4 md:p-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-900">LinkedIn</h2>
              <LinkedInStatusSelect contactId={id} status={contact.linkedin_status} />
            </div>
            {contact.linkedin_url ? (
              <a
                href={contact.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                <ExternalLink size={15} /> Open LinkedIn profile
              </a>
            ) : (
              <p className="text-sm text-slate-500">No LinkedIn URL saved.</p>
            )}
          </div>

          <div className="card p-4 md:p-6">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Quick log</h2>
            <InteractionForm contactId={id} />
          </div>

          <div className="card p-4 md:p-6">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Danger zone</h2>
            <ContactDangerActions contactId={id} archived={contact.archived_at !== null} />
          </div>
        </div>
      )}

      {tab === "context" && (
        <div className="card p-4 md:p-6">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Personal facts</h2>
          <FactsEditor contactId={id} facts={facts} />
        </div>
      )}

      {tab === "timeline" && (
        <div className="space-y-4">
          <InteractionForm contactId={id} />
          {interactions.length === 0 ? (
            <p className="card px-4 py-8 text-center text-sm text-slate-500">
              No interactions logged yet. Log your first touchpoint to start the timeline.
            </p>
          ) : (
            <ol className="relative ml-3 space-y-4 border-l border-slate-200 pl-5">
              {interactions.map((it) => (
                <li key={it.id} className="relative">
                  <span className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-indigo-500" />
                  <div className="card p-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="chip bg-indigo-50 text-indigo-700">
                        {labelFor(CHANNELS, it.channel)}
                      </span>
                      <span>{it.direction === "inbound" ? "They reached out" : it.direction === "mutual" ? "Meeting" : "I reached out"}</span>
                      <span>·</span>
                      <span>{formatDate(it.interaction_at)}</span>
                    </div>
                    {it.summary && (
                      <p className="mt-1.5 text-sm text-slate-700">{it.summary}</p>
                    )}
                    {it.message_text && (
                      <p className="mt-1.5 whitespace-pre-wrap rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                        {it.message_text}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {tab === "reminders" && (
        <div className="space-y-4">
          {[
            { title: "Active", items: activeReminders },
            { title: "Snoozed", items: snoozedReminders },
            { title: "Completed & cancelled", items: doneReminders },
          ].map(({ title, items }) => (
            <div key={title} className="card p-4 md:p-6">
              <h2 className="mb-3 text-sm font-semibold text-slate-900">{title}</h2>
              {items.length === 0 ? (
                <p className="text-sm text-slate-500">None.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {items.map((r) => (
                    <li key={r.id} className="flex flex-wrap items-center gap-2 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800">{r.title}</p>
                        <p className="text-xs text-slate-500">
                          {REMINDER_TYPES[r.reminder_type] ?? r.reminder_type} · due{" "}
                          {formatDate(r.due_at)}
                          {r.status !== "pending" && ` · ${r.status}`}
                        </p>
                      </div>
                      {(r.status === "pending" || r.status === "snoozed") && (
                        <ReminderActions reminderId={r.id} contactId={id} />
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "messages" && (
        <div className="space-y-4">
          <div className="card p-4 md:p-6">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Compose message</h2>
            <MessageComposer contact={contact} facts={facts} />
          </div>
          <div className="card p-4 md:p-6">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Draft history</h2>
            {drafts.length === 0 ? (
              <p className="text-sm text-slate-500">No drafts yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {drafts.map((d) => (
                  <li key={d.id} className="py-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="chip bg-indigo-50 text-indigo-700">
                        {labelFor(CHANNELS, d.channel)}
                      </span>
                      <span>{labelFor(MESSAGE_REASONS, d.reason)}</span>
                      <span>·</span>
                      <span>{formatDate(d.created_at)}</span>
                      {d.status === "sent" && (
                        <span className="chip bg-emerald-50 text-emerald-700">sent</span>
                      )}
                    </div>
                    <p className="mt-1.5 whitespace-pre-wrap text-sm text-slate-700">
                      {d.edited_text || d.generated_text}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
}
