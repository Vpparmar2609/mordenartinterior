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
  const isExecutionManager = hasRole('execution_manager');
  const isSiteSupervisor = hasRole('site_supervisor');
  const isAccountManager = hasRole('account_manager');

  const canManageDesign = hasAnyRole(['admin', 'design_head']);
  const canManageExecution = hasAnyRole(['admin', 'execution_manager']);
  const canCreateProjects = isAdmin;
  const canAssignTeam = hasAnyRole(['admin', 'design_head', 'execution_manager']);
  const canViewAllProjects = isAdmin;
  const canApproveDesigns = hasAnyRole(['admin', 'design_head']);
  const canApproveExecution = hasAnyRole(['admin', 'execution_manager']);
  const canUploadDesigns = hasAnyRole(['admin', 'design_head', 'designer']);
  const canSubmitDailyReports = hasAnyRole(['admin', 'execution_manager', 'site_supervisor']);
  const canReportIssues = hasAnyRole(['admin', 'execution_manager', 'site_supervisor']);
  const canViewAccounts = hasAnyRole(['admin', 'account_manager']);
  const canManagePayments = hasAnyRole(['admin', 'account_manager']);
  const canManageExtraWork = isAdmin;
  const canSetProjectCost = isAdmin;

  return {
    role,
    isLoading,
    hasRole,
    hasAnyRole,
    isAdmin,
    isDesignHead,
    isDesigner,
    isExecutionManager,
    isSiteSupervisor,
    isAccountManager,
    canManageDesign,
    canManageExecution,
    canCreateProjects,
    canAssignTeam,
    canViewAllProjects,
    canApproveDesigns,
    canApproveExecution,
    canUploadDesigns,
    canSubmitDailyReports,
    canReportIssues,
    canViewAccounts,
    canManagePayments,
    canManageExtraWork,
    canSetProjectCost,
  };
};
