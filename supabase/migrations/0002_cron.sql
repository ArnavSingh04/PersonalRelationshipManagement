-- Schedule the daily-reminders Edge Function via pg_cron + pg_net.
--
-- Before applying, set these in the Supabase SQL editor (Vault):
--   select vault.create_secret('https://YOUR-PROJECT-REF.supabase.co', 'project_url');
--   select vault.create_secret('YOUR-CRON-SECRET', 'cron_secret');
-- and set CRON_SECRET as an Edge Function secret:
--   supabase secrets set CRON_SECRET=YOUR-CRON-SECRET

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'daily-reminders',
  '30 2 * * *', -- 02:30 UTC = 08:00 IST daily
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/daily-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
