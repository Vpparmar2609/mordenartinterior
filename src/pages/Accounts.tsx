import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProjectPayments, stageLabels, PaymentStage, PaymentStageData } from '@/hooks/useProjectPayments';
import { useVendorPayments, vendorStageLabels, VendorPaymentStage, VendorPaymentStageData } from '@/hooks/useVendorPayments';
import { useUserRole } from '@/hooks/useUserRole';
import { useProjects } from '@/hooks/useProjects';
import { Progress } from '@/components/ui/progress';
import { MilestoneProgressBar } from '@/components/accounts/MilestoneProgressBar';
import { 
  IndianRupee, Search, ChevronDown, ChevronUp, Plus, Loader2,
  History, CreditCard, Users, Truck
} from 'lucide-react';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { SetProjectCostDialog } from '@/components/accounts/SetProjectCostDialog';
import { RecordPaymentDialog } from '@/components/accounts/RecordPaymentDialog';
import { AddExtraWorkDialog } from '@/components/accounts/AddExtraWorkDialog';
import { RecordExtraWorkPaymentDialog } from '@/components/accounts/RecordExtraWorkPaymentDialog';
import { PaymentHistoryDialog } from '@/components/accounts/PaymentHistoryDialog';
import { ExtraWorkPaymentHistoryDialog } from '@/components/accounts/ExtraWorkPaymentHistoryDialog';
import { SetVendorCostDialog } from '@/components/accounts/SetVendorCostDialog';
import { RecordVendorPaymentDialog } from '@/components/accounts/RecordVendorPaymentDialog';
import { VendorPaymentHistoryDialog } from '@/components/accounts/VendorPaymentHistoryDialog';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-success/20 text-success';
    case 'partial': return 'bg-warning/20 text-warning';
    default: return 'bg-muted text-muted-foreground';
  }
};

