import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUsers } from '@/hooks/useUsers';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { roleLabels } from '@/types/auth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Crown, 
  Palette, 
  PenTool, 
  Users, 
  ClipboardCheck, 
  Loader2,
  Shield
} from 'lucide-react';

const roleIcons: Record<UserRole, React.ReactNode> = {
  admin: <Crown className="w-4 h-4" />,
  design_head: <Palette className="w-4 h-4" />,
  designer: <PenTool className="w-4 h-4" />,
  execution_manager: <Users className="w-4 h-4" />,
  site_supervisor: <ClipboardCheck className="w-4 h-4" />,
};

const roleColors: Record<UserRole, string> = {
  admin: 'bg-primary/20 text-primary',
  design_head: 'bg-accent/20 text-accent',
  designer: 'bg-blue-500/20 text-blue-500',
  execution_manager: 'bg-green-500/20 text-green-500',
  site_supervisor: 'bg-yellow-500/20 text-yellow-500',
};

interface UserManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserManagementDialog: React.FC<UserManagementDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { users, isLoading, assignRole } = useUsers();
  const { user: currentUser } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const handleAssignRole = async (userId: string, role: UserRole) => {
    await assignRole.mutateAsync({ userId, role });
    setSelectedUserId(null);
    setSelectedRole(null);
  };

  const roles: UserRole[] = ['admin', 'design_head', 'designer', 'execution_manager', 'site_supervisor'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Shield className="w-5 h-5" />
            User Management
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Manage user roles. Users can sign up and you assign their roles here.
          </p>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No users registered yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card/60 hover:bg-card transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {user.name}
                        {user.id === currentUser?.id && (
                          <span className="text-xs text-muted-foreground ml-2">(You)</span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedUserId === user.id ? (
                      <div className="flex items-center gap-2">
                        <Select
                          value={selectedRole || undefined}
                          onValueChange={(value) => setSelectedRole(value as UserRole)}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem key={role} value={role}>
                                <div className="flex items-center gap-2">
                                  {roleIcons[role]}
                                  {roleLabels[role]}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          onClick={() => selectedRole && handleAssignRole(user.id, selectedRole)}
                          disabled={!selectedRole || assignRole.isPending}
                        >
                          {assignRole.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedUserId(null);
                            setSelectedRole(null);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <>
                        {user.role ? (
                          <Badge className={`${roleColors[user.role]} border-0 flex items-center gap-1`}>
                            {roleIcons[user.role]}
                            {roleLabels[user.role]}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            No Role
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedUserId(user.id);
                            setSelectedRole(user.role);
                          }}
                          disabled={user.id === currentUser?.id}
                        >
                          Edit
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
