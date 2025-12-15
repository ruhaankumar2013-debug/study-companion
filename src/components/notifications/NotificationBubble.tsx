import React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export type NotificationType = 'grade' | 'assignment' | 'announcement' | 'attendance' | 'billing' | 'calendar';

interface NotificationBubbleProps {
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  isNew?: boolean;
  onDismiss?: () => void;
  className?: string;
}

const typeConfig: Record<NotificationType, { emoji: string; gradient: string; bgLight: string }> = {
  grade: { 
    emoji: '📊', 
    gradient: 'from-lavender to-lavender/60',
    bgLight: 'bg-lavender-light'
  },
  assignment: { 
    emoji: '📝', 
    gradient: 'from-peach to-peach/60',
    bgLight: 'bg-peach-light'
  },
  announcement: { 
    emoji: '📢', 
    gradient: 'from-sunshine to-sunshine/60',
    bgLight: 'bg-sunshine-light'
  },
  attendance: { 
    emoji: '✅', 
    gradient: 'from-mint to-mint/60',
    bgLight: 'bg-mint-light'
  },
  billing: { 
    emoji: '💳', 
    gradient: 'from-coral to-coral/60',
    bgLight: 'bg-coral-light'
  },
  calendar: { 
    emoji: '📅', 
    gradient: 'from-sky to-sky/60',
    bgLight: 'bg-sky-light'
  },
};

const NotificationBubble: React.FC<NotificationBubbleProps> = ({
  type,
  title,
  message,
  timestamp,
  isNew = false,
  onDismiss,
  className,
}) => {
  const config = typeConfig[type];

  return (
    <div
      className={cn(
        "relative p-4 rounded-2xl border-2 transition-all duration-300 hover:scale-[1.02] fade-in-up",
        config.bgLight,
        "border-border/50",
        isNew && "glow-notification",
        className
      )}
    >
      {/* New indicator */}
      {isNew && (
        <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-coral text-primary-foreground text-xs font-bold rounded-full animate-bounce">
          NEW ✨
        </div>
      )}

      {/* Dismiss button */}
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-foreground/10 transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      )}

      <div className="flex items-start gap-3">
        {/* Emoji indicator */}
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-gradient-to-br shadow-soft",
          config.gradient
        )}>
          {config.emoji}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-6">
          <h4 className="font-bold text-foreground truncate">{title}</h4>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{message}</p>
          <span className="text-xs text-muted-foreground/70 mt-1 block">{timestamp}</span>
        </div>
      </div>
    </div>
  );
};

export default NotificationBubble;
