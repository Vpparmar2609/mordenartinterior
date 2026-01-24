import { useAuth, UserRole } from '@/contexts/AuthContext';

export const useUserRole = () => {
  const { role, isLoading } = useAuth();

  const hasRole = (checkRole: UserRole): boolean => {
    return role === checkRole;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return role !== null && roles.includes(role);
  };

  const isAdmin = hasRole('admin');
  const isDesignHead = hasRole('design_head');
  const isDesigner = hasRole('designer');
  const isExecutionHead = hasRole('execution_head');
  const isExecutionManager = hasRole('execution_manager');
  const isSiteSupervisor = hasRole('site_supervisor');
  const isClient = hasRole('client');

  const canManageDesign = hasAnyRole(['admin', 'design_head']);
  const canManageExecution = hasAnyRole(['admin', 'execution_head']);
  const canCreateProjects = isAdmin;
  const canAssignTeam = hasAnyRole(['admin', 'design_head', 'execution_head']);
  const canViewAllProjects = isAdmin;
  const canApproveDesigns = hasAnyRole(['admin', 'design_head']);
  const canUploadDesigns = hasAnyRole(['admin', 'design_head', 'designer']);
  const canSubmitDailyReports = hasAnyRole(['admin', 'execution_head', 'execution_manager', 'site_supervisor']);
  const canReportIssues = hasAnyRole(['admin', 'execution_head', 'execution_manager', 'site_supervisor']);
  const canProvideFeedback = hasAnyRole(['admin', 'client']);

  return {
    role,
    isLoading,
    hasRole,
    hasAnyRole,
    isAdmin,
    isDesignHead,
    isDesigner,
    isExecutionHead,
    isExecutionManager,
    isSiteSupervisor,
    isClient,
    canManageDesign,
    canManageExecution,
    canCreateProjects,
    canAssignTeam,
    canViewAllProjects,
    canApproveDesigns,
    canUploadDesigns,
    canSubmitDailyReports,
    canReportIssues,
    canProvideFeedback,
  };
};