const Accounts: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [expandedVendorProject, setExpandedVendorProject] = useState<string | null>(null);

  // Client payment dialogs
  const [setCostDialogOpen, setSetCostDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState<{ id: string; projectId: string; stage: PaymentStage } | null>(null);
  const [extraWorkDialogOpen, setExtraWorkDialogOpen] = useState(false);
  const [extraWorkPaymentDialogOpen, setExtraWorkPaymentDialogOpen] = useState(false);
  const [selectedExtraWork, setSelectedExtraWork] = useState<{ id: string; projectId: string; description: string } | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historyStage, setHistoryStage] = useState<{ id: string; stage: PaymentStage } | null>(null);
  const [extraWorkHistoryOpen, setExtraWorkHistoryOpen] = useState(false);
  const [historyExtraWork, setHistoryExtraWork] = useState<{ id: string; description: string } | null>(null);

  // Vendor payment dialogs
  const [vendorCostDialogOpen, setVendorCostDialogOpen] = useState(false);
  const [vendorSelectedProjectId, setVendorSelectedProjectId] = useState<string | null>(null);
  const [vendorPaymentDialogOpen, setVendorPaymentDialogOpen] = useState(false);
  const [vendorSelectedStage, setVendorSelectedStage] = useState<{ id: string; projectId: string; stage: VendorPaymentStage } | null>(null);
  const [vendorHistoryDialogOpen, setVendorHistoryDialogOpen] = useState(false);
  const [vendorHistoryStage, setVendorHistoryStage] = useState<{ id: string; stage: VendorPaymentStage } | null>(null);

  // Budget tab
  const [budgetProjectId, setBudgetProjectId] = useState<string>('');
  const [budgetType, setBudgetType] = useState<'client' | 'vendor'>('client');

  const { payments, isLoading, totals } = useProjectPayments();
  const { payments: vendorPayments, isLoading: vendorLoading, totals: vendorTotals } = useVendorPayments();
  const { isAdmin, canViewAccounts } = useUserRole();
  const { projects } = useProjects();

  const filteredPayments = payments.filter(p => p.client_name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredVendorPayments = vendorPayments.filter(p => p.client_name.toLowerCase().includes(searchQuery.toLowerCase()));

  const projectsWithCost = filteredPayments.filter(p => p.total_cost > 0);
  const projectsWithoutCost = filteredPayments.filter(p => p.total_cost === 0);
  const vendorProjectsWithCost = filteredVendorPayments.filter(p => p.total_cost > 0);

  const selectedBudgetProject = useMemo(() => {
    if (budgetType === 'client') return payments.find(p => p.project_id === budgetProjectId) || null;
    return vendorPayments.find(p => p.project_id === budgetProjectId) || null;
  }, [payments, vendorPayments, budgetProjectId, budgetType]);

  const calculateCarryForwardBalances = (stages: PaymentStageData[]) => {
    const stageOrder: PaymentStage[] = ['booking', 'pop_stage', 'plywood_stage', 'lamination_stage', 'paint_stage', 'fabric_stage'];
    let carryForward = 0;
    return stageOrder.map(stageName => {
      const stage = stages.find(s => s.stage === stageName);
      if (!stage) return null;
      const effectivePaid = stage.paid_amount + carryForward;
      const balance = stage.required_amount - effectivePaid;
      const excess = Math.max(0, effectivePaid - stage.required_amount);
      let effectiveStatus: 'pending' | 'partial' | 'completed' = 'pending';
      if (effectivePaid >= stage.required_amount) effectiveStatus = 'completed';
      else if (effectivePaid > 0) effectiveStatus = 'partial';
      carryForward = excess;
      return { ...stage, effectivePaid, effectiveBalance: Math.max(0, balance), effectiveStatus, hasCarryForward: stage.paid_amount < effectivePaid };
    }).filter(Boolean);
  };

  if (!canViewAccounts) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">You don't have access to this page.</p>
      </div>
    );
  }

  if (isLoading || vendorLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-semibold text-foreground">Accounts</h1>
          <p className="text-muted-foreground mt-1">Track client & vendor payments</p>
        </div>
      </div>


      <Tabs defaultValue="client" className="space-y-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="client" className="flex-1 sm:flex-none">
            <Users className="w-3 h-3 mr-1" />Client
          </TabsTrigger>
          <TabsTrigger value="vendor" className="flex-1 sm:flex-none">
            <Truck className="w-3 h-3 mr-1" />Vendor
          </TabsTrigger>
          <TabsTrigger value="budget" className="flex-1 sm:flex-none">
            <CreditCard className="w-3 h-3 mr-1" />Budget
          </TabsTrigger>
        </TabsList>

        {/* ─── Client Tab ─── */}
        <TabsContent value="client" className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search projects..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>

          {isAdmin && projectsWithoutCost.length > 0 && (
            <Card className="border-warning/50 bg-warning/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-warning" />Projects Pending Cost Setup
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {projectsWithoutCost.map(project => (
                    <div key={project.project_id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/60">
                      <span className="font-medium truncate mr-2">{project.client_name}</span>
                      <Button size="sm" onClick={() => { setSelectedProjectId(project.project_id); setSetCostDialogOpen(true); }}>Set Cost</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {projectsWithCost.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="p-8 text-center">
                  <IndianRupee className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No projects with client payment tracking yet.</p>
                </CardContent>
              </Card>
            ) : (
              projectsWithCost.map((project, index) => (
                <Collapsible key={project.project_id} open={expandedProject === project.project_id} onOpenChange={(open) => setExpandedProject(open ? project.project_id : null)}>
                  <Card className="glass-card animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors rounded-t-xl">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <CardTitle className="text-base sm:text-lg truncate">{project.client_name}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">Total: {formatCurrency(project.total_cost)}</p>
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
                              className="mt-2"
                            />
                          </div>
                          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Paid</p>
                              <p className="font-semibold text-success text-sm">{formatCurrency(project.total_paid)}</p>
                            </div>
                            <div className="text-right hidden sm:block">
                              <p className="text-xs text-muted-foreground">Pending</p>
                              <p className="font-semibold text-warning text-sm">{formatCurrency(project.total_pending)}</p>
                            </div>
                            {expandedProject === project.project_id ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        {isAdmin && (
                          <div className="flex justify-end mb-4">
                            <Button variant="outline" size="sm" onClick={() => { setSelectedProjectId(project.project_id); setSetCostDialogOpen(true); }}>Update Project Cost</Button>
                          </div>
                        )}
                        <div className="space-y-3">
                          <h4 className="font-medium text-foreground">Payment Stages</h4>
                          <div className="grid gap-3">
                            {calculateCarryForwardBalances(project.stages).map((stage) => {
                              if (!stage) return null;
                              return (
                                <div key={stage.id} className="flex flex-col gap-3 p-4 rounded-lg border border-border/50 bg-card/60">
                                  <div className="flex items-center justify-between gap-2">
                                    <div>
                                      <p className="font-medium text-sm">{stageLabels[stage.stage as PaymentStage]}</p>
                                      <p className="text-xs text-muted-foreground">{stage.percentage}% • Required: {formatCurrency(stage.required_amount)}</p>
                                    </div>
                                    <Badge className={getStatusColor(stage.effectiveStatus)}>{stage.effectiveStatus.charAt(0).toUpperCase() + stage.effectiveStatus.slice(1)}</Badge>
                                  </div>
                                  <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="p-2 rounded bg-muted/30">
                                      <p className="text-xs text-muted-foreground mb-0.5">Paid</p>
                                      <p className="font-medium">{formatCurrency(stage.effectivePaid)}{stage.hasCarryForward && <span className="text-xs text-success ml-1">(+carry)</span>}</p>
                                    </div>
                                    <div className="p-2 rounded bg-muted/30">
                                      <p className="text-xs text-muted-foreground mb-0.5">Balance</p>
                                      <p className="font-medium">
                                        {stage.effectiveBalance > 0 ? formatCurrency(stage.effectiveBalance) : stage.effectivePaid > stage.required_amount ? <span className="text-success">-{formatCurrency(stage.effectivePaid - stage.required_amount)}</span> : formatCurrency(0)}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 justify-end">
                                    <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => { setHistoryStage({ id: stage.id, stage: stage.stage as PaymentStage }); setHistoryDialogOpen(true); }}>
                                      <History className="w-3 h-3 mr-1" />History
                                    </Button>
                                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => { setSelectedStage({ id: stage.id, projectId: project.project_id, stage: stage.stage as PaymentStage }); setPaymentDialogOpen(true); }}>
                                      <Plus className="w-3 h-3 mr-1" />Add Payment
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        {/* Extra Work Section */}
                        <div className="mt-6 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-foreground">Extra Work</h4>
                            {isAdmin && (
                              <Button size="sm" variant="outline" onClick={() => { setSelectedProjectId(project.project_id); setExtraWorkDialogOpen(true); }}>
                                <Plus className="w-4 h-4 mr-1" />Add Extra Work
                              </Button>
                            )}
                          </div>
                          {project.extra_works.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4 text-center">No extra work entries</p>
                          ) : (
                            <div className="grid gap-3">
                              {project.extra_works.map((work) => (
                                <div key={work.id} className="flex flex-col gap-3 p-4 rounded-lg border border-border/50 bg-card/60">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <p className="font-medium text-sm">{work.description}</p>
                                      <p className="text-xs text-muted-foreground">Amount: {formatCurrency(work.amount)}</p>
                                    </div>
                                    <Badge className={getStatusColor(work.status)}>{work.status.charAt(0).toUpperCase() + work.status.slice(1)}</Badge>
                                  </div>
                                  <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="p-2 rounded bg-muted/30">
                                      <p className="text-xs text-muted-foreground mb-0.5">Paid</p>
                                      <p className="font-medium">{formatCurrency(work.paid_amount)}</p>
                                    </div>
                                    <div className="p-2 rounded bg-muted/30">
                                      <p className="text-xs text-muted-foreground mb-0.5">Balance</p>
                                      <p className="font-medium">{formatCurrency(work.amount - work.paid_amount)}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 justify-end">
                                    <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => { setHistoryExtraWork({ id: work.id, description: work.description }); setExtraWorkHistoryOpen(true); }}>
                                      <History className="w-3 h-3 mr-1" />History
                                    </Button>
                                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => { setSelectedExtraWork({ id: work.id, projectId: project.project_id, description: work.description }); setExtraWorkPaymentDialogOpen(true); }} disabled={work.status === 'completed'}>
                                      <Plus className="w-3 h-3 mr-1" />Add Payment
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
        </TabsContent>

        {/* ─── Vendor Tab ─── */}
        <TabsContent value="vendor" className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search projects..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>

          <div className="space-y-4">
            {vendorProjectsWithCost.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="p-8 text-center">
                  <Truck className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No projects with vendor payment tracking yet.</p>
                  {isAdmin && <p className="text-sm text-muted-foreground mt-1">Use the "Budget" tab to set vendor costs.</p>}
                </CardContent>
              </Card>
            ) : (
              vendorProjectsWithCost.map((project, index) => (
                <Collapsible key={project.project_id} open={expandedVendorProject === project.project_id} onOpenChange={(open) => setExpandedVendorProject(open ? project.project_id : null)}>
                  <Card className="glass-card animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors rounded-t-xl">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <CardTitle className="text-base sm:text-lg truncate">{project.client_name}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">Vendor Total: {formatCurrency(project.total_cost)}</p>
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
                              className="mt-2"
                            />
                          </div>
                          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Paid</p>
                              <p className="font-semibold text-primary text-sm">{formatCurrency(project.total_paid)}</p>
                            </div>
                            <div className="text-right hidden sm:block">
                              <p className="text-xs text-muted-foreground">Pending</p>
                              <p className="font-semibold text-warning text-sm">{formatCurrency(project.total_pending)}</p>
                            </div>
                            {expandedVendorProject === project.project_id ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        {isAdmin && (
                          <div className="flex justify-end mb-4">
                            <Button variant="outline" size="sm" onClick={() => { setVendorSelectedProjectId(project.project_id); setVendorCostDialogOpen(true); }}>Update Vendor Cost</Button>
                          </div>
                        )}
                        <div className="space-y-3">
                          <h4 className="font-medium text-foreground">Vendor Milestones</h4>
                          <div className="grid gap-3">
                            {project.stages.map((stage) => (
                              <div key={stage.id} className="flex flex-col gap-3 p-4 rounded-lg border border-border/50 bg-card/60">
                                <div className="flex items-center justify-between gap-2">
                                  <div>
                                    <p className="font-medium text-sm">{vendorStageLabels[stage.stage as VendorPaymentStage]}</p>
                                    <p className="text-xs text-muted-foreground">{stage.percentage}% • Required: {formatCurrency(stage.required_amount)}</p>
                                  </div>
                                  <Badge className={getStatusColor(stage.status)}>{stage.status.charAt(0).toUpperCase() + stage.status.slice(1)}</Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  <div className="p-2 rounded bg-muted/30">
                                    <p className="text-xs text-muted-foreground mb-0.5">Paid</p>
                                    <p className="font-medium">{formatCurrency(stage.paid_amount)}</p>
                                  </div>
                                  <div className="p-2 rounded bg-muted/30">
                                    <p className="text-xs text-muted-foreground mb-0.5">Balance</p>
                                    <p className="font-medium">{formatCurrency(Math.max(0, stage.required_amount - stage.paid_amount))}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 justify-end">
                                  <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => { setVendorHistoryStage({ id: stage.id, stage: stage.stage as VendorPaymentStage }); setVendorHistoryDialogOpen(true); }}>
                                    <History className="w-3 h-3 mr-1" />History
                                  </Button>
                                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => { setVendorSelectedStage({ id: stage.id, projectId: project.project_id, stage: stage.stage as VendorPaymentStage }); setVendorPaymentDialogOpen(true); }}>
                                    <Plus className="w-3 h-3 mr-1" />Add Payment
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              ))
            )}
          </div>
        </TabsContent>

        {/* ─── Budget Tab ─── */}
        <TabsContent value="budget" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-primary" />
                Project Budget Setup
              </CardTitle>
              <p className="text-sm text-muted-foreground">Set client or vendor cost for a project.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Budget Type</label>
                  <Select value={budgetType} onValueChange={(v) => setBudgetType(v as 'client' | 'vendor')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">Client Budget</SelectItem>
                      <SelectItem value="vendor">Vendor Budget</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Project</label>
                  <Select value={budgetProjectId} onValueChange={setBudgetProjectId}>
                    <SelectTrigger><SelectValue placeholder="Choose a project..." /></SelectTrigger>
                    <SelectContent>
                      {payments.map(p => (
                        <SelectItem key={p.project_id} value={p.project_id}>
                          {p.client_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {budgetProjectId && selectedBudgetProject && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-lg bg-muted/30 border border-border/50 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Total {budgetType === 'client' ? 'Client' : 'Vendor'} Budget</p>
                      <p className="text-lg font-bold text-foreground">
                        {selectedBudgetProject.total_cost > 0 ? formatCurrency(selectedBudgetProject.total_cost) : '—'}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-success/10 border border-success/20 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Total Paid</p>
                      <p className="text-lg font-bold text-success">{formatCurrency(selectedBudgetProject.total_paid)}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-warning/10 border border-warning/20 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Pending</p>
                      <p className="text-lg font-bold text-warning">{formatCurrency(selectedBudgetProject.total_pending)}</p>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <Button className="bg-gradient-warm hover:opacity-90" onClick={() => {
                      if (budgetType === 'client') {
                        setSelectedProjectId(budgetProjectId);
                        setSetCostDialogOpen(true);
                      } else {
                        setVendorSelectedProjectId(budgetProjectId);
                        setVendorCostDialogOpen(true);
                      }
                    }}>
                      <IndianRupee className="w-4 h-4 mr-2" />
                      {selectedBudgetProject.total_cost > 0 ? 'Update Cost' : 'Set Cost'}
                    </Button>
                  </div>
                </div>
              )}

              {!budgetProjectId && (
                <div className="text-center py-8 text-muted-foreground">
                  <IndianRupee className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Select a project above to view or set its budget</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Client Dialogs */}
      <SetProjectCostDialog open={setCostDialogOpen} onOpenChange={setSetCostDialogOpen} projectId={selectedProjectId} currentCost={payments.find(p => p.project_id === selectedProjectId)?.total_cost || 0} />
      <RecordPaymentDialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen} stageId={selectedStage?.id || ''} projectId={selectedStage?.projectId || ''} stageName={selectedStage ? stageLabels[selectedStage.stage] : ''} />
      <AddExtraWorkDialog open={extraWorkDialogOpen} onOpenChange={setExtraWorkDialogOpen} projectId={selectedProjectId || ''} />
      <RecordExtraWorkPaymentDialog open={extraWorkPaymentDialogOpen} onOpenChange={setExtraWorkPaymentDialogOpen} extraWorkId={selectedExtraWork?.id || ''} projectId={selectedExtraWork?.projectId || ''} />
      <PaymentHistoryDialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen} stageId={historyStage?.id || ''} stageName={historyStage ? stageLabels[historyStage.stage] : ''} />
      <ExtraWorkPaymentHistoryDialog open={extraWorkHistoryOpen} onOpenChange={setExtraWorkHistoryOpen} extraWorkId={historyExtraWork?.id || ''} description={historyExtraWork?.description || ''} />

      {/* Vendor Dialogs */}
      <SetVendorCostDialog open={vendorCostDialogOpen} onOpenChange={setVendorCostDialogOpen} projectId={vendorSelectedProjectId} currentCost={vendorPayments.find(p => p.project_id === vendorSelectedProjectId)?.total_cost || 0} />
      <RecordVendorPaymentDialog open={vendorPaymentDialogOpen} onOpenChange={setVendorPaymentDialogOpen} stageId={vendorSelectedStage?.id || ''} projectId={vendorSelectedStage?.projectId || ''} stageName={vendorSelectedStage ? vendorStageLabels[vendorSelectedStage.stage] : ''} />
      <VendorPaymentHistoryDialog open={vendorHistoryDialogOpen} onOpenChange={setVendorHistoryDialogOpen} stageId={vendorHistoryStage?.id || ''} stageName={vendorHistoryStage ? vendorStageLabels[vendorHistoryStage.stage] : ''} />
    </div>
  );
};

export default Accounts;
