# PRD: Personal Relationship Management Platform

**Working title:** RelateLoop
**Product type:** Private personal CRM / relationship memory system
**Primary user:** One person managing professional and important semi-professional relationships
**Primary platform:** Mobile-friendly web app, usable on phone and laptop
**Backend:** Supabase Postgres
**Core principle:** Help the user maintain meaningful relationships without becoming a spammy outreach tool.

---

## 1. Product Summary

RelateLoop is a private Personal Relationship Management platform that helps the user remember, organize, and intentionally maintain professional and semi-professional relationships.

The product starts as a better version of an Excel sheet: each person has structured details like name, city, country, birthday, LinkedIn URL, relationship context, how the user knows them, personal notes, interests, last contacted date, LinkedIn request status, and next follow-up date.

The product then adds intelligence around reminders, outreach drafting, birthdays, stale relationships, and relationship prioritization. Every 3 months, or at a custom interval, the app should remind the user to reach out. The reminder should include useful context such as “they like badminton,” “they recently moved to Berlin,” or “you met them through X,” so the user can send a warmer, more personal message.

The MVP should **not** automatically send LinkedIn or WhatsApp messages. It should generate editable message drafts and open the relevant channel. LinkedIn API access is business-line-specific and governed by API terms, so this product should not rely on LinkedIn automation as a fundamental MVP dependency. ([Microsoft Learn][1])

---

## 2. Problem Statement

The user meets valuable people through LinkedIn, work, friends, family, online communities, events, and semi-professional contexts. Over time, these relationships decay because the user forgets to follow up, forgets personal details, misses birthdays, or does not know whom to prioritize.

Existing solutions are either too manual, like spreadsheets, or too sales-focused, like CRMs. The user needs a lightweight, private, mobile-first relationship system that helps them maintain genuine relationships over months and years.

---

## 3. Goals

### Primary goals

1. Store all important professional and semi-professional contacts in one private database.
2. Track key relationship details: who they are, where they are, how the user knows them, and what personal context matters.
3. Remind the user to follow up every 3 months by default.
4. Generate warm, personal, editable outreach drafts using saved context.
5. Show useful dashboards: birthdays coming up, people not contacted in a long time, pending LinkedIn requests, and high-priority relationships.
6. Work beautifully on both phone and laptop.

### Secondary goals

1. Support voice-based quick capture for adding or updating contacts.
2. Support CSV import/export so the app never feels like a data trap.
3. Support Gmail-based reminder notifications.
4. Optionally integrate Gmail for drafting or sending emails with explicit user action.
5. Optionally support WhatsApp click-to-chat links with prefilled messages. WhatsApp officially supports prefilled message links using `wa.me` URLs. ([WhatsApp Help Center][2])
6. Eventually provide smarter recommendations based on relationship importance, contact frequency, and upcoming events.

---

## 4. Non-Goals

The product should **not** be:

1. A mass outreach tool.
2. A LinkedIn scraping tool.
3. A tool that sends messages without user review.
4. A sales CRM with pipeline, deals, revenue forecasting, and team management.
5. A system that stores other people’s private data irresponsibly.
6. A replacement for LinkedIn, Gmail, WhatsApp, or Google Contacts.

---

## 5. Recommended Tech Stack

Use a modern full-stack web app with Supabase as the backend.

**Frontend**

* Next.js with App Router
* TypeScript
* Tailwind CSS
* Responsive mobile-first layout
* Server Actions or API routes for mutations
* React Hook Form + Zod for forms and validation
* TanStack Table or equivalent for contact list filtering/sorting

Next.js App Router supports React Server Components and related modern React patterns, and Next.js Server Functions can handle mutations while requiring authentication and authorization checks inside server-side code. ([Next.js][3])

**Backend**

* Supabase Postgres
* Supabase Auth
* Supabase Row Level Security
* Supabase Edge Functions for scheduled jobs, integrations, message generation, and reminder notifications
* Supabase Cron / `pg_cron` for scheduled reminder jobs

