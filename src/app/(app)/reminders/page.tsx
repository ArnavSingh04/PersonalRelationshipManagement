import Link from "next/link";
import { requireUser } from "@/lib/supabase/server";
import type { Contact, Reminder } from "@/lib/types";
import { Avatar, EmptyState, PageHeader } from "@/components/ui";
import { ReminderActions } from "@/components/reminder-actions";
import { REMINDER_TYPES } from "@/lib/constants";
import { formatDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function RemindersPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view = "open" } = await searchParams;
  const { supabase, user } = await requireUser();

  const [remindersRes, contactsRes] = await Promise.all([
    supabase
      .from("reminders")
      .select("*")
      .eq("owner_id", user.id)
      .order("due_at", { ascending: view === "open" }),
    supabase.from("contacts").select("*").eq("owner_id", user.id),
  ]);

  const all = (remindersRes.data ?? []) as Reminder[];
  const contactById = new Map(
    ((contactsRes.data ?? []) as Contact[]).map((c) => [c.id, c])
  );

  const reminders =
    view === "open"
      ? all.filter((r) => r.status === "pending" || r.status === "snoozed")
      : all.filter((r) => r.status === "completed" || r.status === "cancelled").slice(0, 50);

  const now = new Date();

  return (
    <>
      <PageHeader title="Reminders" subtitle="Complete a reminder, then log the interaction.">
        <div className="flex rounded-lg border border-slate-300 bg-white p-0.5 text-sm">
          <Link
            href="/reminders?view=open"
            className={`rounded-md px-3 py-1.5 font-medium ${
              view === "open" ? "bg-indigo-600 text-white" : "text-slate-600"
            }`}
          >
            Open
          </Link>
          <Link
            href="/reminders?view=done"
            className={`rounded-md px-3 py-1.5 font-medium ${
              view === "done" ? "bg-indigo-600 text-white" : "text-slate-600"
            }`}
          >
            History
          </Link>
        </div>
      </PageHeader>

      {reminders.length === 0 ? (
        <EmptyState
          title={view === "open" ? "No open reminders" : "No completed reminders yet"}
          description={
            view === "open"
              ? "You're all caught up. New follow-up reminders appear automatically when contacts are due."
              : "Completed and cancelled reminders will show up here."
          }
        />
      ) : (
        <ul className="space-y-2">
          {reminders.map((r) => {
            const contact = r.contact_id ? contactById.get(r.contact_id) : null;
            const overdue = r.status === "pending" && new Date(r.due_at) < now;
            return (
              <li key={r.id} className="card flex flex-wrap items-center gap-3 px-4 py-3">
                {contact && <Avatar name={contact.full_name} size={38} />}
                <div className="min-w-0 flex-1">
                  <Link
                    href={contact ? `/contacts/${contact.id}` : "#"}
                    className="text-sm font-medium text-slate-900 hover:underline"
                  >
                    {r.title}
                  </Link>
                  <p className="text-xs text-slate-500">
                    {REMINDER_TYPES[r.reminder_type] ?? r.reminder_type} ·{" "}
                    <span className={overdue ? "font-medium text-red-600" : ""}>
                      due {formatDate(r.due_at)}
                    </span>
                    {r.status === "snoozed" && r.snoozed_until && (
                      <> · snoozed until {formatDate(r.snoozed_until)}</>
                    )}
                    {view === "done" && ` · ${r.status}`}
                    {contact?.how_i_know_them && <> · {contact.how_i_know_them}</>}
                  </p>
                  {r.description && (
                    <p className="mt-0.5 text-xs text-slate-400">{r.description}</p>
                  )}
                </div>
                {contact && (r.status === "pending" || r.status === "snoozed") && (
                  <Link
                    href={`/contacts/${contact.id}?tab=messages`}
                    className="btn-secondary !px-3 !py-1.5 text-xs"
                  >
                    Draft message
                  </Link>
                )}
                {(r.status === "pending" || r.status === "snoozed") && (
                  <ReminderActions reminderId={r.id} contactId={r.contact_id} />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
