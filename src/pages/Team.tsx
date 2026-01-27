import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { roleLabels, UserRole } from '@/types/auth';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Search, 
  Mail, 
  Phone,
  Crown,
  Palette,
  PenTool,
  HardHat,
  Users,
  ClipboardCheck,
  User,
  Shield,
  AlertCircle
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const roleIcons: Record<UserRole, React.ReactNode> = {
  admin: <Crown className="w-4 h-4" />,
  design_head: <Palette className="w-4 h-4" />,
  designer: <PenTool className="w-4 h-4" />,
  execution_head: <HardHat className="w-4 h-4" />,
  execution_manager: <Users className="w-4 h-4" />,
  site_supervisor: <ClipboardCheck className="w-4 h-4" />,
  client: <User className="w-4 h-4" />,
};

const allRoles: UserRole[] = [
  'admin',
  'design_head',
  'designer',
  'execution_head',
  'execution_manager',
  'site_supervisor',
  'client'
];

const Team: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<UserRole | 'all'>('all');
  const { users, isLoading, assignRole } = useUsers();
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

  const roles: (UserRole | 'all')[] = ['all', ...allRoles.filter(r => r !== 'client')];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-muted-foreground">Loading team...</div>
      </div>
    );
  }

  const pendingUsers = users.filter(u => !u.role);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-semibold text-foreground">Team Management</h1>
          <p className="text-muted-foreground mt-1">Manage users and their roles</p>
        </div>
      </div>

      {/* Pending Role Assignments Alert */}
      {isAdmin && pendingUsers.length > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-foreground">Pending Role Assignments</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {pendingUsers.length} user(s) are waiting for role assignment. Assign roles below to grant them access.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {roles.map((role) => (
            <Button
              key={role}
              size="sm"
              variant={selectedRoleFilter === role ? 'default' : 'outline'}
              onClick={() => setSelectedRoleFilter(role)}
              className={selectedRoleFilter === role ? 'bg-gradient-warm' : ''}
            >
              {role === 'all' ? 'All' : roleLabels[role]}
            </Button>
          ))}
        </div>
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedMembers.map((member, index) => (
          <Card 
            key={member.id} 
            className={`glass-card animate-fade-in ${!member.role ? 'border-warning/50' : ''}`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className={`h-12 w-12 ${member.role ? 'bg-gradient-warm' : 'bg-muted'}`}>
                    <AvatarFallback className="bg-transparent text-primary-foreground font-medium">
                      {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-foreground">{member.name}</h3>
                    {member.role ? (
                      <Badge variant="outline" className="mt-1 text-xs gap-1">
                        {roleIcons[member.role]}
                        {roleLabels[member.role]}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="mt-1 text-xs gap-1 border-warning text-warning">
                        <Shield className="w-3 h-3" />
                        No Role Assigned
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{member.email}</span>
                </div>
                {member.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    {member.phone}
                  </div>
                )}
              </div>
              
              {/* Role Assignment (Admin Only) */}
              {isAdmin && (
                <div className="mt-4 pt-4 border-t border-border">
                  <label className="text-xs text-muted-foreground mb-2 block">
                    {member.role ? 'Change Role' : 'Assign Role'}
                  </label>
                  <Select
                    value={member.role || ''}
                    onValueChange={(value) => handleRoleAssign(member.id, value as UserRole)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a role..." />
                    </SelectTrigger>
                    <SelectContent>
                      {allRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                          <div className="flex items-center gap-2">
                            {roleIcons[role]}
                            {roleLabels[role]}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
    </div>
  );
};

export default Team;