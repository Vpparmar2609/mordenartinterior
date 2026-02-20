import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { useAuth } from '@/contexts/AuthContext';
import { useUsers } from '@/hooks/useUsers';
import { useProjects } from '@/hooks/useProjects';
import { useProjectTeam } from '@/hooks/useProjectTeam';
import { useWorkload } from '@/hooks/useWorkload';
import { roleLabels } from '@/types/auth';
import type { Database } from '@/integrations/supabase/types';
import { 
  Palette, 
  Users, 
  PenTool, 
  ClipboardCheck,
  UserPlus,
  X,
  Loader2,
  Briefcase,
  Edit2
} from 'lucide-react';

type AppRole = Database['public']['Enums']['app_role'];

interface TeamAssignmentSectionProps {
  projectId: string;
  designHeadId: string | null;
  executionManagerId: string | null;
  designHeadProfile?: { id: string; name: string; email: string } | null;
  executionManagerProfile?: { id: string; name: string; email: string } | null;
}

const roleIcons: Record<string, React.ReactNode> = {
  design_head: <Palette className="w-4 h-4" />,
  designer: <PenTool className="w-4 h-4" />,
  execution_manager: <Users className="w-4 h-4" />,
  site_supervisor: <ClipboardCheck className="w-4 h-4" />,
};

