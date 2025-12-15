import React, { useState } from 'react';
import { 
  GraduationCap, 
  ClipboardList, 
  Megaphone, 
  CalendarDays, 
  CreditCard, 
  UserCheck,
  Bell,
  Settings,
  LogOut,
  RefreshCw,
  Zap,
  Code,
  ChevronDown,
  ChevronUp,
  Database,
  FileText,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import OwlMascot from '@/components/mascot/OwlMascot';
import DashboardCard from '@/components/dashboard/DashboardCard';
import UpdateFeed from '@/components/dashboard/UpdateFeed';
import ConnectionStatus from '@/components/dashboard/ConnectionStatus';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useVerracrossSync, DetectedChange } from '@/hooks/useVerracrossSync';
import { useToast } from '@/hooks/use-toast';
import { Update } from '@/components/dashboard/UpdateFeed';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

// Map database categories to UI notification types
const categoryToType: Record<string, 'grade' | 'assignment' | 'announcement' | 'attendance' | 'billing' | 'calendar'> = {
  grade_posted: 'grade',
  grade_updated: 'grade',
  assignment_added: 'assignment',
  assignment_updated: 'assignment',
  assignment_due_changed: 'assignment',
  announcement_added: 'announcement',
  attendance_recorded: 'attendance',
  attendance_updated: 'attendance',
  billing_item_added: 'billing',
  billing_payment_received: 'billing',
  calendar_event_added: 'calendar',
  calendar_event_removed: 'calendar',
  calendar_event_updated: 'calendar',
};

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const { 
    syncStatus, 
    changes, 
    portalData, 
    rawSnapshots,
    lastSyncResults,
    isLoading, 
    triggerSync,
    markAllAsRead,
    deleteChange,
    unreadCount 
  } = useVerracrossSync(user.id);
  
  const { toast } = useToast();
  const [showRawData, setShowRawData] = useState(false);
  const [expandedSnapshot, setExpandedSnapshot] = useState<string | null>(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning! Ready for a great day? ☀️";
    if (hour < 17) return "Good afternoon! Keep up the great work! 💪";
    return "Good evening! Time to wind down 🌙";
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString();
  };

  // Convert database changes to UI updates
  const updates: Update[] = changes.map(change => ({
    id: change.id,
    type: categoryToType[change.category] || 'announcement',
    title: change.title,
    message: change.message,
    timestamp: formatTimestamp(change.detected_at),
    isNew: !change.is_read,
  }));

  // Get unread updates prominently
  const unreadUpdates = updates.filter(u => u.isNew);
  const readUpdates = updates.filter(u => !u.isNew);

  // Calculate stats from portal data
  const gradesData = portalData?.grades || { gpa: '--', grades: [] };
  const assignmentsData = portalData?.assignments || { pending: [] };
  const announcementsData = portalData?.announcements || { announcements: [] };
  const attendanceData = portalData?.attendance || { rate: '--%', daysPresent: 0, daysAbsent: 0 };
  const billingData = portalData?.billing || { balance: '--', nextDue: '--' };
  const calendarData = portalData?.calendar || { events: [] };

  // Count updates per category
  const updateCounts = {
    grades: changes.filter(c => c.category.startsWith('grade') && !c.is_read).length,
    assignments: changes.filter(c => c.category.startsWith('assignment') && !c.is_read).length,
    announcements: changes.filter(c => c.category.startsWith('announcement') && !c.is_read).length,
    attendance: changes.filter(c => c.category.startsWith('attendance') && !c.is_read).length,
    billing: changes.filter(c => c.category.startsWith('billing') && !c.is_read).length,
    calendar: changes.filter(c => c.category.startsWith('calendar') && !c.is_read).length,
  };

  const lastSyncTime = syncStatus?.last_sync_completed 
    ? formatTimestamp(syncStatus.last_sync_completed)
    : 'Never';

  const nextSyncTime = syncStatus?.next_scheduled_sync
    ? `in ${Math.max(0, Math.floor((new Date(syncStatus.next_scheduled_sync).getTime() - Date.now()) / 60000))} min`
    : '--';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b-2 border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              <OwlMascot size="sm" mood={unreadCount > 0 ? 'excited' : 'happy'} />
              <div>
                <h1 className="text-xl font-bold text-foreground">Veracross Dashboard</h1>
                <p className="text-sm text-muted-foreground">SNS Student Portal</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Sync Now button */}
              <Button 
                variant="glow" 
                size="sm" 
                onClick={triggerSync}
                disabled={isLoading}
                className="gap-2"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Sync Now</span>
              </Button>

              {/* Notification bell */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-coral text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </Button>
              
              <Button 
                variant={showRawData ? "default" : "ghost"} 
                size="icon"
                onClick={() => setShowRawData(!showRawData)}
                title="Toggle Raw Data View"
              >
                <Code className="w-5 h-5" />
              </Button>
              
              <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Unread Updates Banner */}
        {unreadCount > 0 && (
          <section className="p-4 rounded-2xl bg-gradient-to-r from-lavender/20 to-peach/20 border-2 border-lavender/30 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔔</span>
                <div>
                  <h3 className="font-bold text-foreground">
                    {unreadCount} New Update{unreadCount > 1 ? 's' : ''}!
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    You have updates you haven't seen yet
                  </p>
                </div>
              </div>
              <Button variant="lavender" size="sm" onClick={markAllAsRead}>
                Mark all as read
              </Button>
            </div>
            
            {/* Quick preview of unread updates */}
            <div className="mt-4 space-y-2">
              {unreadUpdates.slice(0, 3).map(update => (
                <div key={update.id} className="p-3 rounded-xl bg-card border flex items-start gap-3">
                  <Badge variant="default" className="shrink-0">NEW</Badge>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{update.title}</p>
                    <p className="text-sm text-muted-foreground truncate">{update.message}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{update.timestamp}</span>
                </div>
              ))}
              {unreadUpdates.length > 3 && (
                <p className="text-sm text-center text-muted-foreground">
                  +{unreadUpdates.length - 3} more updates below
                </p>
              )}
            </div>
          </section>
        )}

        {/* Welcome Section */}
        <section className="flex flex-col sm:flex-row items-center gap-4 p-6 rounded-3xl gradient-hero border-2 border-border/30">
          <OwlMascot 
            size="lg" 
            mood={unreadCount > 0 ? 'excited' : 'happy'} 
            greeting={getGreeting()}
          />
          <div className="text-center sm:text-left flex-1">
            <h2 className="text-2xl font-bold text-foreground">Welcome back! 👋</h2>
            <p className="text-muted-foreground mt-1">
              {unreadCount > 0 
                ? `You have ${unreadCount} new update${unreadCount > 1 ? 's' : ''} to check out!`
                : portalData ? "Everything's up to date. Keep being awesome!" : "Click 'Sync Now' to fetch your latest data!"
              }
            </p>
          </div>
          
          {/* Quick Sync Button */}
          <Button 
            variant="lavender" 
            size="lg" 
            onClick={triggerSync}
            disabled={isLoading}
            className="gap-2 whitespace-nowrap"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                Sync from Veracross
              </>
            )}
          </Button>
        </section>

        {/* Connection Status */}
        <ConnectionStatus
          isConnected={true}
          lastSync={lastSyncTime}
          nextSync={nextSyncTime}
          isRefreshing={isLoading}
          onRefresh={triggerSync}
        />

        {/* Raw Data View (Collapsible) */}
        {showRawData && (
          <Card className="border-2 border-lavender/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Raw Scraped Data
                <Badge variant="outline" className="ml-2">Debug View</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="results" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="results">Sync Results</TabsTrigger>
                  <TabsTrigger value="snapshots">Page Snapshots</TabsTrigger>
                  <TabsTrigger value="parsed">Parsed Data</TabsTrigger>
                </TabsList>

                <TabsContent value="results" className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Results from the last sync operation ({lastSyncResults.length} pages scraped)
                  </p>
                  <ScrollArea className="h-[400px] rounded-xl border p-4 bg-muted/30">
                    {lastSyncResults.length > 0 ? (
                      <div className="space-y-3">
                        {lastSyncResults.map((result, idx) => (
                          <div key={idx} className="p-3 rounded-lg bg-card border">
                            <div className="flex items-center gap-2 mb-2">
                              {result.error ? (
                                <AlertCircle className="w-4 h-4 text-coral" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4 text-mint" />
                              )}
                              <span className="font-medium">
                                {result.type === 'portal' ? 'Student Portal' : result.courseName || `Course ${result.courseId}`}
                              </span>
                              {result.status && (
                                <Badge variant={result.status === 200 ? 'default' : 'destructive'}>
                                  HTTP {result.status}
                                </Badge>
                              )}
                            </div>
                            {result.url && (
                              <p className="text-xs text-muted-foreground break-all mb-2">{result.url}</p>
                            )}
                            {result.error ? (
                              <p className="text-sm text-coral">{result.error}</p>
                            ) : (
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>Data: <span className="font-mono">{result.dataLength?.toLocaleString()} bytes</span></div>
                                <div>Pages: <span className="font-mono">{result.pagesFound}</span></div>
                                {result.announcementsFound !== undefined && (
                                  <div>Announcements: <span className="font-mono">{result.announcementsFound}</span></div>
                                )}
                                {result.assignmentsFound !== undefined && (
                                  <div>Assignments: <span className="font-mono">{result.assignmentsFound}</span></div>
                                )}
                                <div>Changes: <span className="font-mono">{result.changesDetected}</span></div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        No sync results yet. Click "Sync Now" to fetch data.
                      </p>
                    )}
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="snapshots" className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Raw HTML snapshots stored from Veracross ({rawSnapshots.length} snapshots)
                  </p>
                  <ScrollArea className="h-[400px] rounded-xl border p-4 bg-muted/30">
                    {rawSnapshots.length > 0 ? (
                      <div className="space-y-3">
                        {rawSnapshots.map((snapshot, idx) => (
                          <div key={idx} className="rounded-lg bg-card border overflow-hidden">
                            <button
                              className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                              onClick={() => setExpandedSnapshot(
                                expandedSnapshot === `${snapshot.page_type}-${idx}` 
                                  ? null 
                                  : `${snapshot.page_type}-${idx}`
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                <span className="font-medium capitalize">{snapshot.page_type}</span>
                                <Badge variant="outline" className="text-xs">
                                  {formatTimestamp(snapshot.captured_at)}
                                </Badge>
                              </div>
                              {expandedSnapshot === `${snapshot.page_type}-${idx}` ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                            {expandedSnapshot === `${snapshot.page_type}-${idx}` && (
                              <div className="p-3 border-t">
                                <p className="text-xs text-muted-foreground mb-2">
                                  Hash: {snapshot.content_hash}
                                </p>
                                {snapshot.raw_content && (
                                  <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto max-h-60 whitespace-pre-wrap">
                                    {snapshot.raw_content.substring(0, 5000)}
                                    {snapshot.raw_content.length > 5000 && '...\n[truncated]'}
                                  </pre>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        No snapshots yet. Click "Sync Now" to fetch data.
                      </p>
                    )}
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="parsed" className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Parsed and extracted data from the scraped pages
                  </p>
                  <ScrollArea className="h-[400px] rounded-xl border p-4 bg-muted/30">
                    {rawSnapshots.length > 0 ? (
                      <div className="space-y-3">
                        {rawSnapshots.map((snapshot, idx) => (
                          <div key={idx} className="rounded-lg bg-card border overflow-hidden">
                            <button
                              className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                              onClick={() => setExpandedSnapshot(
                                expandedSnapshot === `parsed-${snapshot.page_type}-${idx}` 
                                  ? null 
                                  : `parsed-${snapshot.page_type}-${idx}`
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <Code className="w-4 h-4" />
                                <span className="font-medium capitalize">{snapshot.page_type}</span>
                              </div>
                              {expandedSnapshot === `parsed-${snapshot.page_type}-${idx}` ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                            {expandedSnapshot === `parsed-${snapshot.page_type}-${idx}` && (
                              <div className="p-3 border-t">
                                <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto max-h-60">
                                  {JSON.stringify(snapshot.parsed_data, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        No parsed data yet. Click "Sync Now" to fetch data.
                      </p>
                    )}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <DashboardCard
            title="Grades"
            icon={GraduationCap}
            variant="lavender"
            value={gradesData.gpa}
            subtitle="GPA"
            hasUpdates={updateCounts.grades > 0}
            updateCount={updateCounts.grades}
          >
            <div className="space-y-2 mt-2">
              {(gradesData.grades || []).slice(0, 3).map((item: any, i: number) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-muted-foreground truncate">{item.subject}</span>
                  <span className="font-semibold text-foreground">{item.grade}</span>
                </div>
              ))}
              {(!gradesData.grades || gradesData.grades.length === 0) && (
                <p className="text-sm text-muted-foreground">Sync to load grades</p>
              )}
            </div>
          </DashboardCard>

          <DashboardCard
            title="Assignments"
            icon={ClipboardList}
            variant="peach"
            value={(assignmentsData.pending || []).length}
            subtitle="pending"
            hasUpdates={updateCounts.assignments > 0}
            updateCount={updateCounts.assignments}
          >
            <div className="space-y-2 mt-2">
              {(assignmentsData.pending || []).slice(0, 2).map((item: any, i: number) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-muted-foreground truncate">{item.title}</span>
                  <span className="font-medium text-peach">{item.dueDate}</span>
                </div>
              ))}
              {(!assignmentsData.pending || assignmentsData.pending.length === 0) && (
                <p className="text-sm text-muted-foreground">Sync to load assignments</p>
              )}
            </div>
          </DashboardCard>

          <DashboardCard
            title="Announcements"
            icon={Megaphone}
            variant="sunshine"
            value={(announcementsData.announcements || []).length}
            subtitle="total"
            hasUpdates={updateCounts.announcements > 0}
            updateCount={updateCounts.announcements}
          >
            <div className="space-y-2 mt-2">
              {(announcementsData.announcements || []).slice(0, 2).map((item: any, i: number) => (
                <div key={i} className="text-sm">
                  <span className="font-medium text-foreground line-clamp-1">{item.title}</span>
                </div>
              ))}
              {(!announcementsData.announcements || announcementsData.announcements.length === 0) && (
                <p className="text-sm text-muted-foreground">Sync to load announcements</p>
              )}
            </div>
          </DashboardCard>

          <DashboardCard
            title="Attendance"
            icon={UserCheck}
            variant="mint"
            value={attendanceData.rate}
            subtitle="rate"
            hasUpdates={updateCounts.attendance > 0}
            updateCount={updateCounts.attendance}
          >
            <div className="flex gap-4 mt-2 text-sm">
              <div>
                <span className="text-mint font-bold">{attendanceData.daysPresent}</span>
                <span className="text-muted-foreground ml-1">present</span>
              </div>
              <div>
                <span className="text-coral font-bold">{attendanceData.daysAbsent}</span>
                <span className="text-muted-foreground ml-1">absent</span>
              </div>
            </div>
          </DashboardCard>

          <DashboardCard
            title="Billing"
            icon={CreditCard}
            variant="coral"
            value={billingData.balance}
            subtitle="balance"
            hasUpdates={updateCounts.billing > 0}
            updateCount={updateCounts.billing}
          >
            <p className="text-sm text-muted-foreground mt-2">
              Next payment: <span className="font-medium text-foreground">{billingData.nextDue}</span>
            </p>
          </DashboardCard>

          <DashboardCard
            title="Calendar"
            icon={CalendarDays}
            variant="sky"
            value={(calendarData.events || []).length}
            subtitle="upcoming events"
            hasUpdates={updateCounts.calendar > 0}
            updateCount={updateCounts.calendar}
          >
            <div className="space-y-2 mt-2">
              {(calendarData.events || []).slice(0, 2).map((item: any, i: number) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-muted-foreground truncate">{item.title}</span>
                  <span className="font-medium text-sky">{item.date}</span>
                </div>
              ))}
              {(!calendarData.events || calendarData.events.length === 0) && (
                <p className="text-sm text-muted-foreground">Sync to load events</p>
              )}
            </div>
          </DashboardCard>
        </div>

        {/* Recent Updates Feed */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <span className="text-xl">📬</span>
                All Updates
                {syncStatus && (
                  <span className="text-sm font-normal text-muted-foreground">
                    ({syncStatus.successful_syncs} syncs completed)
                  </span>
                )}
              </CardTitle>
              {updates.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={markAllAsRead}
                >
                  Mark all as read
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <UpdateFeed updates={updates} onDismiss={deleteChange} />
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-border mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            <span>Made with</span>
            <span className="text-coral">❤️</span>
            <span>by your friendly owl companion</span>
            <span className="text-lg">🦉</span>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
