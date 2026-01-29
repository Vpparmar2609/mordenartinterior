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
  Image,
  Loader2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DailyReport {
  id: string;
  project_id: string;
  reported_by: string;
  report_date: string;
  work_done: string;
  workers_count: number;
  materials_received: string | null;
  next_plan: string | null;
  created_at: string;
  projects?: { client_name: string };
  profiles?: { name: string };
  photo_count?: number;
}

const DailyReports: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['daily_reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_reports')
        .select(`
          *,
          projects(client_name)
        `)
        .order('report_date', { ascending: false });

      if (error) throw error;

      // Get reporter names
      const reporterIds = [...new Set(data.map(r => r.reported_by))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', reporterIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.name]) || []);

      // Get photo counts per report
      const reportIds = data.map(r => r.id);
      const { data: photos } = await supabase
        .from('daily_report_photos')
        .select('report_id')
        .in('report_id', reportIds);

      const photoCountMap = new Map<string, number>();
      photos?.forEach(p => {
        photoCountMap.set(p.report_id, (photoCountMap.get(p.report_id) || 0) + 1);
      });

      return data.map(report => ({
        ...report,
        reporter_name: profileMap.get(report.reported_by) || 'Unknown',
        photo_count: photoCountMap.get(report.id) || 0,
      }));
    },
  });

  const filteredReports = reports.filter((report) => {
    const projectName = report.projects?.client_name || '';
    const matchesSearch = projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         report.reporter_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         report.work_done.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = !dateFilter || report.report_date === dateFilter;
    return matchesSearch && matchesDate;
  });

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
      {filteredReports.length === 0 ? (
        <div className="text-center py-12 glass-card rounded-xl">
          <p className="text-muted-foreground">No daily reports found.</p>
        </div>
      ) : (
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
                        {report.reporter_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{report.projects?.client_name || 'Unknown Project'}</CardTitle>
                      <p className="text-sm text-muted-foreground">{report.reporter_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(report.report_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Badge>
                    {report.photo_count > 0 && (
                      <Badge variant="outline" className="gap-1">
                        <Image className="w-3 h-3" />
                        {report.photo_count}
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
                    <p className="text-sm text-muted-foreground pl-6">{report.work_done}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-1">
                        <Users className="w-4 h-4 text-primary" />
                        Workers Present
                      </div>
                      <p className="text-sm text-muted-foreground pl-6">{report.workers_count} workers</p>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-1">
                        <Package className="w-4 h-4 text-primary" />
                        Materials Received
                      </div>
                      <p className="text-sm text-muted-foreground pl-6">{report.materials_received || 'None'}</p>
                    </div>
                  </div>

                  {report.next_plan && (
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-1">
                        <Calendar className="w-4 h-4 text-primary" />
                        Tomorrow's Plan
                      </div>
                      <p className="text-sm text-muted-foreground pl-6">{report.next_plan}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DailyReports;