export const TeamAssignmentSection: React.FC<TeamAssignmentSectionProps> = ({
  projectId,
  designHeadId,
  executionManagerId,
  designHeadProfile,
  executionManagerProfile,
}) => {
  const { role: currentUserRole, user } = useAuth();
  const { users } = useUsers();
  const { updateProject } = useProjects();
  const { teamMembers, assignMember, removeMember, getMemberByRole, getMembersByRole, isLoading: teamLoading } = useProjectTeam(projectId);
  const { getWorkloadForUser } = useWorkload();
  
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [addingDesigner, setAddingDesigner] = useState(false);
  const [newDesignerId, setNewDesignerId] = useState<string>('');
  const [addingSupervisor, setAddingSupervisor] = useState(false);
  const [newSupervisorId, setNewSupervisorId] = useState<string>('');

  const handleAddSupervisor = async () => {
    if (!newSupervisorId) return;
    await assignMember.mutateAsync({ userId: newSupervisorId, role: 'site_supervisor' });
    setAddingSupervisor(false);
    setNewSupervisorId('');
  };

  const isAdmin = currentUserRole === 'admin';
  const isDesignHead = currentUserRole === 'design_head';
  const isExecutionManager = currentUserRole === 'execution_manager';

  // Get users by role for selection
  const getAvailableUsers = (role: AppRole) => {
    return users.filter(u => u.role === role);
  };

  // Handle head assignment (design_head_id or execution_manager_id on projects table)
  const handleHeadAssignment = async (headType: 'design_head_id' | 'execution_manager_id', userId: string | null) => {
    await updateProject.mutateAsync({
      id: projectId,
      [headType]: userId,
    });
    setEditingRole(null);
    setSelectedUserId('');
  };

  // Handle team member assignment (designer, site_supervisor on project_team table)
  const handleTeamAssignment = async (role: AppRole) => {
    if (!selectedUserId) return;
    await assignMember.mutateAsync({ userId: selectedUserId, role });
    setEditingRole(null);
    setSelectedUserId('');
  };

  // Handle adding a new designer
  const handleAddDesigner = async () => {
    if (!newDesignerId) return;
    await assignMember.mutateAsync({ userId: newDesignerId, role: 'designer' });
    setAddingDesigner(false);
    setNewDesignerId('');
  };

  // Handle team member removal
  const handleRemoveMember = async (userId: string, role: AppRole) => {
    await removeMember.mutateAsync({ userId, role });
  };

  const renderWorkloadBadge = (userId: string) => {
    const count = getWorkloadForUser(userId);
    return (
      <Badge variant="outline" className="ml-2 text-xs gap-1">
        <Briefcase className="w-3 h-3" />
        {count} projects
      </Badge>
    );
  };

  const renderHeadRow = (
    label: string,
    icon: React.ReactNode,
    headId: string | null,
    headProfile: { id: string; name: string; email: string } | null | undefined,
    headType: 'design_head_id' | 'execution_manager_id',
    availableRole: AppRole,
    canEdit: boolean
  ) => {
    const isEditing = editingRole === headType;
    const availableUsers = getAvailableUsers(availableRole);

    return (
      <div className="p-4 rounded-lg bg-muted/30 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-accent">{icon}</span>
            <span className="font-medium">{label}</span>
          </div>
          {canEdit && !isEditing && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setEditingRole(headType);
                setSelectedUserId(headId || '');
              }}
            >
              <Edit2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        {isEditing ? (
          <div className="flex items-center gap-2">
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={`Select ${label}...`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">
                  <span className="text-muted-foreground">Remove assignment</span>
                </SelectItem>
                {availableUsers.map(u => (
                  <SelectItem key={u.id} value={u.id}>
                    <div className="flex items-center gap-2">
                      <span>{u.name}</span>
                      {renderWorkloadBadge(u.id)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              size="sm" 
              onClick={() => handleHeadAssignment(headType, selectedUserId === '__none__' ? null : selectedUserId)}
              disabled={updateProject.isPending}
            >
              {updateProject.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => {
                setEditingRole(null);
                setSelectedUserId('');
              }}
            >
              Cancel
            </Button>
          </div>
        ) : headProfile ? (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 bg-gradient-warm">
              <AvatarFallback className="bg-transparent text-xs text-primary-foreground">
                {headProfile.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{headProfile.name}</p>
              <p className="text-xs text-muted-foreground">{headProfile.email}</p>
            </div>
            {renderWorkloadBadge(headProfile.id)}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Not assigned</p>
        )}
      </div>
    );
  };

  const renderTeamMemberRow = (
    label: string,
    icon: React.ReactNode,
    role: AppRole,
    canAssign: boolean,
    canRemove: boolean
  ) => {
    const member = getMemberByRole(role);
    const isEditing = editingRole === role;
    const availableUsers = getAvailableUsers(role);

    return (
      <div className="p-4 rounded-lg bg-muted/30 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-accent">{icon}</span>
            <span className="font-medium">{label}</span>
          </div>
          {canAssign && !isEditing && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setEditingRole(role);
                setSelectedUserId(member?.user_id || '');
              }}
            >
              {member ? <Edit2 className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            </Button>
          )}
        </div>

        {isEditing ? (
          <div className="flex items-center gap-2">
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={`Select ${label}...`} />
              </SelectTrigger>
              <SelectContent>
                {availableUsers.map(u => (
                  <SelectItem key={u.id} value={u.id}>
                    <div className="flex items-center gap-2">
                      <span>{u.name}</span>
                      {renderWorkloadBadge(u.id)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              size="sm" 
              onClick={() => handleTeamAssignment(role)}
              disabled={assignMember.isPending || !selectedUserId}
            >
              {assignMember.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Assign'}
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => {
                setEditingRole(null);
                setSelectedUserId('');
              }}
            >
              Cancel
            </Button>
          </div>
        ) : member ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 bg-gradient-warm">
                <AvatarFallback className="bg-transparent text-xs text-primary-foreground">
                  {member.profile?.name.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{member.profile?.name}</p>
                <p className="text-xs text-muted-foreground">{member.profile?.email}</p>
              </div>
              {renderWorkloadBadge(member.user_id)}
            </div>
            {canRemove && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                    <X className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove team member?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove {member.profile?.name} from this project. You can reassign them later.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleRemoveMember(member.user_id, role)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Remove
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Not assigned</p>
        )}
      </div>
    );
  };

  if (teamLoading) {
    return (
      <Card className="glass-card">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-lg font-display">Team Assignment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Design Head - Only admin can change */}
        {renderHeadRow(
          'Design Head',
          <Palette className="w-4 h-4" />,
          designHeadId,
          designHeadProfile,
          'design_head_id',
          'design_head',
          isAdmin
        )}

        {/* Designers - Multiple allowed, Design Head or Admin can assign */}
        {(() => {
          const assignedDesigners = getMembersByRole('designer');
          const availableDesigners = getAvailableUsers('designer');
          const assignedIds = assignedDesigners.map(d => d.user_id);
          const unassignedDesigners = availableDesigners.filter(u => !assignedIds.includes(u.id));
          const canManageDesigners = isAdmin || isDesignHead;

          return (
            <div className="p-4 rounded-lg bg-muted/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-accent"><PenTool className="w-4 h-4" /></span>
                  <span className="font-medium">Designers</span>
                  <Badge variant="secondary" className="text-xs">{assignedDesigners.length}</Badge>
                </div>
                {canManageDesigners && !addingDesigner && unassignedDesigners.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setAddingDesigner(true)}>
                    <UserPlus className="w-4 h-4 mr-1" />
                    Add Designer
                  </Button>
                )}
              </div>

              {/* List assigned designers */}
              {assignedDesigners.length === 0 ? (
                <p className="text-sm text-muted-foreground">No designers assigned</p>
              ) : (
                <div className="space-y-2">
                  {assignedDesigners.map(member => (
                    <div key={member.id} className="flex items-center justify-between pl-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-7 w-7 bg-gradient-warm">
                          <AvatarFallback className="bg-transparent text-xs text-primary-foreground">
                            {member.profile?.name.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{member.profile?.name}</p>
                          <p className="text-xs text-muted-foreground">{member.profile?.email}</p>
                        </div>
                        {renderWorkloadBadge(member.user_id)}
                      </div>
                      {canManageDesigners && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                              <X className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove designer?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove {member.profile?.name} from this project. You can reassign them later.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRemoveMember(member.user_id, 'designer')}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add designer form */}
              {addingDesigner && (
                <div className="flex items-center gap-2 pt-1">
                  <Select value={newDesignerId} onValueChange={setNewDesignerId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select designer to add..." />
                    </SelectTrigger>
                    <SelectContent>
                      {unassignedDesigners.map(u => (
                        <SelectItem key={u.id} value={u.id}>
                          <div className="flex items-center gap-2">
                            <span>{u.name}</span>
                            {renderWorkloadBadge(u.id)}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={handleAddDesigner} disabled={assignMember.isPending || !newDesignerId}>
                    {assignMember.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setAddingDesigner(false); setNewDesignerId(''); }}>
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          );
        })()}

        {/* Execution Manager - Only admin can change */}
        {renderHeadRow(
          'Execution Manager',
          <Users className="w-4 h-4" />,
          executionManagerId,
          executionManagerProfile,
          'execution_manager_id',
          'execution_manager',
          isAdmin
        )}

        {/* Site Supervisors - Multiple allowed, Execution Manager or Admin can assign */}
        {(() => {
          const assignedSupervisors = getMembersByRole('site_supervisor');
          const availableSupervisors = getAvailableUsers('site_supervisor');
          const assignedIds = assignedSupervisors.map(d => d.user_id);
          const unassignedSupervisors = availableSupervisors.filter(u => !assignedIds.includes(u.id));
          const canManageSupervisors = isAdmin || isExecutionManager;

          return (
            <div className="p-4 rounded-lg bg-muted/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-accent"><ClipboardCheck className="w-4 h-4" /></span>
                  <span className="font-medium">Site Supervisors</span>
                  <Badge variant="secondary" className="text-xs">{assignedSupervisors.length}</Badge>
                </div>
                {canManageSupervisors && !addingSupervisor && unassignedSupervisors.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setAddingSupervisor(true)}>
                    <UserPlus className="w-4 h-4 mr-1" />
                    Add Supervisor
                  </Button>
                )}
              </div>

              {assignedSupervisors.length === 0 ? (
                <p className="text-sm text-muted-foreground">No supervisors assigned</p>
              ) : (
                <div className="space-y-2">
                  {assignedSupervisors.map(member => (
                    <div key={member.id} className="flex items-center justify-between pl-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-7 w-7 bg-gradient-warm">
                          <AvatarFallback className="bg-transparent text-xs text-primary-foreground">
                            {member.profile?.name.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{member.profile?.name}</p>
                          <p className="text-xs text-muted-foreground">{member.profile?.email}</p>
                        </div>
                        {renderWorkloadBadge(member.user_id)}
                      </div>
                      {canManageSupervisors && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                              <X className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove supervisor?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove {member.profile?.name} from this project. You can reassign them later.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRemoveMember(member.user_id, 'site_supervisor')}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {addingSupervisor && (
                <div className="flex items-center gap-2 pt-1">
                  <Select value={newSupervisorId} onValueChange={setNewSupervisorId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select supervisor to add..." />
                    </SelectTrigger>
                    <SelectContent>
                      {unassignedSupervisors.map(u => (
                        <SelectItem key={u.id} value={u.id}>
                          <div className="flex items-center gap-2">
                            <span>{u.name}</span>
                            {renderWorkloadBadge(u.id)}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={handleAddSupervisor} disabled={assignMember.isPending || !newSupervisorId}>
                    {assignMember.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setAddingSupervisor(false); setNewSupervisorId(''); }}>
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          );
        })()}
      </CardContent>
    </Card>
  );
};
