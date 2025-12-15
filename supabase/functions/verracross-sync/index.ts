import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  action: 'manual_sync' | 'scheduled_sync';
  userId?: string;
}

interface ParsedGrade {
  subject: string;
  grade: string;
  assignment: string;
  date: string;
}

interface ParsedAssignment {
  subject: string;
  title: string;
  dueDate: string;
  status: string;
}

interface ParsedAnnouncement {
  title: string;
  content: string;
  date: string;
  author: string;
}

// Simple hash function for change detection
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

// Mock Verracross data - in production this would actually scrape the portal
function generateMockPortalData(pageType: string) {
  const now = new Date();
  
  switch (pageType) {
    case 'grades':
      return {
        gpa: '3.8',
        grades: [
          { subject: 'History', grade: 'A-', assignment: 'The Industrial Revolution Essay', date: now.toISOString() },
          { subject: 'Mathematics', grade: 'B+', assignment: 'Calculus Quiz #4', date: now.toISOString() },
          { subject: 'English', grade: 'A', assignment: 'Persuasive Writing', date: now.toISOString() },
          { subject: 'Physics', grade: 'B', assignment: 'Lab Report #3', date: now.toISOString() },
          { subject: 'Spanish', grade: 'A-', assignment: 'Oral Presentation', date: now.toISOString() },
        ]
      };
    case 'assignments':
      return {
        pending: [
          { subject: 'Physics', title: 'Lab Report #4', dueDate: '2024-12-17', status: 'pending' },
          { subject: 'Spanish', title: 'Vocabulary Quiz', dueDate: '2024-12-18', status: 'pending' },
          { subject: 'Art', title: 'Portfolio Submission', dueDate: '2024-12-20', status: 'pending' },
          { subject: 'History', title: 'Chapter 12 Reading', dueDate: '2024-12-19', status: 'pending' },
          { subject: 'Mathematics', title: 'Problem Set #8', dueDate: '2024-12-21', status: 'pending' },
        ]
      };
    case 'announcements':
      return {
        announcements: [
          { title: 'Spirit Week Starting Monday!', content: 'Get ready for themed dress days all week long. Monday is Pajama Day!', date: now.toISOString(), author: 'Student Council' },
          { title: 'Winter Break Schedule', content: 'School closes Dec 20 at noon. Classes resume Jan 6.', date: now.toISOString(), author: 'Administration' },
          { title: 'Holiday Concert', content: 'Join us for the annual winter concert on Dec 18 at 7pm in the auditorium.', date: now.toISOString(), author: 'Music Department' },
        ]
      };
    case 'attendance':
      return {
        rate: '98%',
        daysPresent: 42,
        daysAbsent: 1,
        daysLate: 2,
        records: [
          { date: now.toISOString(), status: 'present', period: 'All day' },
        ]
      };
    case 'billing':
      return {
        balance: '$0.00',
        nextDue: 'Feb 1, 2025',
        nextAmount: '$8,500.00',
        recentPayments: [
          { date: '2024-12-01', amount: '$8,500.00', description: 'January Tuition', status: 'processed' },
        ]
      };
    case 'calendar':
      return {
        events: [
          { title: 'Math Final Exam', date: '2024-12-16', time: '9:00 AM', location: 'Room 204' },
          { title: 'Winter Concert', date: '2024-12-18', time: '7:00 PM', location: 'Auditorium' },
          { title: 'Parent-Teacher Conference', date: '2024-12-19', time: '3:00 PM', location: 'Various' },
          { title: 'Winter Break Begins', date: '2024-12-20', time: '12:00 PM', location: '' },
        ]
      };
    default:
      return {};
  }
}

