import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  action: 'manual_sync' | 'scheduled_sync';
  userId?: string;
}

// Veracross URLs to scrape
const VERACROSS_URLS = {
  portal: 'https://portals.veracross.com/sns/student',
  overview: 'https://portals.veracross.com/sns/student/student/overview',
  attendance: 'https://documents.veracross.com/sns/attendance/153227?grading_period=4&key=_',
  reportCard: 'https://documents.veracross.com/sns/report_card/85267?grading_period=2&pad=104784',
  courses: [
    { id: '17681', name: 'Course 1', baseUrl: 'https://classes.veracross.com/sns/course/17681/website' },
    { id: '17682', name: 'Course 2', baseUrl: 'https://classes.veracross.com/sns/course/17682/website' },
    { id: '17683', name: 'Course 3', baseUrl: 'https://classes.veracross.com/sns/course/17683/website' },
    { id: '17684', name: 'Course 4', baseUrl: 'https://classes.veracross.com/sns/course/17684/website' },
    { id: '17685', name: 'Course 5', baseUrl: 'https://classes.veracross.com/sns/course/17685/website' },
  ]
};

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

// Fetch a page with optional cookies for auth
async function fetchPage(url: string, cookies?: string): Promise<{ html: string; status: number }> {
  console.log(`Fetching: ${url}`);
  
  const headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
  };
  
  if (cookies) {
    headers['Cookie'] = cookies;
  }
  
  try {
    const response = await fetch(url, { 
      headers,
      redirect: 'follow',
    });
    
    const html = await response.text();
    console.log(`Fetched ${url}: ${response.status}, length: ${html.length}`);
    
    return { html, status: response.status };
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    throw error;
  }
}

// Parse course page content
function parseCoursePageContent(html: string, courseId: string): any {
  // Extract page titles and content from the HTML
  const content: any = {
    courseId,
    pages: [],
    announcements: [],
    assignments: [],
    rawLength: html.length,
  };
  
  // Look for page titles (typically in h1, h2, or title elements)
  const titleMatches = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatches) {
    content.pageTitle = titleMatches[1].trim();
  }
  
  // Look for headings
  const h1Matches = html.matchAll(/<h1[^>]*>([^<]+)<\/h1>/gi);
  for (const match of h1Matches) {
    content.pages.push({ type: 'heading', text: match[1].trim() });
  }
  
  const h2Matches = html.matchAll(/<h2[^>]*>([^<]+)<\/h2>/gi);
  for (const match of h2Matches) {
    content.pages.push({ type: 'subheading', text: match[1].trim() });
  }
  
  // Look for links to pages
  const linkMatches = html.matchAll(/<a[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a>/gi);
  for (const match of linkMatches) {
    if (match[1].includes('/pages/') || match[1].includes('/website/')) {
      content.pages.push({ type: 'link', url: match[1], text: match[2].trim() });
    }
  }
  
  // Look for assignments (common patterns)
  const assignmentPatterns = [
    /<div[^>]*class="[^"]*assignment[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<tr[^>]*class="[^"]*assignment[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi,
    /<li[^>]*class="[^"]*assignment[^"]*"[^>]*>([\s\S]*?)<\/li>/gi,
  ];
  
  for (const pattern of assignmentPatterns) {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      content.assignments.push({ raw: match[1].substring(0, 500) });
    }
  }
  
  // Look for announcements
  const announcementPatterns = [
    /<div[^>]*class="[^"]*announcement[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<article[^>]*>([\s\S]*?)<\/article>/gi,
  ];
  
  for (const pattern of announcementPatterns) {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      const text = match[1].replace(/<[^>]+>/g, ' ').trim().substring(0, 500);
      if (text.length > 10) {
        content.announcements.push({ text });
      }
    }
  }
  
  // Extract any dates found
  const dateMatches = html.matchAll(/(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4})/gi);
  content.dates = [];
  for (const match of dateMatches) {
    content.dates.push(match[1]);
  }
  content.dates = [...new Set(content.dates)].slice(0, 20);
  
  return content;
}

