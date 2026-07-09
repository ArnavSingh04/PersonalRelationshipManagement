import { differenceInCalendarDays, format, formatDistanceToNow } from "date-fns";
import type { Contact } from "./types";

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return format(new Date(value), "d MMM yyyy");
}

export function relativeDate(value: string | null | undefined): string {
  if (!value) return "never";
  return formatDistanceToNow(new Date(value), { addSuffix: true });
}

export function birthdayLabel(contact: Contact): string {
  if (!contact.birthday_month || !contact.birthday_day) return "—";
  const d = new Date(2000, contact.birthday_month - 1, contact.birthday_day);
  const base = format(d, "d MMM");
  return contact.birthday_year ? `${base} ${contact.birthday_year}` : base;
}

/** Days until next occurrence of the contact's birthday, or null if unset. */
export function daysUntilBirthday(contact: Contact, from = new Date()): number | null {
  if (!contact.birthday_month || !contact.birthday_day) return null;
  const year = from.getFullYear();
  let next = new Date(year, contact.birthday_month - 1, contact.birthday_day);
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  if (next < today) {
    next = new Date(year + 1, contact.birthday_month - 1, contact.birthday_day);
  }
  return differenceInCalendarDays(next, today);
}

export function daysOverdue(contact: Contact, from = new Date()): number {
  if (!contact.next_follow_up_at) return 0;
  const diff = differenceInCalendarDays(from, new Date(contact.next_follow_up_at));
  return Math.max(diff, 0);
}

export function daysSinceContact(contact: Contact, from = new Date()): number | null {
  if (!contact.last_contacted_at) return null;
  return differenceInCalendarDays(from, new Date(contact.last_contacted_at));
}

/**
 * Relationship urgency score per PRD section 16.
 */
export function urgencyScore(contact: Contact, from = new Date()): number {
  const importance = contact.importance_score ?? 3;
  const closeness = contact.closeness_score ?? 2;
  const overdueCapped = Math.min(daysOverdue(contact, from), 60);
  const untilBirthday = daysUntilBirthday(contact, from);
  const birthdayBonus = untilBirthday !== null && untilBirthday <= 7 ? 30 : 0;
  const linkedinBonus =
    contact.linkedin_status === "requested" || contact.linkedin_status === "request_to_send"
      ? 15
      : 0;
  const since = daysSinceContact(contact, from);
  const recentPenalty = since !== null && since <= 14 ? 30 : 0;

  return Math.round(
    importance * 25 +
      closeness * 10 +
      overdueCapped * 1.5 +
      birthdayBonus +
      linkedinBonus -
      recentPenalty
  );
}

export type RelationshipHealth = "healthy" | "needs_attention" | "stale" | "unknown";

export function relationshipHealth(contact: Contact, from = new Date()): RelationshipHealth {
  const since = daysSinceContact(contact, from);
  if (since === null) return "unknown";
  if (since <= 90) return "healthy";
  if (since <= 180) return "needs_attention";
  return "stale";
}

export function isIncomplete(contact: Contact, factCount = 0): boolean {
  return (
    !contact.city ||
    !contact.country ||
    !contact.how_i_know_them ||
    !contact.linkedin_url ||
    factCount === 0
  );
}
