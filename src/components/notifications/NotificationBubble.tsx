import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { X, ChevronDown, ChevronUp } from 'lucide-react';

export type NotificationType = 'grade' | 'assignment' | 'announcement' | 'attendance' | 'billing' | 'calendar';

interface NotificationBubbleProps {
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  isNew?: boolean;
  onDismiss?: () => void;
  className?: string;
  details?: Record<string, any>;
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
  details,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = typeConfig[type];
  const hasDetails = details && Object.keys(details).length > 0;

  // Extract meaningful content from details
  const getDetailContent = () => {
    if (!details) return null;
    
    // Look for text content in various fields
    const textFields = ['text', 'url', 'type', 'pageCount'];
    const content: string[] = [];
    
    for (const field of textFields) {
      if (details[field]) {
        if (field === 'url') {
          content.push(`Link: ${details[field]}`);
        } else if (field === 'text') {
          content.push(details[field]);
        } else if (field === 'pageCount') {
          content.push(`${details[field]} pages found`);
        } else {
          content.push(`${field}: ${details[field]}`);
        }
      }
    }
    
    return content.length > 0 ? content : null;
  };

  const detailContent = getDetailContent();

  return (
    <div
      className={cn(
        "relative p-4 rounded-2xl border-2 transition-all duration-300 hover:scale-[1.02] fade-in-up",
        config.bgLight,
        "border-border/50",
        isNew && "glow-notification",
        hasDetails && "cursor-pointer",
        className
      )}
      onClick={hasDetails ? () => setIsExpanded(!isExpanded) : undefined}
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
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
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
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-foreground truncate">{title}</h4>
            {hasDetails && (
              <span className="text-muted-foreground">
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{message}</p>
          
          {/* Expanded details */}
          {isExpanded && detailContent && (
            <div className="mt-3 p-3 rounded-xl bg-background/50 border border-border/30">
              <p className="text-xs font-medium text-muted-foreground mb-2">Details:</p>
              {detailContent.map((item, index) => (
                <p key={index} className="text-sm text-foreground mt-1">{item}</p>
              ))}
            </div>
          )}
          
          <span className="text-xs text-muted-foreground/70 mt-1 block">{timestamp}</span>
        </div>
      </div>
    </div>
  );
};

export default NotificationBubble;
