-- Enable required extensions for cron jobs and HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create table for storing user Verracross credentials (encrypted)
CREATE TABLE public.user_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  -- Note: Password should be encrypted before storing. In production, use vault or proper encryption
  encrypted_password TEXT NOT NULL,
  portal_url TEXT NOT NULL DEFAULT 'https://portals.veracross.com',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_attempt TIMESTAMP WITH TIME ZONE,
  last_successful_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create enum for page types
CREATE TYPE public.portal_page_type AS ENUM (
  'grades',
  'assignments', 
  'announcements',
  'attendance',
  'billing',
  'calendar'
);

-- Create table for storing page snapshots
CREATE TABLE public.page_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  page_type portal_page_type NOT NULL,
  content_hash TEXT NOT NULL,
  raw_content TEXT,
  parsed_data JSONB,
  captured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, page_type, content_hash)
);

-- Create enum for change categories
CREATE TYPE public.change_category AS ENUM (
  'grade_posted',
  'grade_updated',
  'assignment_added',
  'assignment_updated',
  'assignment_due_changed',
  'announcement_added',
  'attendance_recorded',
  'attendance_updated',
  'billing_item_added',
  'billing_payment_received',
  'calendar_event_added',
  'calendar_event_removed',
  'calendar_event_updated'
);

-- Create table for detected changes
CREATE TABLE public.detected_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  page_type portal_page_type NOT NULL,
  category change_category NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  details JSONB,
  is_read BOOLEAN NOT NULL DEFAULT false,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for sync status
CREATE TABLE public.sync_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  is_syncing BOOLEAN NOT NULL DEFAULT false,
  last_sync_started TIMESTAMP WITH TIME ZONE,
  last_sync_completed TIMESTAMP WITH TIME ZONE,
  last_sync_error TEXT,
  next_scheduled_sync TIMESTAMP WITH TIME ZONE,
  total_syncs INTEGER NOT NULL DEFAULT 0,
  successful_syncs INTEGER NOT NULL DEFAULT 0,
  failed_syncs INTEGER NOT NULL DEFAULT 0
);

-- Create indexes for performance
CREATE INDEX idx_page_snapshots_user_page ON public.page_snapshots(user_id, page_type);
CREATE INDEX idx_detected_changes_user ON public.detected_changes(user_id, detected_at DESC);
CREATE INDEX idx_detected_changes_unread ON public.detected_changes(user_id, is_read) WHERE NOT is_read;

-- Enable RLS on all tables
ALTER TABLE public.user_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detected_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_status ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_credentials (users can only access their own)
CREATE POLICY "Users can view own credentials" ON public.user_credentials
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credentials" ON public.user_credentials
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own credentials" ON public.user_credentials
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own credentials" ON public.user_credentials
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for page_snapshots
CREATE POLICY "Users can view own snapshots" ON public.page_snapshots
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own snapshots" ON public.page_snapshots
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policies for detected_changes  
CREATE POLICY "Users can view own changes" ON public.detected_changes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own changes" ON public.detected_changes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own changes" ON public.detected_changes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own changes" ON public.detected_changes
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for sync_status
CREATE POLICY "Users can view own sync status" ON public.sync_status
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sync status" ON public.sync_status
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sync status" ON public.sync_status
  FOR UPDATE USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for credentials timestamp
CREATE TRIGGER update_user_credentials_updated_at
  BEFORE UPDATE ON public.user_credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for detected_changes so UI updates instantly
ALTER PUBLICATION supabase_realtime ADD TABLE public.detected_changes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sync_status;