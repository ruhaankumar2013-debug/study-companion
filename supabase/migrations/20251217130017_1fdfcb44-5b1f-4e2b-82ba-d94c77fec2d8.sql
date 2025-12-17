-- Add sync_interval column to sync_status table (in minutes)
ALTER TABLE public.sync_status 
ADD COLUMN sync_interval integer NOT NULL DEFAULT 15;