Supabase provides Postgres, Auth, instant APIs, Edge Functions, Storage, Realtime, and Vector capabilities. ([Supabase][4]) Supabase Auth supports common auth methods including password, magic link, OTP, social login, and SSO, and it integrates with Row Level Security for database authorization. ([Supabase][5]) Supabase docs state that RLS should always be enabled on tables in exposed schemas such as `public`. ([Supabase][6]) Supabase Edge Functions are server-side TypeScript functions suitable for third-party integrations and sending transactional emails, and scheduled Edge Functions can be invoked using `pg_cron` with `pg_net`. ([Supabase][7])

**Integrations**

* Gmail reminder emails: MVP can use a transactional email provider or Gmail API.
* Gmail API: optional later integration for creating/sending email drafts after OAuth.
* LinkedIn: MVP should support LinkedIn URL storage, status tracking, draft generation, and manual send.
* WhatsApp: support message draft and optional click-to-chat link.
* Calendar: optional later integration for birthday/follow-up reminders.

Gmail API requests require OAuth 2.0, and Gmail’s `users.messages.send` endpoint supports sending email using scopes such as `gmail.send`. ([Google for Developers][8])

---

## 6. Product Principles

1. **Personal, not spammy**
   The app should encourage thoughtful, relevant messages.

2. **Manual-first, automation-assisted**
   Automate remembering, drafting, and reminding. Do not auto-send sensitive relationship messages by default.

3. **Fast capture**
   Adding a contact from phone should take less than a minute.

4. **Context at the moment of action**
   When a reminder appears, it should show why the person matters and what the user knows about them.

5. **Privacy by design**
   Relationship notes are sensitive. Use RLS, authenticated access, minimal scopes, and export/delete controls.

6. **Mobile-first UX**
   The phone experience should not be an afterthought.

---

## 7. User Personas

### Primary Persona: Relationship-conscious professional

The user wants to maintain a strong network without feeling transactional. They meet people through LinkedIn, work, communities, and personal introductions. They need reminders and context to follow up meaningfully.

### Secondary Persona: Future power user

The user may later want AI suggestions, Gmail sync, contact import, voice capture, and prioritization across hundreds of relationships.

---

## 8. Core User Stories

### Contact management

* As a user, I can add a new person with name, role, company, city, country, LinkedIn URL, email, phone, birthday, and notes.
* As a user, I can record how I know someone.
* As a user, I can tag someone as `SWE`, `founder`, `family`, `mentor`, `LinkedIn`, `conference`, etc.
* As a user, I can mark relationship type: professional, semi-professional, family-professional, friend-professional, mentor, recruiter, founder, peer, etc.
* As a user, I can set importance from 1 to 5.

### Personal memory

* As a user, I can save personal facts like interests, family details, hobbies, goals, past conversations, and important life updates.
* As a user, I can mark certain facts as sensitive so they are not casually included in message drafts.
* As a user, I can see a timeline of past interactions.

### Outreach reminders

* As a user, I get a default follow-up reminder every 3 months after the last interaction.
* As a user, I can customize follow-up interval per contact.
* As a user, I can snooze or complete reminders.
* As a user, completing a reminder should prompt me to log the interaction.

### Message drafting

* As a user, I can generate a LinkedIn, WhatsApp, or email message draft.
* As a user, I can choose the reason: LinkedIn request, 3-month check-in, birthday, follow-up, congratulations, thank-you, or reconnect.
* As a user, I can choose tone: warm, concise, professional, casual, or grateful.
* As a user, I can choose which personal facts to include.
* As a user, the app must never send a message without my explicit action.

### Insights

* As a user, I can see upcoming birthdays.
* As a user, I can see people I have not contacted in 90+ days.
* As a user, I can see high-priority people who are overdue.
* As a user, I can see pending LinkedIn requests.
* As a user, I can see contacts missing important data.

