import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useProjectPayments, stageLabels, PaymentStage } from '@/hooks/useProjectPayments';
import { useNavigate } from 'react-router-dom';
import { 
  IndianRupee, 
  TrendingUp, 
  TrendingDown, 
  FileText,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-success/20 text-success';
    case 'partial':
      return 'bg-warning/20 text-warning';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export const AccountantDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { payments, isLoading, totals } = useProjectPayments();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Get projects with pending payments
  const projectsWithPending = payments
    .filter(p => p.total_cost > 0 && p.total_pending > 0)
    .slice(0, 5);

  // Get recent stages needing attention
  const pendingStages = payments
    .flatMap(p => p.stages.map(s => ({ ...s, client_name: p.client_name })))
    .filter(s => s.status !== 'completed')
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card animate-fade-in">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Received</p>
                <p className="text-2xl font-bold text-success mt-1">
                  {formatCurrency(totals.totalReceived)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-success/10">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card animate-fade-in" style={{ animationDelay: '50ms' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Pending</p>
                <p className="text-2xl font-bold text-warning mt-1">
                  {formatCurrency(totals.totalPending)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-warning/10">
                <TrendingDown className="w-6 h-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card animate-fade-in" style={{ animationDelay: '100ms' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Extra Work Total</p>
                <p className="text-2xl font-bold text-primary mt-1">
                  {formatCurrency(totals.extraWorkTotal)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-primary/10">
                <FileText className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects with Pending Payments */}
        <Card className="glass-card animate-fade-in" style={{ animationDelay: '150ms' }}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <IndianRupee className="w-5 h-5" />
              Pending Payments
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/accounts')}>
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {projectsWithPending.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No pending payments
              </p>
            ) : (
              <div className="space-y-3">
                {projectsWithPending.map((project) => (
                  <div
                    key={project.project_id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/60"
                  >
                    <div>
                      <p className="font-medium">{project.client_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Total: {formatCurrency(project.total_cost)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-warning">
                        {formatCurrency(project.total_pending)}
                      </p>
                      <p className="text-xs text-muted-foreground">pending</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stages Needing Attention */}
        <Card className="glass-card animate-fade-in" style={{ animationDelay: '200ms' }}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingDown className="w-5 h-5" />
              Stages Awaiting Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingStages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                All payments up to date
              </p>
            ) : (
              <div className="space-y-3">
                {pendingStages.map((stage) => (
                  <div
                    key={stage.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/60"
                  >
                    <div>
                      <p className="font-medium text-sm">{stage.client_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {stageLabels[stage.stage as PaymentStage]}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {formatCurrency(stage.required_amount - stage.paid_amount)}
                        </p>
                      </div>
                      <Badge className={`${getStatusColor(stage.status)} text-xs`}>
                        {stage.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Action */}
      <div className="flex justify-center">
        <Button 
          size="lg" 
          onClick={() => navigate('/accounts')}
          className="bg-gradient-warm"
        >
          <IndianRupee className="w-5 h-5 mr-2" />
          Go to Full Accounts View
        </Button>
      </div>
    </div>
  );
};
