-- RelateLoop initial schema
-- All user-owned tables have owner_id and RLS enabled.

-- ============================================================
-- profiles
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  timezone text default 'Asia/Kolkata',
  default_follow_up_interval_days integer default 90,
  birthday_reminder_days_before integer default 7,
  linkedin_followup_days integer default 14,
  weekly_digest_enabled boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can select their own profile"
on public.profiles for select
to authenticated
using (id = auth.uid());

create policy "Users can insert their own profile"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

create policy "Users can update their own profile"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ============================================================
-- contacts
-- ============================================================
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,

  full_name text not null,
  preferred_name text,
  avatar_url text,

  role_title text,
  company text,
  city text,
  country text,
  timezone text,

  email text,
  phone text,
  whatsapp_phone text,
  linkedin_url text,

  relationship_type text not null default 'professional',
  source text,
  how_i_know_them text,
  relationship_context text,

  linkedin_status text default 'unknown',
  linkedin_requested_at timestamptz,
  importance_score integer default 3 check (importance_score between 1 and 5),
  closeness_score integer default 2 check (closeness_score between 1 and 5),

  birthday_month integer check (birthday_month between 1 and 12),
  birthday_day integer check (birthday_day between 1 and 31),
  birthday_year integer,

  last_contacted_at timestamptz,
  next_follow_up_at timestamptz,
  follow_up_interval_days integer default 90,

  notes text,
  archived_at timestamptz,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.contacts enable row level security;

create policy "Users can select their own contacts"
on public.contacts for select
to authenticated
using (owner_id = auth.uid());

create policy "Users can insert their own contacts"
on public.contacts for insert
to authenticated
with check (owner_id = auth.uid());

create policy "Users can update their own contacts"
on public.contacts for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Users can delete their own contacts"
on public.contacts for delete
to authenticated
using (owner_id = auth.uid());

create index if not exists contacts_owner_id_idx on public.contacts (owner_id);
create index if not exists contacts_next_follow_up_at_idx on public.contacts (next_follow_up_at);
create index if not exists contacts_last_contacted_at_idx on public.contacts (last_contacted_at);
create index if not exists contacts_birthday_idx on public.contacts (birthday_month, birthday_day);
create index if not exists contacts_linkedin_status_idx on public.contacts (linkedin_status);
create index if not exists contacts_importance_score_idx on public.contacts (importance_score);

-- ============================================================
-- personal_facts
-- ============================================================
create table if not exists public.personal_facts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,

  label text not null,
  value text not null,
  fact_type text default 'general',
  is_sensitive boolean default false,
  confidence text default 'user_entered',

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.personal_facts enable row level security;

create policy "Users can select their own personal_facts"
on public.personal_facts for select
to authenticated
using (owner_id = auth.uid());

create policy "Users can insert their own personal_facts"
on public.personal_facts for insert
to authenticated
with check (owner_id = auth.uid());

create policy "Users can update their own personal_facts"
on public.personal_facts for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Users can delete their own personal_facts"
on public.personal_facts for delete
to authenticated
using (owner_id = auth.uid());

create index if not exists personal_facts_owner_id_idx on public.personal_facts (owner_id);
create index if not exists personal_facts_contact_id_idx on public.personal_facts (contact_id);

-- ============================================================
-- interactions
-- ============================================================
create table if not exists public.interactions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,

  channel text not null,
  direction text default 'outbound',
  interaction_at timestamptz not null default now(),

  summary text,
  message_text text,
  outcome text,
  follow_up_needed boolean default false,
  follow_up_at timestamptz,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.interactions enable row level security;

create policy "Users can select their own interactions"
on public.interactions for select
to authenticated
using (owner_id = auth.uid());

create policy "Users can insert their own interactions"
on public.interactions for insert
to authenticated
with check (owner_id = auth.uid());

create policy "Users can update their own interactions"
on public.interactions for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Users can delete their own interactions"
on public.interactions for delete
to authenticated
using (owner_id = auth.uid());

create index if not exists interactions_owner_id_idx on public.interactions (owner_id);
create index if not exists interactions_contact_id_idx on public.interactions (contact_id);
create index if not exists interactions_interaction_at_idx on public.interactions (interaction_at);

