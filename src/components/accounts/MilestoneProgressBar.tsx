import React from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MilestoneSegment {
  label: string;
  percentage: number;
  status: 'pending' | 'partial' | 'completed';
  paid: number;
  required: number;
}

interface MilestoneProgressBarProps {
  segments: MilestoneSegment[];
  totalPaid: number;
  totalCost: number;
  className?: string;
  compact?: boolean;
}

const statusColors = {
  completed: 'bg-success',
  partial: 'bg-warning',
  pending: 'bg-muted-foreground/20',
};

export const MilestoneProgressBar: React.FC<MilestoneProgressBarProps> = ({
  segments,
  totalPaid,
  totalCost,
  className,
  compact = false,
}) => {
  const overallPercent = totalCost > 0 ? Math.round((totalPaid / totalCost) * 100) : 0;

  return (
    <div className={cn('space-y-2', className)}>
      {/* Overall percentage label */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground font-medium">
          {overallPercent}% collected
        </span>
        {!compact && (
          <span className="text-muted-foreground">
            {segments.filter(s => s.status === 'completed').length}/{segments.length} milestones
          </span>
        )}
      </div>

      {/* Segmented bar */}
      <TooltipProvider delayDuration={200}>
        <div className="flex h-3 rounded-full overflow-hidden bg-muted/30 gap-px">
          {segments.map((seg, i) => {
            const fillPercent = seg.required > 0 ? Math.min(100, (seg.paid / seg.required) * 100) : 0;
            return (
              <Tooltip key={i}>
                <TooltipTrigger asChild>
                  <div
                    className="relative overflow-hidden transition-all"
                    style={{ flex: seg.percentage }}
                  >
                    {/* Background */}
                    <div className="absolute inset-0 bg-muted-foreground/10" />
                    {/* Fill */}
                    <div
                      className={cn(
                        'absolute inset-y-0 left-0 transition-all duration-500',
                        statusColors[seg.status]
                      )}
                      style={{ width: `${fillPercent}%` }}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  <p className="font-medium">{seg.label}</p>
                  <p>{seg.percentage}% • ₹{seg.paid.toLocaleString('en-IN')} / ₹{seg.required.toLocaleString('en-IN')}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>

      {/* Legend dots - only in non-compact mode */}
      {!compact && (
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-success" /> Completed
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-warning" /> Partial
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-muted-foreground/20" /> Pending
          </span>
        </div>
      )}
    </div>
  );
};
