import React from 'react';
import { cn } from '@/lib/utils';
import { Wifi, WifiOff, RefreshCw, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConnectionStatusProps {
  isConnected: boolean;
  lastSync?: string;
  nextSync?: string;
  isRefreshing?: boolean;
  onRefresh?: () => void;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  lastSync,
  nextSync,
  isRefreshing = false,
  onRefresh,
}) => {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-card border-2 border-border shadow-card">
      {/* Status indicator */}
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center",
        isConnected ? "bg-mint-light" : "bg-coral-light"
      )}>
        {isConnected ? (
          <Wifi className="w-5 h-5 text-mint" />
        ) : (
          <WifiOff className="w-5 h-5 text-coral" />
        )}
      </div>

      {/* Status text */}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className={cn(
            "w-2 h-2 rounded-full",
            isConnected ? "bg-mint animate-pulse" : "bg-coral"
          )} />
          <span className="font-semibold text-foreground">
            {isConnected ? 'Connected to Verracross' : 'Disconnected'}
          </span>
        </div>
        
        {lastSync && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
            <Clock className="w-3 h-3" />
            <span>Last sync: {lastSync}</span>
            {nextSync && <span className="text-muted-foreground/60">• Next: {nextSync}</span>}
          </div>
        )}
      </div>

      {/* Refresh button */}
      {onRefresh && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="gap-2"
        >
          <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          {isRefreshing ? 'Syncing...' : 'Sync Now'}
        </Button>
      )}
    </div>
  );
};

export default ConnectionStatus;