// Parse student portal content
function parsePortalContent(html: string): any {
  const content: any = {
    grades: [],
    attendance: [],
    calendar: [],
    billing: [],
    rawLength: html.length,
  };
  
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    content.pageTitle = titleMatch[1].trim();
  }
  
  // Look for grade patterns
  const gradePatterns = [
    /grade[:\s]*([A-F][+-]?|\d{1,3}%?)/gi,
    /<td[^>]*>([A-F][+-]?)<\/td>/gi,
  ];
  
  for (const pattern of gradePatterns) {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      content.grades.push({ value: match[1] });
    }
  }
  
  // Look for calendar/schedule items
  const calendarPatterns = [
    /<div[^>]*class="[^"]*event[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<div[^>]*class="[^"]*calendar[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
  ];
  
  for (const pattern of calendarPatterns) {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      const text = match[1].replace(/<[^>]+>/g, ' ').trim().substring(0, 200);
      if (text.length > 5) {
        content.calendar.push({ text });
      }
    }
  }
  
  return content;
}

// Compare two snapshots and detect changes
function detectChanges(
  pageType: string, 
  oldData: any, 
  newData: any
): { category: string; title: string; message: string; details: any }[] {
  const changes: { category: string; title: string; message: string; details: any }[] = [];
  
  if (!oldData) {
    // First sync - report initial data found
    if (newData.pages?.length > 0) {
      changes.push({
        category: 'announcement_added',
        title: 'Initial Sync Complete 🎉',
        message: `Found ${newData.pages.length} pages in ${pageType}`,
        details: { pageCount: newData.pages.length, type: 'initial_sync' }
      });
    }
    return changes;
  }

  // Compare content hashes
  const oldHash = simpleHash(JSON.stringify(oldData));
  const newHash = simpleHash(JSON.stringify(newData));
  
  if (oldHash !== newHash) {
    // Content changed - analyze what changed
    const oldPages = oldData.pages || [];
    const newPages = newData.pages || [];
    
    // Check for new pages
    for (const newPage of newPages) {
      const exists = oldPages.find((p: any) => p.text === newPage.text && p.url === newPage.url);
      if (!exists && newPage.text) {
        changes.push({
          category: 'assignment_added',
          title: 'New Content Detected',
          message: newPage.text.substring(0, 100),
          details: newPage
        });
      }
    }
    
    // Check for new announcements
    const oldAnnouncements = oldData.announcements || [];
    const newAnnouncements = newData.announcements || [];
    
    for (const newAnn of newAnnouncements) {
      const exists = oldAnnouncements.find((a: any) => a.text === newAnn.text);
      if (!exists && newAnn.text) {
        changes.push({
          category: 'announcement_added',
          title: 'New Announcement 📢',
          message: newAnn.text.substring(0, 150),
          details: newAnn
        });
      }
    }
    
    // Check for new assignments
    const oldAssignments = oldData.assignments || [];
    const newAssignments = newData.assignments || [];
    
    for (const newAssign of newAssignments) {
      const exists = oldAssignments.find((a: any) => a.raw === newAssign.raw);
      if (!exists) {
        changes.push({
          category: 'assignment_added',
          title: 'New Assignment',
          message: 'New assignment content detected',
          details: newAssign
        });
      }
    }
    
    // If content changed but we couldn't identify specific changes
    if (changes.length === 0 && oldData.rawLength !== newData.rawLength) {
      changes.push({
        category: 'assignment_updated',
        title: 'Page Updated',
        message: `Content changed (${oldData.rawLength} → ${newData.rawLength} bytes)`,
        details: { oldLength: oldData.rawLength, newLength: newData.rawLength }
      });
    }
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

    console.log(`Starting REAL sync for user ${userId}, action: ${body.action}`);

    // Update sync status to syncing
    await supabase.from('sync_status').upsert({
      user_id: userId,
      is_syncing: true,
      last_sync_started: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    // Get user credentials if they exist
    const { data: credentials } = await supabase
      .from('user_credentials')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    const cookies = credentials?.encrypted_password; // Using this field to store session cookies for now
    
    const allChanges: any[] = [];
    const syncResults: any[] = [];

    // Scrape the student portal
    try {
      console.log('Scraping student portal...');
      const { html, status } = await fetchPage(VERACROSS_URLS.portal, cookies);
      
      const portalData = parsePortalContent(html);
      const contentHash = simpleHash(JSON.stringify(portalData));
      
      // Get existing snapshot
      const { data: existingSnapshot } = await supabase
        .from('page_snapshots')
        .select('*')
        .eq('user_id', userId)
        .eq('page_type', 'grades')
        .order('captured_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Detect changes
      const changes = detectChanges('portal', existingSnapshot?.parsed_data, portalData);
      
      // Save snapshot
      await supabase.from('page_snapshots').insert({
        user_id: userId,
        page_type: 'grades',
        content_hash: contentHash,
        parsed_data: portalData,
        raw_content: html.substring(0, 50000), // Store first 50KB of HTML
        captured_at: new Date().toISOString(),
      });

      // Save changes
      for (const change of changes) {
        await supabase.from('detected_changes').insert({
          user_id: userId,
          page_type: 'grades',
          category: change.category,
          title: change.title,
          message: change.message,
          details: change.details,
          is_read: false,
          detected_at: new Date().toISOString(),
        });
        allChanges.push(change);
      }

      syncResults.push({
        type: 'portal',
        url: VERACROSS_URLS.portal,
        status,
        dataLength: html.length,
        pagesFound: portalData.grades?.length || 0,
        changesDetected: changes.length
      });
    } catch (error) {
      console.error('Error scraping portal:', error);
      syncResults.push({
        type: 'portal',
        url: VERACROSS_URLS.portal,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Scrape student overview page
    try {
      console.log('Scraping student overview...');
      const { html, status } = await fetchPage(VERACROSS_URLS.overview, cookies);
      
      const overviewData = parsePortalContent(html);
      overviewData.source = 'overview';
      const contentHash = simpleHash(JSON.stringify(overviewData));
      
      syncResults.push({
        type: 'overview',
        url: VERACROSS_URLS.overview,
        status,
        dataLength: html.length,
        pagesFound: 0,
        changesDetected: 0
      });
    } catch (error) {
      console.error('Error scraping overview:', error);
      syncResults.push({
        type: 'overview',
        url: VERACROSS_URLS.overview,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Scrape attendance document
    try {
      console.log('Scraping attendance...');
      const { html, status } = await fetchPage(VERACROSS_URLS.attendance, cookies);
      
      const attendanceData = {
        source: 'attendance_doc',
        rawLength: html.length,
        content: html.substring(0, 10000),
      };
      const contentHash = simpleHash(JSON.stringify(attendanceData));
      
      // Get existing snapshot
      const { data: existingSnapshot } = await supabase
        .from('page_snapshots')
        .select('*')
        .eq('user_id', userId)
        .eq('page_type', 'attendance')
        .order('captured_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Check if content changed
      if (!existingSnapshot || existingSnapshot.content_hash !== contentHash) {
        await supabase.from('page_snapshots').insert({
          user_id: userId,
          page_type: 'attendance',
          content_hash: contentHash,
          parsed_data: attendanceData,
          raw_content: html.substring(0, 50000),
          captured_at: new Date().toISOString(),
        });

        if (existingSnapshot) {
          await supabase.from('detected_changes').insert({
            user_id: userId,
            page_type: 'attendance',
            category: 'attendance_updated',
            title: 'Attendance Record Updated',
            message: 'Your attendance information has been updated',
            details: { source: 'attendance_doc' },
            is_read: false,
            detected_at: new Date().toISOString(),
          });
          allChanges.push({ category: 'attendance_updated', title: 'Attendance Updated' });
        }
      }

      syncResults.push({
        type: 'attendance',
        url: VERACROSS_URLS.attendance,
        status,
        dataLength: html.length,
        pagesFound: 0,
        changesDetected: existingSnapshot && existingSnapshot.content_hash !== contentHash ? 1 : 0
      });
    } catch (error) {
      console.error('Error scraping attendance:', error);
      syncResults.push({
        type: 'attendance',
        url: VERACROSS_URLS.attendance,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Scrape report card document
    try {
      console.log('Scraping report card...');
      const { html, status } = await fetchPage(VERACROSS_URLS.reportCard, cookies);
      
      const reportCardData = {
        source: 'report_card',
        rawLength: html.length,
        content: html.substring(0, 10000),
      };
      const contentHash = simpleHash(JSON.stringify(reportCardData));
      
      // Get existing snapshot
      const { data: existingSnapshot } = await supabase
        .from('page_snapshots')
        .select('*')
        .eq('user_id', userId)
        .eq('page_type', 'grades')
        .eq('content_hash', contentHash)
        .maybeSingle();

      // Check if content changed - save as grades since it's grade-related
      if (!existingSnapshot) {
        await supabase.from('page_snapshots').insert({
          user_id: userId,
          page_type: 'grades',
          content_hash: contentHash,
          parsed_data: reportCardData,
          raw_content: html.substring(0, 50000),
          captured_at: new Date().toISOString(),
        });

        // Check if there was a previous report card
        const { data: anyPrevious } = await supabase
          .from('page_snapshots')
          .select('id')
          .eq('user_id', userId)
          .eq('page_type', 'grades')
          .neq('content_hash', contentHash)
          .limit(1)
          .maybeSingle();

        if (anyPrevious) {
          await supabase.from('detected_changes').insert({
            user_id: userId,
            page_type: 'grades',
            category: 'grade_updated',
            title: 'Report Card Updated',
            message: 'Your report card has been updated with new information',
            details: { source: 'report_card' },
            is_read: false,
            detected_at: new Date().toISOString(),
          });
          allChanges.push({ category: 'grade_updated', title: 'Report Card Updated' });
        }
      }

      syncResults.push({
        type: 'report_card',
        url: VERACROSS_URLS.reportCard,
        status,
        dataLength: html.length,
        pagesFound: 0,
        changesDetected: 0
      });
    } catch (error) {
      console.error('Error scraping report card:', error);
      syncResults.push({
        type: 'report_card',
        url: VERACROSS_URLS.reportCard,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Scrape each course
    for (const course of VERACROSS_URLS.courses) {
      try {
        console.log(`Scraping course ${course.id}...`);
        
        // Fetch main course page
        const mainPageUrl = course.baseUrl;
        const { html: mainHtml, status: mainStatus } = await fetchPage(mainPageUrl, cookies);
        
        // Fetch pages listing
        const pagesUrl = `${course.baseUrl}/pages`;
        const { html: pagesHtml, status: pagesStatus } = await fetchPage(pagesUrl, cookies);
        
        // Combine and parse content
        const combinedHtml = mainHtml + pagesHtml;
        const courseData = parseCoursePageContent(combinedHtml, course.id);
        courseData.courseName = course.name;
        
        const contentHash = simpleHash(JSON.stringify(courseData));
        
        // Get existing snapshot for this course (using assignments type)
        const { data: existingSnapshot } = await supabase
          .from('page_snapshots')
          .select('*')
          .eq('user_id', userId)
          .eq('page_type', 'assignments')
          .order('captured_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Detect changes
        const changes = detectChanges(`course_${course.id}`, existingSnapshot?.parsed_data, courseData);
        
        // Save snapshot
        await supabase.from('page_snapshots').insert({
          user_id: userId,
          page_type: 'assignments',
          content_hash: contentHash,
          parsed_data: courseData,
          raw_content: combinedHtml.substring(0, 50000),
          captured_at: new Date().toISOString(),
        });

        // Save changes
        for (const change of changes) {
          await supabase.from('detected_changes').insert({
            user_id: userId,
            page_type: 'assignments',
            category: change.category,
            title: `[${course.name}] ${change.title}`,
            message: change.message,
            details: { ...change.details, courseId: course.id, courseName: course.name },
            is_read: false,
            detected_at: new Date().toISOString(),
          });
          allChanges.push({ ...change, course: course.name });
        }

        syncResults.push({
          type: 'course',
          courseId: course.id,
          courseName: course.name,
          url: mainPageUrl,
          status: mainStatus,
          dataLength: combinedHtml.length,
          pagesFound: courseData.pages?.length || 0,
          announcementsFound: courseData.announcements?.length || 0,
          assignmentsFound: courseData.assignments?.length || 0,
          changesDetected: changes.length
        });
        
      } catch (error) {
        console.error(`Error scraping course ${course.id}:`, error);
        syncResults.push({
          type: 'course',
          courseId: course.id,
          courseName: course.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Update sync status to completed
    const { data: currentStatus } = await supabase
      .from('sync_status')
      .select('total_syncs, successful_syncs, notification_email')
      .eq('user_id', userId)
      .maybeSingle();

    await supabase.from('sync_status').upsert({
      user_id: userId,
      is_syncing: false,
      last_sync_completed: new Date().toISOString(),
      last_sync_error: null,
      next_scheduled_sync: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      total_syncs: (currentStatus?.total_syncs || 0) + 1,
      successful_syncs: (currentStatus?.successful_syncs || 0) + 1,
    }, { onConflict: 'user_id' });

    // Send email notification if there are changes and email is configured
    if (allChanges.length > 0 && currentStatus?.notification_email) {
      try {
        console.log('Sending email notification to:', currentStatus.notification_email);
        const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-notification-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            userId,
            changes: allChanges.map(c => ({
              title: c.title,
              message: c.message || 'New update detected',
              category: c.category,
            })),
          }),
        });
        console.log('Email notification response:', await emailResponse.text());
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
      }
    }

    console.log(`Sync completed for user ${userId}. Scraped ${syncResults.length} pages, found ${allChanges.length} changes.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        changesFound: allChanges.length,
        changes: allChanges,
        syncResults,
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
