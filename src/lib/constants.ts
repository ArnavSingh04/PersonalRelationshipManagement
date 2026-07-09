export const RELATIONSHIP_TYPES = [
  { value: "professional", label: "Professional" },
  { value: "semi_professional", label: "Semi-professional" },
  { value: "family_professional", label: "Family + professional" },
  { value: "friend_professional", label: "Friend + professional" },
  { value: "mentor", label: "Mentor" },
  { value: "peer", label: "Peer" },
  { value: "founder", label: "Founder" },
  { value: "recruiter", label: "Recruiter" },
  { value: "other", label: "Other" },
] as const;

export const LINKEDIN_STATUSES = [
  { value: "unknown", label: "Unknown" },
  { value: "not_connected", label: "Not connected" },
  { value: "request_to_send", label: "Request to send" },
  { value: "requested", label: "Requested" },
  { value: "connected", label: "Connected" },
  { value: "declined", label: "Declined" },
  { value: "not_applicable", label: "Not applicable" },
] as const;

export const FACT_TYPES = [
  { value: "interest", label: "Interest" },
  { value: "family", label: "Family" },
  { value: "career", label: "Career" },
  { value: "education", label: "Education" },
  { value: "location", label: "Location" },
  { value: "goal", label: "Goal" },
  { value: "past_conversation", label: "Past conversation" },
  { value: "birthday", label: "Birthday" },
  { value: "preference", label: "Preference" },
  { value: "general", label: "General" },
  { value: "other", label: "Other" },
] as const;

export const CHANNELS = [
  { value: "linkedin", label: "LinkedIn" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
  { value: "call", label: "Call" },
  { value: "in_person", label: "In person" },
  { value: "event", label: "Event" },
  { value: "other", label: "Other" },
] as const;

export const MESSAGE_REASONS = [
  { value: "check_in", label: "Check-in" },
  { value: "birthday", label: "Birthday" },
  { value: "linkedin_request", label: "LinkedIn request" },
  { value: "linkedin_accepted", label: "After LinkedIn accepted" },
  { value: "reconnect", label: "Reconnect" },
  { value: "thank_you", label: "Thank you" },
  { value: "follow_up", label: "Follow-up" },
  { value: "congrats", label: "Congratulations" },
] as const;

export const MESSAGE_TONES = [
  { value: "warm", label: "Warm" },
  { value: "concise", label: "Concise" },
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "grateful", label: "Grateful" },
] as const;

export const REMINDER_TYPES: Record<string, string> = {
  follow_up: "Follow-up",
  birthday: "Birthday",
  linkedin_request_followup: "LinkedIn follow-up",
  custom: "Custom",
  data_enrichment: "Enrich data",
};

export function labelFor(
  list: readonly { value: string; label: string }[],
  value: string | null | undefined
): string {
  if (!value) return "—";
  return list.find((i) => i.value === value)?.label ?? value;
}
