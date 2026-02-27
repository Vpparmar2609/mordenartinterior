import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useProjectPayments, stageLabels, PaymentStage } from '@/hooks/useProjectPayments';
import { useVendorPayments, vendorStageLabels, VendorPaymentStage } from '@/hooks/useVendorPayments';
import { useProjects } from '@/hooks/useProjects';
import { useNavigate } from 'react-router-dom';
import { 
  IndianRupee, TrendingUp, TrendingDown, FileText,
  ArrowRight, Loader2, FolderKanban, Users, Truck
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-success/20 text-success';
    case 'partial': return 'bg-warning/20 text-warning';
    default: return 'bg-muted text-muted-foreground';
  }
};

export const AccountantDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { payments, isLoading, totals } = useProjectPayments();
  const { payments: vendorPayments, isLoading: vendorLoading, totals: vendorTotals } = useVendorPayments();
  const { projects } = useProjects();

  if (isLoading || vendorLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const projectsWithPending = payments.filter(p => p.total_cost > 0 && p.total_pending > 0).slice(0, 5);
  const vendorProjectsWithPending = vendorPayments.filter(p => p.total_cost > 0 && p.total_pending > 0).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="glass-card animate-fade-in">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <FolderKanban className="w-4 h-4 text-primary" />
              <p className="text-xs text-muted-foreground">Projects</p>
            </div>
            <p className="text-xl font-bold text-foreground">{projects.length}</p>
          </CardContent>
        </Card>
        <Card className="glass-card animate-fade-in" style={{ animationDelay: '50ms' }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-success" />
              <p className="text-xs text-muted-foreground">Client Received</p>
            </div>
            <p className="text-xl font-bold text-success">{formatCurrency(totals.totalReceived)}</p>
          </CardContent>
        </Card>
        <Card className="glass-card animate-fade-in" style={{ animationDelay: '100ms' }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-warning" />
              <p className="text-xs text-muted-foreground">Client Pending</p>
            </div>
            <p className="text-xl font-bold text-warning">{formatCurrency(totals.totalPending)}</p>
          </CardContent>
        </Card>
        <Card className="glass-card animate-fade-in" style={{ animationDelay: '150ms' }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Truck className="w-4 h-4 text-primary" />
              <p className="text-xs text-muted-foreground">Vendor Paid</p>
            </div>
            <p className="text-xl font-bold text-primary">{formatCurrency(vendorTotals.totalPaid)}</p>
          </CardContent>
        </Card>
        <Card className="glass-card animate-fade-in" style={{ animationDelay: '200ms' }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Truck className="w-4 h-4 text-warning" />
              <p className="text-xs text-muted-foreground">Vendor Pending</p>
            </div>
            <p className="text-xl font-bold text-warning">{formatCurrency(vendorTotals.totalPending)}</p>
          </CardContent>
        </Card>
        <Card className="glass-card animate-fade-in" style={{ animationDelay: '250ms' }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-primary" />
              <p className="text-xs text-muted-foreground">Extra Work</p>
            </div>
            <p className="text-xl font-bold text-primary">{formatCurrency(totals.extraWorkTotal)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client Pending */}
        <Card className="glass-card animate-fade-in" style={{ animationDelay: '300ms' }}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />Client Pending
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/accounts')}>
              View All<ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {projectsWithPending.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No pending client payments</p>
            ) : (
              <div className="space-y-3">
                {projectsWithPending.map((project) => (
                  <div key={project.project_id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/60">
                    <div>
                      <p className="font-medium">{project.client_name}</p>
                      <p className="text-sm text-muted-foreground">Total: {formatCurrency(project.total_cost)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-warning">{formatCurrency(project.total_pending)}</p>
                      <p className="text-xs text-muted-foreground">pending</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vendor Pending */}
        <Card className="glass-card animate-fade-in" style={{ animationDelay: '350ms' }}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Truck className="w-5 h-5" />Vendor Pending
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/accounts')}>
              View All<ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {vendorProjectsWithPending.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No pending vendor payments</p>
            ) : (
              <div className="space-y-3">
                {vendorProjectsWithPending.map((project) => (
                  <div key={project.project_id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/60">
                    <div>
                      <p className="font-medium">{project.client_name}</p>
                      <p className="text-sm text-muted-foreground">Vendor: {formatCurrency(project.total_cost)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-warning">{formatCurrency(project.total_pending)}</p>
                      <p className="text-xs text-muted-foreground">pending</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center">
        <Button size="lg" onClick={() => navigate('/accounts')} className="bg-gradient-warm">
          <IndianRupee className="w-5 h-5 mr-2" />Go to Full Accounts View
        </Button>
      </div>
    </div>
  );
};