-- ============================================================
-- reminders
-- ============================================================
create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete cascade,

  title text not null,
  description text,
  reminder_type text not null,
  due_at timestamptz not null,

  status text default 'pending',
  priority integer default 3 check (priority between 1 and 5),

  recurrence_type text,
  recurrence_interval_days integer,

  completed_at timestamptz,
  snoozed_until timestamptz,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.reminders enable row level security;

create policy "Users can select their own reminders"
on public.reminders for select
to authenticated
using (owner_id = auth.uid());

create policy "Users can insert their own reminders"
on public.reminders for insert
to authenticated
with check (owner_id = auth.uid());

create policy "Users can update their own reminders"
on public.reminders for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Users can delete their own reminders"
on public.reminders for delete
to authenticated
using (owner_id = auth.uid());

create index if not exists reminders_owner_id_idx on public.reminders (owner_id);
create index if not exists reminders_contact_id_idx on public.reminders (contact_id);
create index if not exists reminders_due_at_idx on public.reminders (due_at);
create index if not exists reminders_status_idx on public.reminders (status);

-- ============================================================
-- message_drafts
-- ============================================================
create table if not exists public.message_drafts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  reminder_id uuid references public.reminders(id) on delete set null,

  channel text not null,
  reason text not null,
  tone text default 'warm',
  generated_text text not null,
  edited_text text,
  status text default 'draft',

  created_at timestamptz default now(),
  sent_at timestamptz
);

alter table public.message_drafts enable row level security;

create policy "Users can select their own message_drafts"
on public.message_drafts for select
to authenticated
using (owner_id = auth.uid());

create policy "Users can insert their own message_drafts"
on public.message_drafts for insert
to authenticated
with check (owner_id = auth.uid());

create policy "Users can update their own message_drafts"
on public.message_drafts for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Users can delete their own message_drafts"
on public.message_drafts for delete
to authenticated
using (owner_id = auth.uid());

create index if not exists message_drafts_owner_id_idx on public.message_drafts (owner_id);
create index if not exists message_drafts_contact_id_idx on public.message_drafts (contact_id);

-- ============================================================
-- tags and contact_tags
-- ============================================================
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text,
  created_at timestamptz default now(),
  unique (owner_id, name)
);

alter table public.tags enable row level security;

create policy "Users can select their own tags"
on public.tags for select
to authenticated
using (owner_id = auth.uid());

create policy "Users can insert their own tags"
on public.tags for insert
to authenticated
with check (owner_id = auth.uid());

create policy "Users can update their own tags"
on public.tags for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Users can delete their own tags"
on public.tags for delete
to authenticated
using (owner_id = auth.uid());

create index if not exists tags_owner_id_idx on public.tags (owner_id);

create table if not exists public.contact_tags (
  contact_id uuid references public.contacts(id) on delete cascade,
  tag_id uuid references public.tags(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  primary key (contact_id, tag_id)
);

alter table public.contact_tags enable row level security;

create policy "Users can select their own contact_tags"
on public.contact_tags for select
to authenticated
using (owner_id = auth.uid());

create policy "Users can insert their own contact_tags"
on public.contact_tags for insert
to authenticated
with check (owner_id = auth.uid());

create policy "Users can update their own contact_tags"
on public.contact_tags for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Users can delete their own contact_tags"
on public.contact_tags for delete
to authenticated
using (owner_id = auth.uid());

create index if not exists contact_tags_owner_id_idx on public.contact_tags (owner_id);
create index if not exists contact_tags_tag_id_idx on public.contact_tags (tag_id);

-- ============================================================
-- updated_at trigger
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger set_contacts_updated_at before update on public.contacts
for each row execute function public.set_updated_at();
create trigger set_personal_facts_updated_at before update on public.personal_facts
for each row execute function public.set_updated_at();
create trigger set_interactions_updated_at before update on public.interactions
for each row execute function public.set_updated_at();
create trigger set_reminders_updated_at before update on public.reminders
for each row execute function public.set_updated_at();
