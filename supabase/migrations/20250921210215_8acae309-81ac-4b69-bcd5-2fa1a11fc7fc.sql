CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'cleanup-expired-ads-daily',
  '0 2 * * *', -- Run at 2 AM every day
  $$
  SELECT
    net.http_post(
        url:='https://bqawmmungxkrfpjdinog.supabase.co/functions/v1/cleanup-expired-ads',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxYXdtbXVuZ3hrcmZwamRpbm9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzY1NzQsImV4cCI6MjA2NjQ1MjU3NH0.B2RC3TpKGCH1l7GIGnOQkfzOz7s_lfix7oyHNeIqV6c"}'::jsonb,
        body:='{"time": "' || now() || '"}'::jsonb
    ) as request_id;
  $$
);