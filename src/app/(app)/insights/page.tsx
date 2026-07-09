import Link from "next/link";
import { requireUser } from "@/lib/supabase/server";
import type { Contact } from "@/lib/types";
import { ContactLine, EmptyState, PageHeader } from "@/components/ui";
import {
  daysOverdue,
  daysSinceContact,
  daysUntilBirthday,
  isIncomplete,
  relationshipHealth,
  urgencyScore,
} from "@/lib/dates";
import { Cake, AlertTriangle, Hourglass, UserPlus, FileWarning, Activity } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const { supabase, user } = await requireUser();

  const [contactsRes, factsRes] = await Promise.all([
    supabase.from("contacts").select("*").eq("owner_id", user.id).is("archived_at", null),
    supabase.from("personal_facts").select("contact_id").eq("owner_id", user.id),
  ]);

  const contacts = (contactsRes.data ?? []) as Contact[];
  const factCounts = new Map<string, number>();
  for (const f of factsRes.data ?? []) {
    factCounts.set(f.contact_id, (factCounts.get(f.contact_id) ?? 0) + 1);
  }

  if (contacts.length === 0) {
    return (
      <>
        <PageHeader title="Insights" />
        <EmptyState
          title="No data yet"
          description="Insights appear once you add contacts and start logging interactions."
          action={{ href: "/contacts/new", label: "Add a contact" }}
        />
      </>
    );
  }

  const overdueFollowUps = contacts
    .filter((c) => daysOverdue(c) > 0)
    .sort((a, b) => daysOverdue(b) - daysOverdue(a));

  const highPriorityNeglected = contacts
    .filter((c) => {
      const since = daysSinceContact(c);
      return (c.importance_score ?? 3) >= 4 && (since === null || since >= 90);
    })
    .sort((a, b) => urgencyScore(b) - urgencyScore(a));

  const birthdaysSoon = contacts
    .filter((c) => {
      const d = daysUntilBirthday(c);
      return d !== null && d <= 30;
    })
    .sort((a, b) => (daysUntilBirthday(a) ?? 0) - (daysUntilBirthday(b) ?? 0));

  const incomplete = contacts.filter((c) => isIncomplete(c, factCounts.get(c.id) ?? 0));

  const pendingLinkedIn = contacts.filter(
    (c) => c.linkedin_status === "request_to_send" || c.linkedin_status === "requested"
  );

  const stale = contacts
    .filter((c) => {
      const since = daysSinceContact(c);
      return since !== null && since >= 90;
    })
    .sort((a, b) => (daysSinceContact(b) ?? 0) - (daysSinceContact(a) ?? 0));

  const healthCounts = { healthy: 0, needs_attention: 0, stale: 0, unknown: 0 };
  for (const c of contacts) healthCounts[relationshipHealth(c)]++;

  const sections = [
    {
      icon: Hourglass,
      title: "Overdue follow-ups",
      items: overdueFollowUps,
      meta: (c: Contact) => `${daysOverdue(c)}d overdue`,
      metaClass: "text-red-600",
      empty: "Nobody is overdue.",
    },
    {
      icon: AlertTriangle,
      title: "High-priority neglected",
      items: highPriorityNeglected,
      meta: (c: Contact) => {
        const since = daysSinceContact(c);
        return since === null ? "never contacted" : `${since}d silent`;
      },
      metaClass: "text-amber-600",
      empty: "Your important relationships are active.",
    },
    {
      icon: Cake,
      title: "Birthdays in the next 30 days",
      items: birthdaysSoon,
      meta: (c: Contact) => `in ${daysUntilBirthday(c)}d`,
      metaClass: "text-pink-600",
      empty: "No birthdays coming up.",
    },
    {
      icon: UserPlus,
      title: "Pending LinkedIn",
      items: pendingLinkedIn,
      meta: (c: Contact) =>
        c.linkedin_status === "requested" ? "request sent" : "request to send",
      metaClass: "text-blue-600",
      empty: "No pending LinkedIn requests.",
    },
    {
      icon: Activity,
      title: "Stale (90+ days silent)",
      items: stale,
      meta: (c: Contact) => `${daysSinceContact(c)}d silent`,
      metaClass: "text-slate-500",
      empty: "No stale relationships.",
    },
    {
      icon: FileWarning,
      title: "Incomplete contacts",
      items: incomplete,
      meta: () => "missing data",
      metaClass: "text-slate-500",
      empty: "All contacts have complete data.",
    },
  ];

  return (
    <>
      <PageHeader title="Insights" subtitle="Who needs attention, and why." />

      {/* Relationship health */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            ["healthy", "Healthy", "text-emerald-600 bg-emerald-50"],
            ["needs_attention", "Needs attention", "text-amber-600 bg-amber-50"],
            ["stale", "Stale", "text-red-600 bg-red-50"],
            ["unknown", "Never contacted", "text-slate-500 bg-slate-100"],
          ] as const
        ).map(([key, label, cls]) => (
          <div key={key} className="card p-4 text-center">
            <p className={`mx-auto w-fit rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
              {label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{healthCounts[key]}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {sections.map(({ icon: Icon, title, items, meta, metaClass, empty }) => (
          <div key={title} className="card p-4">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Icon size={15} className="text-slate-400" />
              {title}
              <span className="ml-auto text-xs font-normal text-slate-400">{items.length}</span>
            </h2>
            {items.length === 0 ? (
              <p className="text-sm text-slate-500">{empty}</p>
            ) : (
              items.slice(0, 8).map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-2">
                  <ContactLine contact={c} />
                  <span className={`shrink-0 text-xs ${metaClass}`}>{meta(c)}</span>
                </div>
              ))
            )}
            {items.length > 8 && (
              <Link href="/contacts" className="mt-2 block text-xs text-indigo-600 hover:underline">
                View all in contacts →
              </Link>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
