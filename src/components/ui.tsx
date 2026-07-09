import Link from "next/link";
import type { Contact } from "@/lib/types";
import { labelFor, LINKEDIN_STATUSES, RELATIONSHIP_TYPES } from "@/lib/constants";

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  const hues = [210, 250, 280, 330, 20, 160, 190];
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) % 997;
  const hue = hues[hash % hues.length];
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `hsl(${hue} 65% 55%)`,
      }}
    >
      {initials || "?"}
    </div>
  );
}

export function ImportanceStars({ score }: { score: number | null }) {
  const s = score ?? 3;
  return (
    <span className="text-xs tracking-tight text-amber-500" title={`Importance ${s}/5`}>
      {"★".repeat(s)}
      <span className="text-slate-300">{"★".repeat(5 - s)}</span>
    </span>
  );
}

export function RelationshipBadge({ type }: { type: string }) {
  return (
    <span className="chip bg-slate-100 text-slate-600">
      {labelFor(RELATIONSHIP_TYPES, type)}
    </span>
  );
}

const LINKEDIN_COLORS: Record<string, string> = {
  connected: "bg-emerald-50 text-emerald-700",
  requested: "bg-amber-50 text-amber-700",
  request_to_send: "bg-blue-50 text-blue-700",
  not_connected: "bg-slate-100 text-slate-600",
  declined: "bg-red-50 text-red-600",
  unknown: "bg-slate-100 text-slate-500",
  not_applicable: "bg-slate-100 text-slate-400",
};

export function LinkedInBadge({ status }: { status: string | null }) {
  const s = status ?? "unknown";
  return (
    <span className={`chip ${LINKEDIN_COLORS[s] ?? "bg-slate-100 text-slate-500"}`}>
      in · {labelFor(LINKEDIN_STATUSES, s)}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-12 text-center">
      <p className="text-sm font-medium text-slate-700">{title}</p>
      <p className="max-w-sm text-sm text-slate-500">{description}</p>
      {action && (
        <Link href={action.href} className="btn-primary mt-3">
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function ContactLine({ contact }: { contact: Contact }) {
  return (
    <Link
      href={`/contacts/${contact.id}`}
      className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50"
    >
      <Avatar name={contact.full_name} size={36} />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-900">{contact.full_name}</p>
        <p className="truncate text-xs text-slate-500">
          {[contact.role_title, contact.company].filter(Boolean).join(" · ") ||
            contact.how_i_know_them ||
            "—"}
        </p>
      </div>
    </Link>
  );
}

export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}
