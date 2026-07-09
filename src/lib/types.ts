export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  timezone: string | null;
  default_follow_up_interval_days: number | null;
  birthday_reminder_days_before: number | null;
  linkedin_followup_days: number | null;
  weekly_digest_enabled: boolean | null;
  created_at: string;
  updated_at: string;
};

export type Contact = {
  id: string;
  owner_id: string;
  full_name: string;
  preferred_name: string | null;
  avatar_url: string | null;
  role_title: string | null;
  company: string | null;
  city: string | null;
  country: string | null;
  timezone: string | null;
  email: string | null;
  phone: string | null;
  whatsapp_phone: string | null;
  linkedin_url: string | null;
  relationship_type: string;
  source: string | null;
  how_i_know_them: string | null;
  relationship_context: string | null;
  linkedin_status: string | null;
  linkedin_requested_at: string | null;
  importance_score: number | null;
  closeness_score: number | null;
  birthday_month: number | null;
  birthday_day: number | null;
  birthday_year: number | null;
  last_contacted_at: string | null;
  next_follow_up_at: string | null;
  follow_up_interval_days: number | null;
  notes: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PersonalFact = {
  id: string;
  owner_id: string;
  contact_id: string;
  label: string;
  value: string;
  fact_type: string | null;
  is_sensitive: boolean | null;
  confidence: string | null;
  created_at: string;
  updated_at: string;
};

export type Interaction = {
  id: string;
  owner_id: string;
  contact_id: string;
  channel: string;
  direction: string | null;
  interaction_at: string;
  summary: string | null;
  message_text: string | null;
  outcome: string | null;
  follow_up_needed: boolean | null;
  follow_up_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Reminder = {
  id: string;
  owner_id: string;
  contact_id: string | null;
  title: string;
  description: string | null;
  reminder_type: string;
  due_at: string;
  status: string | null;
  priority: number | null;
  recurrence_type: string | null;
  recurrence_interval_days: number | null;
  completed_at: string | null;
  snoozed_until: string | null;
  created_at: string;
  updated_at: string;
};

export type MessageDraft = {
  id: string;
  owner_id: string;
  contact_id: string;
  reminder_id: string | null;
  channel: string;
  reason: string;
  tone: string | null;
  generated_text: string;
  edited_text: string | null;
  status: string | null;
  created_at: string;
  sent_at: string | null;
};

export type Tag = {
  id: string;
  owner_id: string;
  name: string;
  color: string | null;
  created_at: string;
};

export type ContactWithTags = Contact & { tags: Tag[] };
export type ReminderWithContact = Reminder & { contact: Contact | null };