### Quick capture

* As a user, I can quickly add a person after meeting them.
* As a user, I can paste or dictate a note like:
  “Met Karan at the React meetup. He works at Razorpay, lives in Bangalore, likes cycling, and said he’s interested in infra roles. Follow up in 2 months.”
* As a user, the app should parse this into structured fields, but ask me to confirm before saving.

---

## 9. MVP Scope

### P0: Must-have MVP

1. Authentication
2. Contact CRUD
3. Contact detail page
4. Personal facts / notes
5. Interaction history
6. Reminder system
7. Dashboard
8. Upcoming birthdays
9. Stale contacts
10. Message draft generator
11. LinkedIn status tracking
12. CSV import/export
13. Mobile-first responsive UI
14. Supabase RLS policies
15. Basic settings

### P1: Strong next version

1. Voice quick-add
2. Gmail reminder emails
3. WhatsApp prefilled message links
4. Smarter relationship scoring
5. Contact data completeness score
6. Better search and filters
7. AI-assisted contact parsing from notes
8. AI-assisted message suggestions with fact selection

### P2: Advanced version

1. Gmail OAuth integration for email drafts
2. Gmail interaction sync
3. Calendar integration
4. LinkedIn official API investigation
5. Contact import from Google Contacts
6. Duplicate detection
7. Relationship graph
8. Natural-language query: “Who have I not contacted in Germany?”
9. Weekly relationship digest

---

## 10. Key Product Flows

### Flow 1: Add contact manually

1. User clicks “Add Contact.”
2. User enters required fields:

   * Full name
   * Relationship type
   * How I know them
3. User optionally adds:

   * City
   * Country
   * Company
   * Role
   * LinkedIn URL
   * Birthday
   * Personal facts
   * Importance score
   * Follow-up interval
4. App saves contact.
5. App creates default next follow-up reminder based on follow-up interval, default 90 days.

### Flow 2: Add contact from voice/text quick capture

1. User taps “Quick Add.”
2. User types or dictates freeform text.
3. App extracts candidate fields.
4. User sees a review screen:

   * Extracted name
   * Company
   * City
   * Country
   * Interests
   * Birthday
   * How I know them
   * Suggested tags
   * Suggested follow-up date
5. User edits fields.
6. User saves contact.

### Flow 3: 3-month follow-up

1. Scheduled job checks contacts daily.
2. App finds contacts whose `next_follow_up_at <= now`.
3. App creates reminders.
4. Dashboard shows “Due for follow-up.”
5. User opens reminder.
6. App shows:

   * Person summary
   * Last contacted date
   * How user knows them
   * Personal facts
   * Suggested message
7. User edits message.
8. User sends manually via LinkedIn, WhatsApp, or email.
9. User marks reminder as complete.
10. App asks user to log interaction.
11. App updates `last_contacted_at` and calculates next reminder.

### Flow 4: Birthday reminder

1. Daily job checks birthdays in the next configurable window, default 7 or 14 days.
2. Dashboard shows upcoming birthdays.
3. On the birthday, app surfaces a birthday message draft.
4. User sends manually.
5. User logs interaction.
6. Birthday reminder is marked complete for that year.

### Flow 5: LinkedIn connection request

1. User creates contact from a LinkedIn relationship.
2. User sets LinkedIn status to `not_connected`.
3. User clicks “Generate LinkedIn Request.”
4. App generates a short connection note.
5. User copies message or opens LinkedIn profile URL.
6. User manually sends request.
7. User updates status to `requested`.
8. App creates follow-up reminder in 14–30 days.

---

## 11. UX Requirements

### Global layout

Desktop:

* Left sidebar navigation
* Main content area
* Right contextual panel on contact detail pages

Mobile:

* Bottom navigation
* Large touch targets
* Sticky “Add” button
* Search at top
* Cards instead of dense tables where appropriate

