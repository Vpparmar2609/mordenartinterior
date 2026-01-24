import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { roleLabels, UserRole } from '@/types/auth';
import { 
  Plus, 
  Search, 
  Mail, 
  Phone,
  MoreVertical,
  Crown,
  Palette,
  PenTool,
  HardHat,
  Users,
  ClipboardCheck,
  User
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const roleIcons: Record<UserRole, React.ReactNode> = {
  admin: <Crown className="w-4 h-4" />,
  design_head: <Palette className="w-4 h-4" />,
  designer: <PenTool className="w-4 h-4" />,
  execution_head: <HardHat className="w-4 h-4" />,
  execution_manager: <Users className="w-4 h-4" />,
  site_supervisor: <ClipboardCheck className="w-4 h-4" />,
  client: <User className="w-4 h-4" />,
};

// Mock team members
const mockTeamMembers = [
  { id: '1', name: 'Rahul Sharma', email: 'rahul@modernart.com', phone: '+91 98765 43210', role: 'admin' as UserRole, projectCount: 0 },
  { id: '2', name: 'Priya Patel', email: 'priya@modernart.com', phone: '+91 87654 32109', role: 'design_head' as UserRole, projectCount: 8 },
  { id: '3', name: 'Amit Kumar', email: 'amit@modernart.com', phone: '+91 76543 21098', role: 'designer' as UserRole, projectCount: 4 },
  { id: '4', name: 'Sneha Gupta', email: 'sneha@modernart.com', phone: '+91 65432 10987', role: 'designer' as UserRole, projectCount: 3 },
  { id: '5', name: 'Vikram Singh', email: 'vikram@modernart.com', phone: '+91 54321 09876', role: 'execution_head' as UserRole, projectCount: 10 },
  { id: '6', name: 'Anjali Reddy', email: 'anjali@modernart.com', phone: '+91 43210 98765', role: 'execution_manager' as UserRole, projectCount: 4 },
  { id: '7', name: 'Rajesh Nair', email: 'rajesh@modernart.com', phone: '+91 32109 87654', role: 'site_supervisor' as UserRole, projectCount: 2 },
  { id: '8', name: 'Deepak Verma', email: 'deepak@modernart.com', phone: '+91 21098 76543', role: 'site_supervisor' as UserRole, projectCount: 2 },
];

const Team: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');

  const filteredMembers = mockTeamMembers.filter((member) => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'all' || member.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const roles: (UserRole | 'all')[] = ['all', 'admin', 'design_head', 'designer', 'execution_head', 'execution_manager', 'site_supervisor'];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-semibold text-foreground">Team Management</h1>
          <p className="text-muted-foreground mt-1">Manage users and their roles</p>
        </div>
        <Button className="bg-gradient-warm hover:opacity-90">
          <Plus className="w-4 h-4 mr-2" />
          Add Team Member
        </Button>
      </div>

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
              variant={selectedRole === role ? 'default' : 'outline'}
              onClick={() => setSelectedRole(role)}
              className={selectedRole === role ? 'bg-gradient-warm' : ''}
            >
              {role === 'all' ? 'All' : roleLabels[role]}
            </Button>
          ))}
        </div>
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map((member, index) => (
          <Card 
            key={member.id} 
            className="glass-card animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 bg-gradient-warm">
                    <AvatarFallback className="bg-transparent text-primary-foreground font-medium">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-foreground">{member.name}</h3>
                    <Badge variant="outline" className="mt-1 text-xs gap-1">
                      {roleIcons[member.role]}
                      {roleLabels[member.role]}
                    </Badge>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Profile</DropdownMenuItem>
                    <DropdownMenuItem>Edit</DropdownMenuItem>
                    <DropdownMenuItem>Assign Projects</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Deactivate</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  {member.email}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  {member.phone}
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Active Projects</span>
                <span className="font-medium text-foreground">{member.projectCount}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No team members found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default Team;
