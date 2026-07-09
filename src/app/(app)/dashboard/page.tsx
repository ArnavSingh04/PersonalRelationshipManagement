import Link from "next/link";
import { requireUser } from "@/lib/supabase/server";
import type { Contact, Reminder } from "@/lib/types";
import { ContactLine, EmptyState, PageHeader } from "@/components/ui";
import { ReminderActions } from "@/components/reminder-actions";
import { daysUntilBirthday, daysOverdue } from "@/lib/dates";
import { REMINDER_TYPES } from "@/lib/constants";
import { formatDate } from "@/lib/dates";
import { Cake, AlertTriangle, Bell, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { supabase, user } = await requireUser();

  const [contactsRes, remindersRes, factCountsRes] = await Promise.all([
    supabase.from("contacts").select("*").eq("owner_id", user.id).is("archived_at", null),
    supabase
      .from("reminders")
      .select("*")
      .eq("owner_id", user.id)
      .in("status", ["pending", "snoozed"])
      .order("due_at"),
    supabase.from("personal_facts").select("contact_id").eq("owner_id", user.id),
  ]);

  const contacts = (contactsRes.data ?? []) as Contact[];
  const reminders = (remindersRes.data ?? []) as Reminder[];
  const factContactIds = new Set((factCountsRes.data ?? []).map((f) => f.contact_id));
  const contactById = new Map(contacts.map((c) => [c.id, c]));

  const now = new Date();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const weekOut = new Date(now.getTime() + 7 * 86400000);

  const dueToday = reminders.filter(
    (r) => r.status === "pending" && new Date(r.due_at) < endOfToday
  );
  const dueThisWeek = reminders.filter(
    (r) =>
      r.status === "pending" &&
      new Date(r.due_at) >= endOfToday &&
      new Date(r.due_at) <= weekOut
  );

  const birthdaysToday = contacts.filter((c) => daysUntilBirthday(c) === 0);
  const birthdaysThisWeek = contacts
    .filter((c) => {
      const d = daysUntilBirthday(c);
      return d !== null && d > 0 && d <= 7;
    })
    .sort((a, b) => (daysUntilBirthday(a) ?? 0) - (daysUntilBirthday(b) ?? 0));

  const highPriorityOverdue = contacts
    .filter((c) => (c.importance_score ?? 3) >= 4 && daysOverdue(c) > 0)
    .sort((a, b) => daysOverdue(b) - daysOverdue(a));

  const linkedinStale = contacts.filter((c) => {
    if (c.linkedin_status !== "requested" || !c.linkedin_requested_at) return false;
    return (now.getTime() - new Date(c.linkedin_requested_at).getTime()) / 86400000 >= 14;
  });

  const noFacts = contacts.filter((c) => !factContactIds.has(c.id));

  const recentlyAdded = [...contacts]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const hasAnyContacts = contacts.length > 0;

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={new Intl.DateTimeFormat("en", {
          weekday: "long",
          day: "numeric",
          month: "long",
        }).format(now)}
      />

      {!hasAnyContacts ? (
        <EmptyState
          title="Welcome to RelateLoop"
          description="Start by adding the people you want to stay in touch with. RelateLoop will remind you to follow up and help you write warmer messages."
          action={{ href: "/contacts/new", label: "Add your first contact" }}
        />
      ) : (
        <div className="space-y-6">
          {/* Today */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              <Bell size={15} /> Today
            </h2>
            {dueToday.length === 0 && birthdaysToday.length === 0 ? (
              <p className="card px-4 py-6 text-center text-sm text-slate-500">
                Nothing due today. Enjoy the quiet.
              </p>
            ) : (
              <div className="space-y-2">
                {birthdaysToday.map((c) => (
                  <div
                    key={c.id}
                    className="card flex items-center gap-3 border-pink-200 bg-pink-50/50 px-4 py-3"
                  >
                    <Cake size={18} className="shrink-0 text-pink-500" />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/contacts/${c.id}?tab=messages`}
                        className="text-sm font-medium text-slate-900 hover:underline"
                      >
                        {c.full_name} has a birthday today
                      </Link>
                      <p className="text-xs text-slate-500">Send them wishes now</p>
                    </div>
                    <Link href={`/contacts/${c.id}?tab=messages`} className="btn-primary !py-1.5">
                      Draft wishes
                    </Link>
                  </div>
                ))}
                {dueToday.map((r) => {
                  const c = r.contact_id ? contactById.get(r.contact_id) : null;
                  return (
                    <div key={r.id} className="card flex flex-wrap items-center gap-2 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={c ? `/contacts/${c.id}` : "/reminders"}
                          className="text-sm font-medium text-slate-900 hover:underline"
                        >
                          {r.title}
                        </Link>
                        <p className="text-xs text-slate-500">
                          {REMINDER_TYPES[r.reminder_type] ?? r.reminder_type} · due{" "}
                          {formatDate(r.due_at)}
                          {c?.how_i_know_them ? ` · ${c.how_i_know_them}` : ""}
                        </p>
                      </div>
                      <ReminderActions reminderId={r.id} contactId={r.contact_id} />
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* This week */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              <Cake size={15} /> This week
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="card p-4">
                <h3 className="mb-2 text-sm font-semibold text-slate-800">Upcoming birthdays</h3>
                {birthdaysThisWeek.length === 0 ? (
                  <p className="text-sm text-slate-500">No birthdays in the next 7 days.</p>
                ) : (
                  birthdaysThisWeek.map((c) => (
                    <div key={c.id} className="flex items-center justify-between gap-2">
                      <ContactLine contact={c} />
                      <span className="shrink-0 text-xs text-pink-600">
                        in {daysUntilBirthday(c)}d
                      </span>
                    </div>
                  ))
                )}
              </div>
              <div className="card p-4">
                <h3 className="mb-2 text-sm font-semibold text-slate-800">Follow-ups due soon</h3>
                {dueThisWeek.length === 0 ? (
                  <p className="text-sm text-slate-500">No follow-ups scheduled this week.</p>
                ) : (
                  dueThisWeek.slice(0, 6).map((r) => {
                    const c = r.contact_id ? contactById.get(r.contact_id) : null;
                    return c ? (
                      <div key={r.id} className="flex items-center justify-between gap-2">
                        <ContactLine contact={c} />
                        <span className="shrink-0 text-xs text-slate-500">
                          {formatDate(r.due_at)}
                        </span>
                      </div>
                    ) : null;
                  })
                )}
              </div>
            </div>
          </section>

          {/* Needs attention */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              <AlertTriangle size={15} /> Needs attention
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="card p-4">
                <h3 className="mb-2 text-sm font-semibold text-slate-800">
                  High-priority overdue
                </h3>
                {highPriorityOverdue.length === 0 ? (
                  <p className="text-sm text-slate-500">All important people are up to date.</p>
                ) : (
                  highPriorityOverdue.slice(0, 5).map((c) => (
                    <div key={c.id} className="flex items-center justify-between gap-2">
                      <ContactLine contact={c} />
                      <span className="shrink-0 text-xs font-medium text-red-600">
                        {daysOverdue(c)}d over
                      </span>
                    </div>
                  ))
                )}
              </div>
              <div className="card p-4">
                <h3 className="mb-2 text-sm font-semibold text-slate-800">
                  LinkedIn requests pending
                </h3>
                {linkedinStale.length === 0 ? (
                  <p className="text-sm text-slate-500">No stale LinkedIn requests.</p>
                ) : (
                  linkedinStale.slice(0, 5).map((c) => (
                    <div key={c.id} className="flex items-center justify-between gap-2">
                      <ContactLine contact={c} />
                      <span className="shrink-0 text-xs text-amber-600">
                        {Math.floor(
                          (now.getTime() - new Date(c.linkedin_requested_at!).getTime()) /
                            86400000
                        )}
                        d ago
                      </span>
                    </div>
                  ))
                )}
              </div>
              <div className="card p-4">
                <h3 className="mb-2 text-sm font-semibold text-slate-800">No personal facts</h3>
                {noFacts.length === 0 ? (
                  <p className="text-sm text-slate-500">Every contact has context. Nice.</p>
                ) : (
                  noFacts.slice(0, 5).map((c) => (
                    <div key={c.id} className="flex items-center justify-between gap-2">
                      <ContactLine contact={c} />
                      <Link
                        href={`/contacts/${c.id}?tab=context`}
                        className="shrink-0 text-xs text-indigo-600 hover:underline"
                      >
                        Add facts
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          {/* Recently added */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              <Sparkles size={15} /> Recently added
            </h2>
            <div className="card p-4">
              {recentlyAdded.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-2">
                  <ContactLine contact={c} />
                  {!factContactIds.has(c.id) && (
                    <Link
                      href={`/contacts/${c.id}?tab=context`}
                      className="shrink-0 text-xs text-indigo-600 hover:underline"
                    >
                      Enrich profile
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