### Navigation

Main routes:

* `/dashboard`
* `/contacts`
* `/contacts/new`
* `/contacts/[id]`
* `/reminders`
* `/messages`
* `/insights`
* `/quick-add`
* `/settings`

### Dashboard sections

1. **Today**

   * Follow-ups due today
   * Birthdays today
   * Pending reminders

2. **This week**

   * Upcoming birthdays
   * Follow-ups due soon

3. **Needs attention**

   * High-importance contacts overdue
   * LinkedIn requests pending too long
   * Contacts with no personal facts

4. **Recently added**

   * Latest contacts
   * Prompt to enrich incomplete profiles

### Contact list

Required capabilities:

* Search by name, company, city, country, tag, note
* Filter by relationship type
* Filter by LinkedIn status
* Filter by due/overdue
* Filter by importance
* Sort by last contacted
* Sort by next follow-up
* Sort by birthday
* Sort by relationship score

### Contact profile

Tabs:

1. **Overview**

   * Name
   * Role/company
   * City/country
   * Relationship type
   * Importance
   * LinkedIn status
   * Last contacted
   * Next follow-up
   * Birthday

2. **Personal context**

   * Interests
   * Family/professional crossover
   * Past topics
   * Sensitive facts
   * Things to ask about

3. **Timeline**

   * Interactions
   * Messages
   * Reminders completed
   * Relationship updates

4. **Reminders**

   * Active reminders
   * Snoozed reminders
   * Completed reminders

5. **Message drafts**

   * Draft history
   * Generate new draft

### Message composer UX

Inputs:

* Channel: LinkedIn, WhatsApp, Email, Other
* Reason: check-in, birthday, LinkedIn request, reconnect, thank-you, follow-up, congrats
* Tone: concise, warm, professional, casual
* Facts to include: selectable chips
* Max length: short, medium, long

Outputs:

* Editable message text
* Copy button
* Open LinkedIn button
* Open WhatsApp button
* Log as interaction button

Important UX rule: show the personal facts being used. The user should be able to remove any fact before generating or sending.

---

## 12. Suggested Message Templates

### LinkedIn connection request

> Hey {{first_name}}, great connecting through {{how_met}}. I enjoyed learning about {{specific_context}} and would love to stay in touch here.

### 3-month professional check-in

> Hey {{first_name}}, hope you’ve been doing well. I remembered you were working on {{personal_or_professional_context}} and wanted to check in — how’s that going?

### Warmer semi-professional check-in

> Hey {{first_name}}, hope you’re doing well. I was thinking about our conversation around {{topic}} and wanted to say hi. How have things been on your end?

### Birthday

> Happy birthday, {{first_name}}! Hope you have a great day and an even better year ahead.

### Reconnect after long gap

> Hey {{first_name}}, it’s been a while. I was revisiting my notes and remembered our conversation about {{topic}}. Hope you’ve been doing well — would be nice to catch up sometime.

### After LinkedIn request accepted

> Hey {{first_name}}, thanks for connecting. I enjoyed learning about {{context}}. Looking forward to staying in touch.

---

## 13. Data Model

Use Supabase Postgres with RLS enabled on all user-owned tables.

### Core tables

#### `profiles`

Stores app-level user settings.

```sql
profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  timezone text default 'Asia/Kolkata',
  default_follow_up_interval_days integer default 90,
  birthday_reminder_days_before integer default 7,
  weekly_digest_enabled boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
)
```

#### `contacts`

Stores one row per person.

```sql
contacts (
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
)
```

Recommended `linkedin_status` values:

* `unknown`
* `not_connected`
* `request_to_send`
* `requested`
* `connected`
* `declined`
* `not_applicable`

Recommended `relationship_type` values:

* `professional`
* `semi_professional`
* `family_professional`
* `mentor`
* `peer`
* `founder`
* `recruiter`
* `friend_professional`
* `other`

