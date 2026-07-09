# RelateLoop

A private, mobile-first Personal Relationship Management app. It stores contacts, personal facts, birthdays, LinkedIn status, and interaction history, reminds you to follow up (every 90 days by default), and generates warm, editable message drafts from saved context.

RelateLoop never sends messages for you. It generates drafts, copy buttons, and deep links (LinkedIn profile, WhatsApp click-to-chat, mailto) — sending is always your explicit action.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase: Postgres, Auth, Row Level Security, Edge Functions
- React Hook Form + Zod, PapaParse, date-fns, sonner

## Setup

### 1. Create a Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run the migrations in order:
   - `supabase/migrations/0001_initial_schema.sql` — tables, RLS policies, indexes, triggers
   - `supabase/migrations/0002_cron.sql` — daily reminder cron job (see comments in the file first; requires Vault secrets and the deployed Edge Function)
3. (Optional, for local dev with the Supabase CLI: `supabase db push`.)

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from Project Settings → API.

### 3. Run the app

```bash
npm install
npm run dev
```

Open http://localhost:3000, create an account, and start adding contacts.

> If email confirmation is enabled in your Supabase Auth settings, either confirm via the emailed link or disable "Confirm email" (Authentication → Providers → Email) for personal use.

### 4. Deploy the daily reminder job (optional but recommended)

The Edge Function `supabase/functions/daily-reminders` creates follow-up, birthday, and LinkedIn-request reminders once a day.

```bash
supabase functions deploy daily-reminders
supabase secrets set CRON_SECRET=some-long-random-string
```

Then set the Vault secrets referenced in `supabase/migrations/0002_cron.sql` and run that migration to schedule it via `pg_cron`.

Reminders are also surfaced live on the dashboard from `next_follow_up_at`, so the app is useful even without the cron job.

## Features

- **Contacts** — full CRUD, archive/delete, tags, importance and closeness scores, birthday without year, LinkedIn status tracking
- **Personal facts** — structured memory (interests, family, goals, past conversations) with sensitive-fact flags that are excluded from drafts by default
- **Interactions** — timeline of touchpoints; logging one updates last-contacted and reschedules the next follow-up
- **Reminders** — auto follow-up reminders, birthday reminders, LinkedIn request follow-ups; complete / snooze / cancel, with an interaction-log prompt on completion
- **Message drafts** — template-based generator with channel, reason, tone, length, and selectable fact chips; copy button, open LinkedIn, WhatsApp `wa.me` prefilled link
- **Dashboard** — today, this week, needs attention, recently added
- **Insights** — overdue, high-priority neglected, birthdays in 30 days, pending LinkedIn, stale, incomplete contacts, relationship health
- **Quick add** — paste or dictate a freeform note; heuristic parser prefills the contact form for review
- **CSV import/export** — import with preview and duplicate detection (LinkedIn URL, email, phone, name+company); full export of contacts, facts, interactions, reminders, and drafts
- **Privacy** — RLS on every table, ownership checks in every server action, no tokens in the browser

## Project structure

```
supabase/
  migrations/          SQL migrations (schema, RLS, cron)
  functions/
    daily-reminders/   scheduled Edge Function
src/
  proxy.ts             auth session refresh + route protection
  lib/                 supabase clients, types, constants, dates, message templates
  app/
    (auth)/            login, signup
    (app)/             dashboard, contacts, reminders, messages, insights, quick-add, settings
    actions/           server actions (all mutations, ownership-checked)
    api/export/        CSV export route
  components/          forms, composer, nav, shared UI
```
