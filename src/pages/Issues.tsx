import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// Mock issues
const mockIssues = [
  {
    id: '1',
    project: 'Kumar Residence',
    type: 'Material Delay',
    description: 'Modular kitchen shutters delayed by vendor. Expected 3 days late.',
    severity: 'high',
    status: 'open',
    reportedBy: 'Rajesh Nair',
    reportedAt: '2026-01-23T10:30:00',
    assignedTo: 'Anjali Reddy',
  },
  {
    id: '2',
    project: 'Kumar Residence',
    type: 'Labour Shortage',
    description: 'Two painters did not report today. Need to arrange backup.',
    severity: 'medium',
    status: 'in_progress',
    reportedBy: 'Rajesh Nair',
    reportedAt: '2026-01-24T08:00:00',
    assignedTo: 'Vikram Singh',
  },
  {
    id: '3',
    project: 'Patel Apartment',
    type: 'Quality Rework',
    description: 'Minor paint touch-ups needed in bedroom 2. Some areas have uneven finish.',
    severity: 'low',
    status: 'in_progress',
    reportedBy: 'Deepak Verma',
    reportedAt: '2026-01-24T11:00:00',
    assignedTo: 'Deepak Verma',
  },
  {
    id: '4',
    project: 'Sharma Villa',
    type: 'Client Change Request',
    description: 'Client wants to change TV unit color from walnut to white oak.',
    severity: 'medium',
    status: 'open',
    reportedBy: 'Amit Kumar',
    reportedAt: '2026-01-22T14:30:00',
    assignedTo: null,
  },
  {
    id: '5',
    project: 'Kumar Residence',
    type: 'Vendor Issue',
    description: 'Electrician did not arrive for scheduled work.',
    severity: 'high',
    status: 'resolved',
    reportedBy: 'Rajesh Nair',
    reportedAt: '2026-01-20T09:00:00',
    assignedTo: 'Anjali Reddy',
    resolvedAt: '2026-01-20T16:00:00',
  },
];

const Issues: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const filteredIssues = mockIssues.filter((issue) => {
    const matchesSearch = issue.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         issue.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || issue.status === statusFilter;
    const matchesSeverity = severityFilter === 'all' || issue.severity === severityFilter;
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return <Badge className="bg-destructive/20 text-destructive border-0">High</Badge>;
      case 'medium':
        return <Badge className="bg-warning/20 text-warning border-0">Medium</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground border-0">Low</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="outline" className="gap-1 border-destructive/50 text-destructive"><AlertTriangle className="w-3 h-3" />Open</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="gap-1 border-warning/50 text-warning"><Clock className="w-3 h-3" />In Progress</Badge>;
      default:
        return <Badge variant="outline" className="gap-1 border-success/50 text-success"><CheckCircle2 className="w-3 h-3" />Resolved</Badge>;
    }
  };

  const openCount = mockIssues.filter(i => i.status === 'open').length;
  const inProgressCount = mockIssues.filter(i => i.status === 'in_progress').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-semibold text-foreground">Issues</h1>
          <p className="text-muted-foreground mt-1">
            {openCount} open, {inProgressCount} in progress
          </p>
        </div>
        <Button className="bg-gradient-warm hover:opacity-90">
          <Plus className="w-4 h-4 mr-2" />
          Report Issue
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search issues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Issues List */}
      <div className="space-y-4">
        {filteredIssues.map((issue, index) => (
          <Card 
            key={issue.id} 
            className={cn(
              "glass-card animate-fade-in",
              issue.status === 'open' && issue.severity === 'high' && 'border-destructive/30'
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-foreground">{issue.project}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-sm text-muted-foreground">{issue.type}</span>
                  </div>
                  <p className="text-sm text-foreground mb-3">{issue.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Reported by {issue.reportedBy}</span>
                    <span>•</span>
                    <span>{new Date(issue.reportedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    {issue.assignedTo && (
                      <>
                        <span>•</span>
                        <span>Assigned to {issue.assignedTo}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {getSeverityBadge(issue.severity)}
                  {getStatusBadge(issue.status)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredIssues.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No issues found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default Issues;