#### `personal_facts`

Stores structured personal memory.

```sql
personal_facts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,

  label text not null,
  value text not null,
  fact_type text default 'general',
  is_sensitive boolean default false,
  confidence text default 'user_entered',

  created_at timestamptz default now(),
  updated_at timestamptz default now()
)
```

Recommended `fact_type` values:

* `interest`
* `family`
* `career`
* `education`
* `location`
* `goal`
* `past_conversation`
* `birthday`
* `preference`
* `other`

#### `interactions`

Stores every outreach, meeting, message, call, or meaningful touchpoint.

```sql
interactions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,

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
)
```

Recommended `channel` values:

* `linkedin`
* `whatsapp`
* `email`
* `gmail`
* `call`
* `in_person`
* `event`
* `other`

#### `reminders`

Stores follow-up reminders, birthday reminders, and custom reminders.

```sql
reminders (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  contact_id uuid references contacts(id) on delete cascade,

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
)
```

Recommended `reminder_type` values:

* `follow_up`
* `birthday`
* `linkedin_request_followup`
* `custom`
* `data_enrichment`

Recommended `status` values:

* `pending`
* `completed`
* `snoozed`
* `cancelled`

#### `message_drafts`

Stores generated and edited drafts.

```sql
message_drafts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  reminder_id uuid references reminders(id) on delete set null,

  channel text not null,
  reason text not null,
  tone text default 'warm',
  generated_text text not null,
  edited_text text,
  status text default 'draft',

  created_at timestamptz default now(),
  sent_at timestamptz
)
```

#### `tags` and `contact_tags`

```sql
tags (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text,
  created_at timestamptz default now(),
  unique(owner_id, name)
)

contact_tags (
  contact_id uuid references contacts(id) on delete cascade,
  tag_id uuid references tags(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  primary key (contact_id, tag_id)
)
```

---

## 14. Row Level Security Requirements

Every table must include `owner_id` unless it is directly keyed by `auth.users(id)` like `profiles`.

Example policy pattern:

```sql
alter table contacts enable row level security;

create policy "Users can select their own contacts"
on contacts for select
to authenticated
using (owner_id = auth.uid());

create policy "Users can insert their own contacts"
on contacts for insert
to authenticated
with check (owner_id = auth.uid());

create policy "Users can update their own contacts"
on contacts for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Users can delete their own contacts"
on contacts for delete
to authenticated
using (owner_id = auth.uid());
```

Apply equivalent policies to:

* `personal_facts`
* `interactions`
* `reminders`
* `message_drafts`
* `tags`
* `contact_tags`

---

## 15. Reminder Engine

### Default logic

When a contact is created:

```text
next_follow_up_at = now + follow_up_interval_days
```

Default `follow_up_interval_days` is 90.

When an interaction is logged:

```text
contacts.last_contacted_at = interaction.interaction_at
contacts.next_follow_up_at = interaction.interaction_at + follow_up_interval_days
```

When a reminder is completed:

* Set `reminders.completed_at`
* Set status to `completed`
* Prompt user to log interaction
* Recompute next follow-up date if interaction is logged

### Daily scheduled job

Run once daily in the user’s timezone.

Responsibilities:

1. Create follow-up reminders for contacts where `next_follow_up_at <= now`.
2. Create birthday reminders for upcoming birthdays.
3. Create LinkedIn request follow-up reminders if status is `requested` and no interaction has happened after a configurable number of days.
4. Send reminder digest email if enabled.
5. Avoid duplicate reminders.

Pseudo-logic:

```ts
for each active contact:
  if contact.next_follow_up_at <= now and no pending follow_up reminder:
    create reminder(type = 'follow_up')

  if birthday is within reminder window and no birthday reminder exists for this year:
    create reminder(type = 'birthday')

  if linkedin_status = 'requested' and request is older than threshold:
    create reminder(type = 'linkedin_request_followup')
```

