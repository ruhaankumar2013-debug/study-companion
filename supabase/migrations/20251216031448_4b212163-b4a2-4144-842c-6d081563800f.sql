-- Add notification_email and auto_sync_enabled columns to sync_status
ALTER TABLE public.sync_status 
ADD COLUMN IF NOT EXISTS notification_email text,
ADD COLUMN IF NOT EXISTS auto_sync_enabled boolean NOT NULL DEFAULT true;