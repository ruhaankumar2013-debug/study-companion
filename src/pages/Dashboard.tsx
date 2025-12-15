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
  LogOut
} from 'lucide-react';
import OwlMascot from '@/components/mascot/OwlMascot';
import DashboardCard from '@/components/dashboard/DashboardCard';
import UpdateFeed, { Update } from '@/components/dashboard/UpdateFeed';
import ConnectionStatus from '@/components/dashboard/ConnectionStatus';
import { Button } from '@/components/ui/button';
import { mockUpdates, dashboardStats } from '@/data/mockUpdates';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [updates, setUpdates] = useState<Update[]>(mockUpdates);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleDismiss = (id: string) => {
    setUpdates(prev => prev.filter(u => u.id !== id));
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 2000);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning! Ready for a great day? ☀️";
    if (hour < 17) return "Good afternoon! Keep up the great work! 💪";
    return "Good evening! Time to wind down 🌙";
  };

  const newUpdatesCount = updates.filter(u => u.isNew).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b-2 border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              <OwlMascot size="sm" mood={newUpdatesCount > 0 ? 'excited' : 'happy'} />
              <div>
                <h1 className="text-xl font-bold text-foreground">Student Dashboard</h1>
                <p className="text-sm text-muted-foreground">Your friendly study companion</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Notification bell */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                {newUpdatesCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-coral text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center animate-bounce">
                    {newUpdatesCount}
                  </span>
                )}
              </Button>
              
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
              
              <Button variant="outline" size="sm" onClick={onLogout} className="gap-2">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Welcome Section */}
        <section className="flex flex-col sm:flex-row items-center gap-4 p-6 rounded-3xl gradient-hero border-2 border-border/30">
          <OwlMascot 
            size="lg" 
            mood={newUpdatesCount > 0 ? 'excited' : 'happy'} 
            greeting={getGreeting()}
          />
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-bold text-foreground">Welcome back, Student! 👋</h2>
            <p className="text-muted-foreground mt-1">
              {newUpdatesCount > 0 
                ? `You have ${newUpdatesCount} new update${newUpdatesCount > 1 ? 's' : ''} to check out!`
                : "Everything's up to date. Keep being awesome!"
              }
            </p>
          </div>
        </section>

        {/* Connection Status */}
        <ConnectionStatus
          isConnected={true}
          lastSync="Just now"
          nextSync="in 15 minutes"
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
        />

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <DashboardCard
            title="Grades"
            icon={GraduationCap}
            variant="lavender"
            value={dashboardStats.grades.gpa}
            subtitle="GPA"
            hasUpdates={dashboardStats.grades.updateCount > 0}
            updateCount={dashboardStats.grades.updateCount}
          >
            <div className="space-y-2 mt-2">
              {dashboardStats.grades.recentGrades.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.subject}</span>
                  <span className="font-semibold text-foreground">{item.grade}</span>
                </div>
              ))}
            </div>
          </DashboardCard>

          <DashboardCard
            title="Assignments"
            icon={ClipboardList}
            variant="peach"
            value={dashboardStats.assignments.pending}
            subtitle="pending"
            hasUpdates={dashboardStats.assignments.updateCount > 0}
            updateCount={dashboardStats.assignments.updateCount}
          >
            <div className="space-y-2 mt-2">
              {dashboardStats.assignments.upcoming.slice(0, 2).map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-muted-foreground truncate">{item.title}</span>
                  <span className="font-medium text-peach">{item.due}</span>
                </div>
              ))}
            </div>
          </DashboardCard>

          <DashboardCard
            title="Announcements"
            icon={Megaphone}
            variant="sunshine"
            value={dashboardStats.announcements.unread}
            subtitle="unread"
            hasUpdates={dashboardStats.announcements.updateCount > 0}
            updateCount={dashboardStats.announcements.updateCount}
          >
            <div className="space-y-2 mt-2">
              {dashboardStats.announcements.recent.map((item, i) => (
                <div key={i} className="text-sm">
                  <span className="font-medium text-foreground">{item.title}</span>
                </div>
              ))}
            </div>
          </DashboardCard>

          <DashboardCard
            title="Attendance"
            icon={UserCheck}
            variant="mint"
            value={dashboardStats.attendance.rate}
            subtitle="rate"
          >
            <div className="flex gap-4 mt-2 text-sm">
              <div>
                <span className="text-mint font-bold">{dashboardStats.attendance.daysPresent}</span>
                <span className="text-muted-foreground ml-1">present</span>
              </div>
              <div>
                <span className="text-coral font-bold">{dashboardStats.attendance.daysAbsent}</span>
                <span className="text-muted-foreground ml-1">absent</span>
              </div>
            </div>
          </DashboardCard>

          <DashboardCard
            title="Billing"
            icon={CreditCard}
            variant="coral"
            value={dashboardStats.billing.balance}
            subtitle="balance"
          >
            <p className="text-sm text-muted-foreground mt-2">
              Next payment: <span className="font-medium text-foreground">{dashboardStats.billing.nextDue}</span>
            </p>
          </DashboardCard>

          <DashboardCard
            title="Calendar"
            icon={CalendarDays}
            variant="sky"
            value={dashboardStats.calendar.eventsToday}
            subtitle="events today"
            hasUpdates={dashboardStats.calendar.updateCount > 0}
            updateCount={dashboardStats.calendar.updateCount}
          >
            <div className="space-y-2 mt-2">
              {dashboardStats.calendar.upcoming.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-muted-foreground truncate">{item.title}</span>
                  <span className="font-medium text-sky">{item.date}</span>
                </div>
              ))}
            </div>
          </DashboardCard>
        </div>

        {/* Recent Updates Feed */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <span className="text-xl">📬</span>
                Recent Updates
              </CardTitle>
              {updates.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setUpdates(prev => prev.map(u => ({ ...u, isNew: false })))}
                >
                  Mark all as read
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <UpdateFeed updates={updates} onDismiss={handleDismiss} />
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