---

## 16. Insights and Scoring

### Relationship urgency score

Create a computed score to rank who needs attention.

Suggested formula:

```text
urgency_score =
  importance_score * 25
  + closeness_score * 10
  + overdue_days_capped * 1.5
  + birthday_soon_bonus
  + pending_linkedin_bonus
  - recently_contacted_penalty
```

Where:

* `overdue_days_capped = min(days_overdue, 60)`
* `birthday_soon_bonus = 30 if birthday within 7 days`
* `pending_linkedin_bonus = 15 if LinkedIn request pending`
* `recently_contacted_penalty = 30 if contacted within last 14 days`

### Dashboard insight cards

1. **Overdue follow-ups**

   * People whose `next_follow_up_at` is in the past.

2. **High-priority neglected**

   * Importance 4–5 and no contact in 90+ days.

3. **Birthdays soon**

   * Birthdays in next 30 days.

4. **Incomplete contacts**

   * Missing location, how-you-know-them, LinkedIn URL, or personal facts.

5. **Pending LinkedIn**

   * LinkedIn status is `request_to_send` or `requested`.

6. **Relationship health**

   * Healthy, needs attention, stale, unknown.

---

## 17. Message Generation Rules

The message generator can be template-based in MVP and AI-assisted later.

### Rules

1. Never include sensitive personal facts by default.
2. Always show the facts used to generate the message.
3. Keep messages short for LinkedIn.
4. Avoid sounding fake or overly familiar.
5. Avoid saying “I was just thinking about you” too often.
6. Do not invent facts.
7. Do not claim the user remembers something unless it exists in saved notes.
8. User must edit or approve before sending.
9. Save generated drafts for history.

### Prompt structure for AI version

```text
You are helping the user maintain genuine professional relationships.
Write a concise, warm message.

Contact:
- Name: {{name}}
- How user knows them: {{how_i_know_them}}
- Relationship type: {{relationship_type}}
- Last interaction: {{last_interaction_summary}}
- Personal facts allowed for use: {{non_sensitive_facts}}
- Channel: {{channel}}
- Reason: {{reason}}
- Tone: {{tone}}

Rules:
- Do not invent facts.
- Do not mention sensitive facts.
- Keep it natural.
- Make it easy for the user to edit.
- For LinkedIn requests, keep within a short connection-note length.
```

---

## 18. Gmail, LinkedIn, and WhatsApp Integration Strategy

### MVP

Implement:

* Store Gmail/email address.
* Store LinkedIn URL.
* Store WhatsApp phone.
* Generate message drafts.
* Copy message button.
* Open LinkedIn profile button.
* Open WhatsApp prefilled message button.
* Send reminder emails to the user’s inbox.

### P1

Implement:

* Gmail OAuth.
* Create Gmail drafts.
* Optionally send Gmail emails after explicit user confirmation.
* Parse sent emails into interactions only after user grants permission.

Use the narrowest Gmail OAuth scopes possible. For sending only, prefer `gmail.send`. For drafts, use compose-related scopes. Gmail’s docs recommend choosing the narrowest scope possible. ([Google for Developers][9])

### LinkedIn

MVP should **not** attempt automated LinkedIn sending, scraping, or connection importing.

Implement:

* LinkedIn URL field
* LinkedIn status
* LinkedIn message draft
* Copy button
* Open LinkedIn profile
* Manual status update

Later investigation:

* Official LinkedIn APIs
* LinkedIn Sales Navigator Application Platform
* Partner access requirements
* User-controlled actions only

### WhatsApp

MVP can implement:

* WhatsApp phone field
* Draft generation
* Copy button
* Open WhatsApp link with prefilled text

The app should still treat sending as a user action.

---

## 19. Notification Requirements

### Notification types

