import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useProjectPayments, stageLabels, PaymentStage } from '@/hooks/useProjectPayments';
import { useVendorPayments, vendorStageLabels, VendorPaymentStage } from '@/hooks/useVendorPayments';
import { useProjects } from '@/hooks/useProjects';
import { useNavigate } from 'react-router-dom';
import { MilestoneProgressBar } from '@/components/accounts/MilestoneProgressBar';
import { 
  IndianRupee, FileText, ArrowRight, Loader2,
  FolderKanban, Users, Truck, TrendingUp
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

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

  const margin = totals.totalReceived - vendorTotals.totalPaid;

  // Top projects needing attention (with pending payments)
  const clientProjectsWithCost = payments.filter(p => p.total_cost > 0).slice(0, 4);
  const vendorProjectsWithCost = vendorPayments.filter(p => p.total_cost > 0).slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Summary Cards - 2x3 grid on mobile, 6 cols on desktop */}
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
              <TrendingUp className="w-4 h-4 text-success" />
              <p className="text-xs text-muted-foreground">Margin</p>
            </div>
            <p className={`text-xl font-bold ${margin >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(margin)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Milestone Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client Milestone Progress */}
        <Card className="glass-card animate-fade-in" style={{ animationDelay: '300ms' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" /> Client Milestones
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/accounts')}>
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {clientProjectsWithCost.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No client budgets set yet</p>
            ) : (
              clientProjectsWithCost.map(project => (
                <div key={project.project_id} className="p-3 rounded-lg border border-border/50 bg-card/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm truncate">{project.client_name}</p>
                    <Badge variant="outline" className="text-xs shrink-0 ml-2">
                      {formatCurrency(project.total_paid)} / {formatCurrency(project.total_cost)}
                    </Badge>
                  </div>
                  <MilestoneProgressBar
                    compact
                    segments={project.stages.map(s => ({
                      label: stageLabels[s.stage as PaymentStage],
                      percentage: s.percentage,
                      status: s.status,
                      paid: s.paid_amount,
                      required: s.required_amount,
                    }))}
                    totalPaid={project.total_paid}
                    totalCost={project.total_cost}
                  />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Vendor Milestone Progress */}
        <Card className="glass-card animate-fade-in" style={{ animationDelay: '350ms' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Truck className="w-5 h-5" /> Vendor Milestones
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/accounts')}>
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {vendorProjectsWithCost.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No vendor budgets set yet</p>
            ) : (
              vendorProjectsWithCost.map(project => (
                <div key={project.project_id} className="p-3 rounded-lg border border-border/50 bg-card/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm truncate">{project.client_name}</p>
                    <Badge variant="outline" className="text-xs shrink-0 ml-2">
                      {formatCurrency(project.total_paid)} / {formatCurrency(project.total_cost)}
                    </Badge>
                  </div>
                  <MilestoneProgressBar
                    compact
                    segments={project.stages.map(s => ({
                      label: vendorStageLabels[s.stage as VendorPaymentStage],
                      percentage: s.percentage,
                      status: s.status as 'pending' | 'partial' | 'completed',
                      paid: s.paid_amount,
                      required: s.required_amount,
                    }))}
                    totalPaid={project.total_paid}
                    totalCost={project.total_cost}
                  />
                </div>
              ))
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
