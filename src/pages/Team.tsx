import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { roleLabels, UserRole } from '@/types/auth';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/contexts/AuthContext';
import { CreateUserDialog } from '@/components/users/CreateUserDialog';
import { 
  Search, 
  Mail, 
  Phone,
  Crown,
  Palette,
  PenTool,
  Users,
  ClipboardCheck,
  Calculator,
  Shield,
  AlertCircle,
  Plus,
  Trash2,
  Loader2
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

const roleIcons: Record<UserRole, React.ReactNode> = {
  admin: <Crown className="w-4 h-4" />,
  design_head: <Palette className="w-4 h-4" />,
  designer: <PenTool className="w-4 h-4" />,
  execution_manager: <Users className="w-4 h-4" />,
  site_supervisor: <ClipboardCheck className="w-4 h-4" />,
  account_manager: <Calculator className="w-4 h-4" />,
};

const allRoles: UserRole[] = [
  'admin',
  'design_head',
  'designer',
  'execution_manager',
  'site_supervisor',
  'account_manager',
];

const Team: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<UserRole | 'all'>('all');
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const { users, isLoading, assignRole, removeUserRole, refetch } = useUsers();
  const { role: currentUserRole } = useAuth();

  const isAdmin = currentUserRole === 'admin';

  const filteredMembers = users.filter((member) => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRoleFilter === 'all' || member.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  // Sort: users without roles first, then by name
  const sortedMembers = [...filteredMembers].sort((a, b) => {
    if (!a.role && b.role) return -1;
    if (a.role && !b.role) return 1;
    return a.name.localeCompare(b.name);
  });

  const handleRoleAssign = async (userId: string, newRole: UserRole) => {
    try {
      await assignRole.mutateAsync({ userId, role: newRole });
      toast.success(`Role assigned successfully!`);
    } catch (error) {
      toast.error('Failed to assign role. Please try again.');
    }
  };

  const handleRemoveUser = async (userId: string) => {
    setRemovingUserId(userId);
    try {
      await removeUserRole.mutateAsync(userId);
      toast.success('User role removed successfully!');
    } catch (error) {
      toast.error('Failed to remove user role.');
    } finally {
      setRemovingUserId(null);
    }
  };

  const roles: (UserRole | 'all')[] = ['all', ...allRoles];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-muted-foreground">Loading team...</div>
      </div>
    );
  }

  const pendingUsers = users.filter(u => !u.role);

  return (
    <div className="space-y-4 animate-fade-in pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-3xl font-display font-semibold text-foreground">Team</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {users.length} member{users.length !== 1 ? 's' : ''}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setCreateUserOpen(true)} size="sm" className="bg-gradient-warm">
            <Plus className="w-4 h-4 mr-1" />
            Add User
          </Button>
        )}
      </div>

      {/* Pending Role Assignments Alert */}
      {isAdmin && pendingUsers.length > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{pendingUsers.length} user(s)</span> waiting for role assignment.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Role Filter - horizontal scroll on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {roles.map((role) => (
          <Button
            key={role}
            size="sm"
            variant={selectedRoleFilter === role ? 'default' : 'outline'}
            onClick={() => setSelectedRoleFilter(role)}
            className={`shrink-0 text-xs ${selectedRoleFilter === role ? 'bg-gradient-warm' : ''}`}
          >
            {role === 'all' ? 'All' : roleLabels[role]}
          </Button>
        ))}
      </div>

      {/* Team List - mobile-first card layout */}
      <div className="space-y-3">
        {sortedMembers.map((member, index) => (
          <Card 
            key={member.id} 
            className={`glass-card animate-fade-in ${!member.role ? 'border-warning/50' : ''}`}
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Avatar className={`h-11 w-11 shrink-0 ${member.role ? 'bg-gradient-warm' : 'bg-muted'}`}>
                  <AvatarFallback className="bg-transparent text-primary-foreground font-medium text-sm">
                    {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-medium text-foreground text-sm truncate">{member.name}</h3>
                    {member.role ? (
                      <Badge variant="outline" className="text-xs gap-1 shrink-0">
                        {roleIcons[member.role]}
                        {roleLabels[member.role]}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs gap-1 shrink-0 border-warning text-warning">
                        <Shield className="w-3 h-3" />
                        No Role
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
                    <Mail className="w-3 h-3 shrink-0" />
                    <span className="text-xs truncate">{member.email}</span>
                  </div>
                  {member.phone && (
                    <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
                      <Phone className="w-3 h-3 shrink-0" />
                      <span className="text-xs">{member.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Admin controls */}
              {isAdmin && (
                <div className="mt-3 pt-3 border-t border-border flex gap-2">
                  <Select
                    value={member.role || ''}
                    onValueChange={(value) => handleRoleAssign(member.id, value as UserRole)}
                  >
                    <SelectTrigger className="flex-1 h-8 text-xs">
                      <SelectValue placeholder="Assign role..." />
                    </SelectTrigger>
                    <SelectContent>
                      {allRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                          <div className="flex items-center gap-2 text-xs">
                            {roleIcons[role]}
                            {roleLabels[role]}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {member.role && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          {removingUserId === member.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="mx-4">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove user role?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove {member.name}'s role. They'll lose access until reassigned.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemoveUser(member.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {sortedMembers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No team members found matching your criteria.</p>
        </div>
      )}

      {/* Create User Dialog */}
      <CreateUserDialog 
        open={createUserOpen} 
        onOpenChange={setCreateUserOpen}
        onSuccess={() => refetch()}
      />
    </div>
  );
};

export default Team;
