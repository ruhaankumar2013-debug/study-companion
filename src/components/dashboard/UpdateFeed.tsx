import React from 'react';
import NotificationBubble, { NotificationType } from '@/components/notifications/NotificationBubble';

export interface Update {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  isNew: boolean;
  details?: Record<string, any>;
}

interface UpdateFeedProps {
  updates: Update[];
  onDismiss?: (id: string) => void;
}

const UpdateFeed: React.FC<UpdateFeedProps> = ({ updates, onDismiss }) => {
  if (updates.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="text-4xl mb-4 block">🦉</span>
        <p className="text-muted-foreground font-medium">No updates yet!</p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Your owl friend will notify you when something changes
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {updates.map((update, index) => (
        <div
          key={update.id}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <NotificationBubble
            type={update.type}
            title={update.title}
            message={update.message}
            timestamp={update.timestamp}
            isNew={update.isNew}
            details={update.details}
            onDismiss={onDismiss ? () => onDismiss(update.id) : undefined}
          />
        </div>
      ))}
    </div>
  );
};

export default UpdateFeed;
