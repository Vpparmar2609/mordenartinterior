import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Pencil, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ExecutionTimelineEditorProps {
  projectId: string;
  currentStartDate: string | null;
  currentEndDate: string | null;
  onSave: (projectId: string, startDate: string, endDate: string) => void;
  isSaving?: boolean;
}

export const ExecutionTimelineEditor: React.FC<ExecutionTimelineEditorProps> = ({
  projectId,
  currentStartDate,
  currentEndDate,
  onSave,
  isSaving,
}) => {
  const [editing, setEditing] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(
    currentStartDate ? new Date(currentStartDate) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    currentEndDate ? new Date(currentEndDate) : undefined
  );

  const handleSave = () => {
    if (!startDate || !endDate) return;
    onSave(projectId, format(startDate, 'yyyy-MM-dd'), format(endDate, 'yyyy-MM-dd'));
    setEditing(false);
  };

  const handleCancel = () => {
    setStartDate(currentStartDate ? new Date(currentStartDate) : undefined);
    setEndDate(currentEndDate ? new Date(currentEndDate) : undefined);
    setEditing(false);
  };

  if (!editing) {
    return (
      <Button
        size="sm"
        variant="ghost"
        className="h-7 text-xs gap-1"
        onClick={(e) => { e.stopPropagation(); setEditing(true); }}
      >
        <Pencil className="w-3 h-3" />
        {currentStartDate && currentEndDate
          ? `${format(new Date(currentStartDate), 'dd MMM')} – ${format(new Date(currentEndDate), 'dd MMM yyyy')}`
          : 'Set Timeline'}
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn("h-8 text-xs justify-start", !startDate && "text-muted-foreground")}
          >
            <CalendarIcon className="w-3 h-3 mr-1" />
            {startDate ? format(startDate, 'dd MMM yyyy') : 'Start'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={startDate}
            onSelect={setStartDate}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>

      <span className="text-xs text-muted-foreground">to</span>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn("h-8 text-xs justify-start", !endDate && "text-muted-foreground")}
          >
            <CalendarIcon className="w-3 h-3 mr-1" />
            {endDate ? format(endDate, 'dd MMM yyyy') : 'End'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={endDate}
            onSelect={setEndDate}
            disabled={(date) => startDate ? date < startDate : false}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>

      <Button size="sm" variant="default" className="h-8 text-xs" onClick={handleSave} disabled={!startDate || !endDate || isSaving}>
        <Check className="w-3 h-3" />
      </Button>
      <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={handleCancel}>
        <X className="w-3 h-3" />
      </Button>
    </div>
  );
};
