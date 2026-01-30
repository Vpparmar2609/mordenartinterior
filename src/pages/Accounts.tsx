import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useProjectPayments, stageLabels, PaymentStage } from '@/hooks/useProjectPayments';
import { useUserRole } from '@/hooks/useUserRole';
import { 
  IndianRupee, 
  TrendingUp, 
  TrendingDown, 
  Search,
  ChevronDown,
  ChevronUp,
  Plus,
  FileText,
  Loader2
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { SetProjectCostDialog } from '@/components/accounts/SetProjectCostDialog';
import { RecordPaymentDialog } from '@/components/accounts/RecordPaymentDialog';
import { AddExtraWorkDialog } from '@/components/accounts/AddExtraWorkDialog';
import { RecordExtraWorkPaymentDialog } from '@/components/accounts/RecordExtraWorkPaymentDialog';

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

const Accounts: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [setCostDialogOpen, setSetCostDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState<{ id: string; projectId: string; stage: PaymentStage } | null>(null);
  const [extraWorkDialogOpen, setExtraWorkDialogOpen] = useState(false);
  const [extraWorkPaymentDialogOpen, setExtraWorkPaymentDialogOpen] = useState(false);
  const [selectedExtraWork, setSelectedExtraWork] = useState<{ id: string; projectId: string } | null>(null);
  
  const { payments, isLoading, totals } = useProjectPayments();
  const { isAdmin, canViewAccounts } = useUserRole();

  const filteredPayments = payments.filter(p => 
    p.client_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Only show projects that have a cost set
  const projectsWithCost = filteredPayments.filter(p => p.total_cost > 0);
  const projectsWithoutCost = filteredPayments.filter(p => p.total_cost === 0);

  if (!canViewAccounts) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">You don't have access to this page.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-semibold text-foreground">Accounts</h1>
        <p className="text-muted-foreground mt-1">Track project payments and financials</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card">
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

        <Card className="glass-card">
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

        <Card className="glass-card">
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

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Projects without cost (Admin only) */}
      {isAdmin && projectsWithoutCost.length > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-warning" />
              Projects Pending Cost Setup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {projectsWithoutCost.map(project => (
                <div 
                  key={project.project_id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/60"
                >
                  <span className="font-medium truncate">{project.client_name}</span>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedProjectId(project.project_id);
                      setSetCostDialogOpen(true);
                    }}
                  >
                    Set Cost
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Projects with Payment Tracking */}
      <div className="space-y-4">
        {projectsWithCost.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="p-8 text-center">
              <IndianRupee className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No projects with payment tracking yet.</p>
              {isAdmin && (
                <p className="text-sm text-muted-foreground mt-1">
                  Set project costs above to enable payment tracking.
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          projectsWithCost.map((project, index) => (
            <Collapsible
              key={project.project_id}
              open={expandedProject === project.project_id}
              onOpenChange={(open) => setExpandedProject(open ? project.project_id : null)}
            >
              <Card 
                className="glass-card animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors rounded-t-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <CardTitle className="text-lg">{project.client_name}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            Total: {formatCurrency(project.total_cost)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Paid</p>
                          <p className="font-semibold text-success">
                            {formatCurrency(project.total_paid)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Pending</p>
                          <p className="font-semibold text-warning">
                            {formatCurrency(project.total_pending)}
                          </p>
                        </div>
                        {expandedProject === project.project_id ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0">
                    {/* Admin: Update Cost Button */}
                    {isAdmin && (
                      <div className="flex justify-end mb-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedProjectId(project.project_id);
                            setSetCostDialogOpen(true);
                          }}
                        >
                          Update Project Cost
                        </Button>
                      </div>
                    )}

                    {/* Payment Stages */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-foreground">Payment Stages</h4>
                      <div className="grid gap-3">
                        {project.stages.map((stage) => (
                          <div
                            key={stage.id}
                            className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card/60"
                          >
                            <div className="flex items-center gap-4">
                              <div>
                                <p className="font-medium">{stageLabels[stage.stage as PaymentStage]}</p>
                                <p className="text-sm text-muted-foreground">
                                  {stage.percentage}% • Required: {formatCurrency(stage.required_amount)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-sm text-muted-foreground">Paid</p>
                                <p className="font-medium">{formatCurrency(stage.paid_amount)}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-muted-foreground">Balance</p>
                                <p className="font-medium">
                                  {formatCurrency(stage.required_amount - stage.paid_amount)}
                                </p>
                              </div>
                              <Badge className={getStatusColor(stage.status)}>
                                {stage.status.charAt(0).toUpperCase() + stage.status.slice(1)}
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedStage({
                                    id: stage.id,
                                    projectId: project.project_id,
                                    stage: stage.stage as PaymentStage,
                                  });
                                  setPaymentDialogOpen(true);
                                }}
                                disabled={stage.status === 'completed'}
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Payment
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Extra Work Section */}
                    <div className="mt-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-foreground">Extra Work</h4>
                        {isAdmin && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedProjectId(project.project_id);
                              setExtraWorkDialogOpen(true);
                            }}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Extra Work
                          </Button>
                        )}
                      </div>

                      {project.extra_works.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                          No extra work entries
                        </p>
                      ) : (
                        <div className="grid gap-3">
                          {project.extra_works.map((work) => (
                            <div
                              key={work.id}
                              className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card/60"
                            >
                              <div>
                                <p className="font-medium">{work.description}</p>
                                <p className="text-sm text-muted-foreground">
                                  Amount: {formatCurrency(work.amount)}
                                </p>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="text-sm text-muted-foreground">Paid</p>
                                  <p className="font-medium">{formatCurrency(work.paid_amount)}</p>
                                </div>
                                <Badge className={getStatusColor(work.status)}>
                                  {work.status.charAt(0).toUpperCase() + work.status.slice(1)}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedExtraWork({
                                      id: work.id,
                                      projectId: project.project_id,
                                    });
                                    setExtraWorkPaymentDialogOpen(true);
                                  }}
                                  disabled={work.status === 'completed'}
                                >
                                  <Plus className="w-4 h-4 mr-1" />
                                  Payment
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))
        )}
      </div>

      {/* Dialogs */}
      <SetProjectCostDialog
        open={setCostDialogOpen}
        onOpenChange={setSetCostDialogOpen}
        projectId={selectedProjectId}
        currentCost={payments.find(p => p.project_id === selectedProjectId)?.total_cost || 0}
      />

      <RecordPaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        stageId={selectedStage?.id || ''}
        projectId={selectedStage?.projectId || ''}
        stageName={selectedStage ? stageLabels[selectedStage.stage] : ''}
      />

      <AddExtraWorkDialog
        open={extraWorkDialogOpen}
        onOpenChange={setExtraWorkDialogOpen}
        projectId={selectedProjectId || ''}
      />

      <RecordExtraWorkPaymentDialog
        open={extraWorkPaymentDialogOpen}
        onOpenChange={setExtraWorkPaymentDialogOpen}
        extraWorkId={selectedExtraWork?.id || ''}
      />
    </div>
  );
};

export default Accounts;
