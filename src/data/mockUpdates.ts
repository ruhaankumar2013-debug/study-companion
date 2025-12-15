import { Update } from '@/components/dashboard/UpdateFeed';

export const mockUpdates: Update[] = [
  {
    id: '1',
    type: 'grade',
    title: 'New Grade Posted! 🎉',
    message: 'You received an A- on your History essay "The Industrial Revolution"',
    timestamp: '2 minutes ago',
    isNew: true,
  },
  {
    id: '2',
    type: 'assignment',
    title: 'Assignment Updated',
    message: 'Math homework due date extended to Friday',
    timestamp: '15 minutes ago',
    isNew: true,
  },
  {
    id: '3',
    type: 'announcement',
    title: 'School Announcement',
    message: 'Spirit Week starts next Monday! Dress themes attached.',
    timestamp: '1 hour ago',
    isNew: false,
  },
  {
    id: '4',
    type: 'calendar',
    title: 'New Event Added',
    message: 'Parent-Teacher Conference scheduled for Dec 18th',
    timestamp: '2 hours ago',
    isNew: false,
  },
  {
    id: '5',
    type: 'attendance',
    title: 'Attendance Recorded',
    message: 'Present in all classes today ✓',
    timestamp: '4 hours ago',
    isNew: false,
  },
  {
    id: '6',
    type: 'billing',
    title: 'Payment Received',
    message: 'Tuition payment for January has been processed',
    timestamp: 'Yesterday',
    isNew: false,
  },
];

export const dashboardStats = {
  grades: {
    gpa: '3.8',
    recentGrades: [
      { subject: 'History', grade: 'A-', assignment: 'Essay' },
      { subject: 'Math', grade: 'B+', assignment: 'Quiz' },
      { subject: 'English', grade: 'A', assignment: 'Presentation' },
    ],
    updateCount: 1,
  },
  assignments: {
    pending: 5,
    upcoming: [
      { subject: 'Physics', title: 'Lab Report', due: 'Tomorrow' },
      { subject: 'Spanish', title: 'Vocab Quiz', due: 'Wed' },
      { subject: 'Art', title: 'Portfolio', due: 'Friday' },
    ],
    updateCount: 1,
  },
  announcements: {
    unread: 3,
    recent: [
      { title: 'Spirit Week', preview: 'Get ready for fun themes...' },
      { title: 'Winter Break', preview: 'Dec 20 - Jan 3...' },
    ],
    updateCount: 0,
  },
  attendance: {
    rate: '98%',
    daysPresent: 42,
    daysAbsent: 1,
    updateCount: 0,
  },
  billing: {
    balance: '$0.00',
    nextDue: 'Feb 1, 2025',
    updateCount: 0,
  },
  calendar: {
    eventsToday: 2,
    upcoming: [
      { title: 'Math Test', date: 'Dec 16' },
      { title: 'Winter Concert', date: 'Dec 18' },
    ],
    updateCount: 1,
  },
};
