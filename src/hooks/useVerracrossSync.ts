import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SyncStatus {
  is_syncing: boolean;
  last_sync_started: string | null;
  last_sync_completed: string | null;
  last_sync_error: string | null;
  next_scheduled_sync: string | null;
  total_syncs: number;
  successful_syncs: number;
  failed_syncs: number;
  notification_email: string | null;
  auto_sync_enabled: boolean;
}

export interface DetectedChange {
  id: string;
  page_type: string;
  category: string;
  title: string;
  message: string;
  details: any;
  is_read: boolean;
  detected_at: string;
}

export interface SyncResult {
  type: string;
  url?: string;
  courseId?: string;
  courseName?: string;
  status?: number;
  dataLength?: number;
  pagesFound?: number;
  announcementsFound?: number;
  assignmentsFound?: number;
  changesDetected?: number;
  error?: string;
}

export interface RawSnapshot {
  page_type: string;
  parsed_data: any;
  raw_content: string | null;
  captured_at: string;
  content_hash: string;
}

export interface PortalData {
  grades: any;
  assignments: any;
  announcements: any;
  attendance: any;
  billing: any;
  calendar: any;
}

export function useVerracrossSync(userId: string | null) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [changes, setChanges] = useState<DetectedChange[]>([]);
  const [portalData, setPortalData] = useState<PortalData | null>(null);
  const [rawSnapshots, setRawSnapshots] = useState<RawSnapshot[]>([]);
  const [lastSyncResults, setLastSyncResults] = useState<SyncResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Fetch sync status
  const fetchSyncStatus = useCallback(async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from('sync_status')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (data) {
      const syncData = data as any;
      setSyncStatus({
        is_syncing: syncData.is_syncing,
        last_sync_started: syncData.last_sync_started,
        last_sync_completed: syncData.last_sync_completed,
        last_sync_error: syncData.last_sync_error,
        next_scheduled_sync: syncData.next_scheduled_sync,
        total_syncs: syncData.total_syncs,
        successful_syncs: syncData.successful_syncs,
        failed_syncs: syncData.failed_syncs,
        notification_email: syncData.notification_email ?? null,
        auto_sync_enabled: syncData.auto_sync_enabled ?? true,
      });
    }
  }, [userId]);

  // Fetch detected changes
  const fetchChanges = useCallback(async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from('detected_changes')
      .select('*')
      .eq('user_id', userId)
      .order('detected_at', { ascending: false })
      .limit(50);

    if (data) {
      setChanges(data as DetectedChange[]);
    }
  }, [userId]);

  // Fetch raw snapshots (for debugging/display)
  const fetchRawSnapshots = useCallback(async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from('page_snapshots')
      .select('page_type, parsed_data, raw_content, captured_at, content_hash')
      .eq('user_id', userId)
      .order('captured_at', { ascending: false })
      .limit(20);

    if (data) {
      setRawSnapshots(data as RawSnapshot[]);
    }
  }, [userId]);

  // Fetch latest portal data from snapshots
  const fetchPortalData = useCallback(async () => {
    if (!userId) return;

    const pageTypes = ['grades', 'assignments', 'announcements', 'attendance', 'billing', 'calendar'] as const;
    const data: any = {};

    for (const pageType of pageTypes) {
      const { data: snapshot } = await supabase
        .from('page_snapshots')
        .select('parsed_data')
        .eq('user_id', userId)
        .eq('page_type', pageType)
        .order('captured_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (snapshot?.parsed_data) {
        data[pageType] = snapshot.parsed_data;
      }
    }

    setPortalData(data);
  }, [userId]);

  // Trigger manual sync
  const triggerSync = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('verracross-sync', {
        body: { action: 'manual_sync' },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data;

      if (result.success) {
        // Store sync results for display
        if (result.syncResults) {
          setLastSyncResults(result.syncResults);
        }

        toast({
          title: result.changesFound > 0 ? `Found ${result.changesFound} new updates! 🎉` : 'All synced! ✓',
          description: result.changesFound > 0 
            ? 'Check your updates feed for details' 
            : `Scraped ${result.syncResults?.length || 0} pages`,
        });

        // Refresh all data
        await Promise.all([
          fetchSyncStatus(),
          fetchChanges(),
          fetchPortalData(),
          fetchRawSnapshots(),
        ]);
      } else {
        throw new Error(result.error || 'Sync failed');
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: 'Sync failed',
        description: error instanceof Error ? error.message : 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId, toast, fetchSyncStatus, fetchChanges, fetchPortalData, fetchRawSnapshots]);

  // Mark change as read
  const markAsRead = useCallback(async (changeId: string) => {
    const { error } = await supabase
      .from('detected_changes')
      .update({ is_read: true })
      .eq('id', changeId);

    if (!error) {
      setChanges(prev => prev.map(c => 
        c.id === changeId ? { ...c, is_read: true } : c
      ));
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    const { error } = await supabase
      .from('detected_changes')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (!error) {
      setChanges(prev => prev.map(c => ({ ...c, is_read: true })));
    }
  }, [userId]);

  // Update notification email
  const updateNotificationEmail = useCallback(async (email: string) => {
    if (!userId) return;

    const { error } = await supabase
      .from('sync_status')
      .upsert({
        user_id: userId,
        notification_email: email || null,
      }, { onConflict: 'user_id' });

    if (!error) {
      setSyncStatus(prev => prev ? { ...prev, notification_email: email || null } : null);
      return true;
    }
    return false;
  }, [userId]);

  // Toggle auto sync
  const toggleAutoSync = useCallback(async (enabled: boolean) => {
    if (!userId) return;

    const { error } = await supabase
      .from('sync_status')
      .upsert({
        user_id: userId,
        auto_sync_enabled: enabled,
      }, { onConflict: 'user_id' });

    if (!error) {
      setSyncStatus(prev => prev ? { ...prev, auto_sync_enabled: enabled } : null);
      return true;
    }
    return false;
  }, [userId]);
  const deleteChange = useCallback(async (changeId: string) => {
    const { error } = await supabase
      .from('detected_changes')
      .delete()
      .eq('id', changeId);

    if (!error) {
      setChanges(prev => prev.filter(c => c.id !== changeId));
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    if (userId) {
      fetchSyncStatus();
      fetchChanges();
      fetchPortalData();
      fetchRawSnapshots();
    }
  }, [userId, fetchSyncStatus, fetchChanges, fetchPortalData, fetchRawSnapshots]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!userId) return;

    const changesChannel = supabase
      .channel('detected_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'detected_changes',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('New change detected:', payload);
          setChanges(prev => [payload.new as DetectedChange, ...prev]);
          
          toast({
            title: (payload.new as DetectedChange).title,
            description: (payload.new as DetectedChange).message,
          });
        }
      )
      .subscribe();

    const syncChannel = supabase
      .channel('sync_status')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sync_status',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Sync status updated:', payload);
          setSyncStatus(payload.new as SyncStatus);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(changesChannel);
      supabase.removeChannel(syncChannel);
    };
  }, [userId, toast]);

  return {
    syncStatus,
    changes,
    portalData,
    rawSnapshots,
    lastSyncResults,
    isLoading,
    triggerSync,
    markAsRead,
    markAllAsRead,
    deleteChange,
    updateNotificationEmail,
    toggleAutoSync,
    unreadCount: changes.filter(c => !c.is_read).length,
    refreshSnapshots: fetchRawSnapshots,
  };
}
