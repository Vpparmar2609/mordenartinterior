import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Search, 
  Plus,
  Calendar,
  Users,
  Package,
  FileText,
  Image
} from 'lucide-react';

// Mock daily reports
const mockReports = [
  {
    id: '1',
    project: 'Kumar Residence',
    supervisor: 'Rajesh Nair',
    date: '2026-01-24',
    workDone: 'Completed TV unit installation. Started painting prep work in living room.',
    workersCount: 6,
    materialsReceived: 'Asian Paints - 20 liters, Primer - 5 liters',
    tomorrowPlan: 'Continue painting in living room and bedrooms',
    photoCount: 4,
  },
  {
    id: '2',
    project: 'Kumar Residence',
    supervisor: 'Rajesh Nair',
    date: '2026-01-23',
    workDone: 'Wardrobe shutters and handles installed. TV unit framing completed.',
    workersCount: 5,
    materialsReceived: 'Hardware fittings - hinges, handles',
    tomorrowPlan: 'TV unit installation and finish work',
    photoCount: 3,
  },
  {
    id: '3',
    project: 'Patel Apartment',
    supervisor: 'Deepak Verma',
    date: '2026-01-24',
    workDone: 'QC inspection in progress. Minor touch-ups identified.',
    workersCount: 3,
    materialsReceived: 'Touch-up paint supplies',
    tomorrowPlan: 'Complete QC items and final inspection',
    photoCount: 5,
  },
  {
    id: '4',
    project: 'Patel Apartment',
    supervisor: 'Deepak Verma',
    date: '2026-01-23',
    workDone: 'Final cleaning completed. Prepared checklist for QC.',
    workersCount: 4,
    materialsReceived: 'Cleaning supplies',
    tomorrowPlan: 'Start QC inspection',
    photoCount: 2,
  },
];

const DailyReports: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const filteredReports = mockReports.filter((report) => {
    const matchesSearch = report.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         report.supervisor.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         report.workDone.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = !dateFilter || report.date === dateFilter;
    return matchesSearch && matchesDate;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-semibold text-foreground">Daily Reports</h1>
          <p className="text-muted-foreground mt-1">Site supervisor daily updates and progress</p>
        </div>
        <Button className="bg-gradient-warm hover:opacity-90">
          <Plus className="w-4 h-4 mr-2" />
          New Report
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-auto"
        />
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.map((report, index) => (
          <Card 
            key={report.id} 
            className="glass-card animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 bg-gradient-warm">
                    <AvatarFallback className="bg-transparent text-primary-foreground text-sm">
                      {report.supervisor.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">{report.project}</CardTitle>
                    <p className="text-sm text-muted-foreground">{report.supervisor}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(report.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Badge>
                  {report.photoCount > 0 && (
                    <Badge variant="outline" className="gap-1">
                      <Image className="w-3 h-3" />
                      {report.photoCount}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-1">
                    <FileText className="w-4 h-4 text-primary" />
                    Work Done
                  </div>
                  <p className="text-sm text-muted-foreground pl-6">{report.workDone}</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-1">
                      <Users className="w-4 h-4 text-primary" />
                      Workers Present
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">{report.workersCount} workers</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-1">
                      <Package className="w-4 h-4 text-primary" />
                      Materials Received
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">{report.materialsReceived}</p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-1">
                    <Calendar className="w-4 h-4 text-primary" />
                    Tomorrow's Plan
                  </div>
                  <p className="text-sm text-muted-foreground pl-6">{report.tomorrowPlan}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredReports.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No reports found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default DailyReports;