1. Daily reminder digest
2. Weekly relationship digest
3. Birthday alerts
4. Follow-up due alerts
5. LinkedIn request follow-up alerts
6. Data enrichment prompts

### Notification channels

MVP:

* In-app dashboard
* Email to user

Later:

* Push notifications via PWA
* Calendar events
* Gmail reminders

### Daily digest content

Subject:

```text
Relationship reminders for today
```

Body:

```text
You have 4 relationship reminders today:

1. Priya Shah — birthday today
Suggested message: Happy birthday, Priya! Hope you have a great day.

2. Aman Verma — 3-month follow-up overdue
Context: Met through LinkedIn. Interested in distributed systems. Based in Berlin.

3. Neha Rao — LinkedIn request pending
Context: Request sent 21 days ago.

Open RelateLoop to review and act.
```

---

## 20. CSV Import / Export

### Import fields

Support CSV upload with these columns:

```text
full_name
preferred_name
role_title
company
city
country
email
phone
whatsapp_phone
linkedin_url
relationship_type
source
how_i_know_them
relationship_context
linkedin_status
importance_score
closeness_score
birthday_day
birthday_month
birthday_year
last_contacted_at
follow_up_interval_days
notes
tags
personal_facts
```

### Import behavior

1. Show preview before import.
2. Validate required fields.
3. Detect possible duplicates by:

   * LinkedIn URL
   * Email
   * Phone
   * Full name + company
4. Allow user to skip, merge, or create duplicate.
5. Create tags automatically if missing.

### Export behavior

Allow full export to CSV, including:

* Contacts
* Tags
* Personal facts
* Interactions
* Reminders
* Message drafts

---

## 21. Search and Filtering

Search should include:

* Full name
* Preferred name
* Company
* Role
* City
* Country
* Notes
* Personal facts
* Tags
* How user knows them

Filters:

* Relationship type
* City
* Country
* Company
* Tags
* Importance
* LinkedIn status
* Due for follow-up
* Birthday this month
* Missing personal facts
* Archived vs active

---

## 22. Privacy and Safety Requirements

1. All data is private by default.
2. All user-owned tables must use RLS.
3. No public contact pages.
4. No automatic LinkedIn scraping.
5. No automatic messaging without explicit user action.
6. OAuth tokens must never be exposed to the browser.
7. Store third-party tokens only server-side and encrypted.
8. Allow CSV export.
9. Allow permanent contact deletion.
10. Allow archive instead of delete.
11. Keep audit-friendly timestamps on all important records.
12. Sensitive facts must be excluded from message generation by default.

---

## 23. Acceptance Criteria

### Contact management

* User can create, edit, archive, and delete contacts.
* User can add birthday without year.
* User can add multiple personal facts.
* User can add tags.
* Contact list works on mobile and desktop.

### Reminder system

* New contacts get a default follow-up reminder.
* Logging an interaction updates last contacted date.
* Logging an interaction recalculates next follow-up.
* Dashboard shows overdue reminders.
* Birthday reminders appear correctly.
* User can complete, snooze, or cancel reminders.

### Message drafting

* User can generate a message for LinkedIn, WhatsApp, or email.
* Message includes selected context only.
* Message does not include sensitive facts by default.
* User can copy generated message.
* User can save edited draft.
* User can log sent message as an interaction.

### Insights

* Dashboard shows upcoming birthdays.
* Dashboard shows stale contacts.
* Dashboard shows high-priority neglected contacts.
* Dashboard shows pending LinkedIn requests.
* Dashboard shows incomplete contact records.

### Security

* User cannot access another user’s contacts.
* RLS is enabled on all exposed tables.
* Server-side mutations validate ownership.
* No third-party tokens are stored in client-side local storage.

### UX

* App is usable on phone.
* Add-contact flow is fast.
* Contact detail page is clear.
* Dashboard gives immediate next actions.
* Empty states guide the user.

---

## 24. Suggested Implementation Plan for Claude Code