// Compare two snapshots and detect changes
function detectChanges(
  pageType: string, 
  oldData: any, 
  newData: any
): { category: string; title: string; message: string; details: any }[] {
  const changes: { category: string; title: string; message: string; details: any }[] = [];
  
  if (!oldData) {
    // First sync - no changes to report
    return [];
  }

  switch (pageType) {
    case 'grades':
      // Compare grades
      const oldGrades = oldData.grades || [];
      const newGrades = newData.grades || [];
      
      for (const newGrade of newGrades) {
        const oldGrade = oldGrades.find((g: any) => 
          g.subject === newGrade.subject && g.assignment === newGrade.assignment
        );
        
        if (!oldGrade) {
          changes.push({
            category: 'grade_posted',
            title: `New Grade Posted! 🎉`,
            message: `You received a ${newGrade.grade} on "${newGrade.assignment}" in ${newGrade.subject}`,
            details: newGrade
          });
        } else if (oldGrade.grade !== newGrade.grade) {
          changes.push({
            category: 'grade_updated',
            title: 'Grade Updated',
            message: `Your grade for "${newGrade.assignment}" in ${newGrade.subject} changed from ${oldGrade.grade} to ${newGrade.grade}`,
            details: { old: oldGrade, new: newGrade }
          });
        }
      }
      break;
      
    case 'assignments':
      const oldAssignments = oldData.pending || [];
      const newAssignments = newData.pending || [];
      
      for (const newAssignment of newAssignments) {
        const oldAssignment = oldAssignments.find((a: any) => 
          a.subject === newAssignment.subject && a.title === newAssignment.title
        );
        
        if (!oldAssignment) {
          changes.push({
            category: 'assignment_added',
            title: 'New Assignment',
            message: `${newAssignment.title} in ${newAssignment.subject} - Due: ${newAssignment.dueDate}`,
            details: newAssignment
          });
        } else if (oldAssignment.dueDate !== newAssignment.dueDate) {
          changes.push({
            category: 'assignment_due_changed',
            title: 'Due Date Changed',
            message: `${newAssignment.title} due date changed to ${newAssignment.dueDate}`,
            details: { old: oldAssignment, new: newAssignment }
          });
        }
      }
      break;
      
    case 'announcements':
      const oldAnnouncements = oldData.announcements || [];
      const newAnnouncements = newData.announcements || [];
      
      for (const newAnn of newAnnouncements) {
        const exists = oldAnnouncements.find((a: any) => a.title === newAnn.title);
        if (!exists) {
          changes.push({
            category: 'announcement_added',
            title: 'New Announcement 📢',
            message: `${newAnn.title}`,
            details: newAnn
          });
        }
      }
      break;
      
    case 'calendar':
      const oldEvents = oldData.events || [];
      const newEvents = newData.events || [];
      
      for (const newEvent of newEvents) {
        const exists = oldEvents.find((e: any) => 
          e.title === newEvent.title && e.date === newEvent.date
        );
        if (!exists) {
          changes.push({
            category: 'calendar_event_added',
            title: 'New Calendar Event 📅',
            message: `${newEvent.title} on ${newEvent.date}`,
            details: newEvent
          });
        }
      }
      
      for (const oldEvent of oldEvents) {
        const stillExists = newEvents.find((e: any) => 
          e.title === oldEvent.title && e.date === oldEvent.date
        );
        if (!stillExists) {
          changes.push({
            category: 'calendar_event_removed',
            title: 'Event Cancelled',
            message: `${oldEvent.title} has been removed from the calendar`,
            details: oldEvent
          });
        }
      }
      break;
  }
  
  return changes;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the auth header to identify user
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: userData, error: authError } = await supabase.auth.getUser(token);
      if (!authError && userData.user) {
        userId = userData.user.id;
      }
    }

    const body: SyncRequest = await req.json();
    
    // For scheduled syncs, we might get userId from the body
    if (!userId && body.userId) {
      userId = body.userId;
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'User not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting sync for user ${userId}, action: ${body.action}`);

    // Update sync status to syncing
    await supabase.from('sync_status').upsert({
      user_id: userId,
      is_syncing: true,
      last_sync_started: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    const pageTypes = ['grades', 'assignments', 'announcements', 'attendance', 'billing', 'calendar'];
    const allChanges: any[] = [];

    for (const pageType of pageTypes) {
      console.log(`Syncing ${pageType} for user ${userId}`);
      
      // Get current data from "Verracross" (mock data for now)
      const newData = generateMockPortalData(pageType);
      const contentHash = simpleHash(JSON.stringify(newData));
      
      // Get the most recent snapshot for this page type
      const { data: existingSnapshot } = await supabase
        .from('page_snapshots')
        .select('*')
        .eq('user_id', userId)
        .eq('page_type', pageType)
        .order('captured_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      // Check if content has changed
      if (!existingSnapshot || existingSnapshot.content_hash !== contentHash) {
        // Detect changes
        const changes = detectChanges(pageType, existingSnapshot?.parsed_data, newData);
        
        // Save new snapshot
        await supabase.from('page_snapshots').insert({
          user_id: userId,
          page_type: pageType,
          content_hash: contentHash,
          parsed_data: newData,
          captured_at: new Date().toISOString(),
        });
        
        // Save detected changes
        for (const change of changes) {
          const { error: changeError } = await supabase.from('detected_changes').insert({
            user_id: userId,
            page_type: pageType,
            category: change.category,
            title: change.title,
            message: change.message,
            details: change.details,
            is_read: false,
            detected_at: new Date().toISOString(),
          });
          
          if (changeError) {
            console.error('Error saving change:', changeError);
          } else {
            allChanges.push(change);
          }
        }
      }
    }

    // Update sync status to completed
    const { data: currentStatus } = await supabase
      .from('sync_status')
      .select('total_syncs, successful_syncs')
      .eq('user_id', userId)
      .maybeSingle();

    await supabase.from('sync_status').upsert({
      user_id: userId,
      is_syncing: false,
      last_sync_completed: new Date().toISOString(),
      last_sync_error: null,
      next_scheduled_sync: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes from now
      total_syncs: (currentStatus?.total_syncs || 0) + 1,
      successful_syncs: (currentStatus?.successful_syncs || 0) + 1,
    }, { onConflict: 'user_id' });

    console.log(`Sync completed for user ${userId}. Found ${allChanges.length} changes.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        changesFound: allChanges.length,
        changes: allChanges,
        syncedAt: new Date().toISOString(),
        nextSync: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Sync error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
