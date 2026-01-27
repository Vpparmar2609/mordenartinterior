import React from 'react';
import { cn } from '@/lib/utils';
import { UserRole, roleLabels } from '@/types/auth';
import { 
  Crown, 
  Palette, 
  PenTool, 
  HardHat, 
  Users, 
  ClipboardCheck, 
  User,
  LucideIcon
} from 'lucide-react';

interface RoleCardProps {
  role: UserRole;
  isSelected: boolean;
  onClick: () => void;
}

const roleConfig: Record<UserRole, { 
  icon: LucideIcon; 
  description: string; 
  gradient: string;
  accent: string;
}> = {
  admin: {
    icon: Crown,
    description: 'Full system access & user management',
    gradient: 'from-amber-500/20 to-orange-500/20',
    accent: 'border-amber-500/50 bg-amber-500/10',
  },
  design_head: {
    icon: Palette,
    description: 'Manage design team & approvals',
    gradient: 'from-purple-500/20 to-pink-500/20',
    accent: 'border-purple-500/50 bg-purple-500/10',
  },
  designer: {
    icon: PenTool,
    description: 'Create & upload design files',
    gradient: 'from-pink-500/20 to-rose-500/20',
    accent: 'border-pink-500/50 bg-pink-500/10',
  },
  execution_head: {
    icon: HardHat,
    description: 'Oversee all execution activities',
    gradient: 'from-green-500/20 to-emerald-500/20',
    accent: 'border-green-500/50 bg-green-500/10',
  },
  execution_manager: {
    icon: Users,
    description: 'Manage site teams & progress',
    gradient: 'from-blue-500/20 to-cyan-500/20',
    accent: 'border-blue-500/50 bg-blue-500/10',
  },
  site_supervisor: {
    icon: ClipboardCheck,
    description: 'Daily reports & site updates',
    gradient: 'from-teal-500/20 to-green-500/20',
    accent: 'border-teal-500/50 bg-teal-500/10',
  },
  client: {
    icon: User,
    description: 'View project progress & approvals',
    gradient: 'from-slate-500/20 to-gray-500/20',
    accent: 'border-slate-500/50 bg-slate-500/10',
  },
};

export const RoleCard: React.FC<RoleCardProps> = ({ role, isSelected, onClick }) => {
  const config = roleConfig[role];
  const Icon = config.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative p-4 rounded-xl border-2 transition-all duration-300 text-left w-full group',
        'hover:scale-[1.02] hover:shadow-lg',
        isSelected
          ? `${config.accent} ring-2 ring-primary/50 shadow-lg`
          : 'border-border/50 bg-card/40 hover:border-border hover:bg-card/60'
      )}
    >
      <div className={cn(
        'absolute inset-0 rounded-xl bg-gradient-to-br opacity-0 transition-opacity',
        config.gradient,
        isSelected && 'opacity-100'
      )} />
      
      <div className="relative flex items-start gap-3">
        <div className={cn(
          'p-2 rounded-lg transition-colors',
          isSelected ? config.accent : 'bg-muted'
        )}>
          <Icon className="w-5 h-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground text-sm">
            {roleLabels[role]}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {config.description}
          </p>
        </div>

        {isSelected && (
          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary animate-pulse" />
        )}
      </div>
    </button>
  );
};