### Milestone 1: Project setup

* Create Next.js TypeScript app.
* Add Tailwind.
* Configure Supabase client.
* Configure Supabase Auth.
* Add environment variables.
* Create base layout.
* Add protected routes.

### Milestone 2: Database

* Create Supabase migrations.
* Add tables:

  * `profiles`
  * `contacts`
  * `personal_facts`
  * `interactions`
  * `reminders`
  * `message_drafts`
  * `tags`
  * `contact_tags`
* Enable RLS.
* Add ownership policies.
* Add indexes for:

  * `owner_id`
  * `contact_id`
  * `next_follow_up_at`
  * `last_contacted_at`
  * `birthday_month`, `birthday_day`
  * `linkedin_status`
  * `importance_score`

### Milestone 3: Core UI

* Dashboard
* Contact list
* Contact create/edit form
* Contact detail page
* Personal facts editor
* Interaction timeline
* Reminder list

### Milestone 4: Reminder logic

* Create follow-up reminder on contact creation.
* Update contact after interaction.
* Add complete/snooze/cancel reminder actions.
* Add daily reminder Edge Function.
* Add scheduled cron invocation.

### Milestone 5: Message drafts

* Implement template-based message generation.
* Add message composer.
* Add copy button.
* Add WhatsApp prefilled link.
* Add LinkedIn open-profile action.
* Save generated drafts.

### Milestone 6: Insights

* Upcoming birthdays
* Overdue contacts
* High-priority neglected contacts
* Pending LinkedIn requests
* Incomplete contacts

### Milestone 7: Import/export

* CSV import preview
* Duplicate detection
* CSV export

### Milestone 8: Polish

* Mobile navigation
* Empty states
* Loading states
* Error states
* Toasts
* Form validation
* Seed demo data
* Basic tests

---

## 25. Claude Code Kickoff Prompt

Use this prompt directly with Claude Code:

```text
You are implementing a private mobile-first Personal Relationship Management web app called RelateLoop.

Use:
- Next.js with App Router
- TypeScript
- Tailwind CSS
- Supabase Postgres
- Supabase Auth
- Supabase Row Level Security
- Supabase Edge Functions for scheduled jobs

Core product:
RelateLoop helps one user manage professional and semi-professional relationships. It stores contacts, personal facts, birthdays, LinkedIn status, interaction history, follow-up reminders, and message drafts. It reminds the user to reach out every 90 days by default and helps generate warm, editable messages using saved context.

Important constraints:
- Do not implement automatic LinkedIn sending.
- Do not scrape LinkedIn.
- Do not auto-send WhatsApp or email messages.
- Generate drafts, copy buttons, and deep links only.
- Require explicit user action for sending.
- Enable RLS on every user-owned table.
- Every user-owned table must have owner_id = auth.uid() policies.
- Build mobile-first UI.

Implement the app according to the PRD below.

Start by:
1. Creating the database migration files.
2. Creating the Supabase client/server helpers.
3. Creating protected routes.
4. Building the contact CRUD flow.
5. Building the dashboard and reminder logic.
6. Then build message drafting and insights.

Prioritize correctness, privacy, and clean UX over extra automation.
```

---

## 26. MVP Feature Checklist

Build these first:

* [ ] Login/logout
* [ ] Add contact
* [ ] Edit contact
* [ ] Archive/delete contact
* [ ] Add personal facts
* [ ] Add interaction
* [ ] Auto-update last contacted
* [ ] Auto-create next follow-up date
* [ ] Dashboard
* [ ] Reminders page
* [ ] Birthday insights
* [ ] Stale contacts insights
* [ ] LinkedIn status field
* [ ] Message draft generator
* [ ] Copy message button
* [ ] Open LinkedIn URL button
* [ ] Open WhatsApp draft button
* [ ] CSV import
* [ ] CSV export
* [ ] RLS policies
* [ ] Mobile responsive layout
