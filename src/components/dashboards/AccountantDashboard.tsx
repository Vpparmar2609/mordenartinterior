import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useProjects } from '@/hooks/useProjects';
import { useNavigate } from 'react-router-dom';
import { 
  IndianRupee, FolderKanban, Loader2
} from 'lucide-react';
import { ProjectList } from '@/components/projects/ProjectList';

export const AccountantDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { projects, isLoading } = useProjects();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Button size="lg" onClick={() => navigate('/accounts')} className="bg-gradient-warm">
          <IndianRupee className="w-5 h-5 mr-2" />
          Go to Accounts
        </Button>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-primary" />
            Projects
          </CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">No projects available</p>
          ) : (
            <ProjectList projects={projects.slice(0, 8)} compact />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
