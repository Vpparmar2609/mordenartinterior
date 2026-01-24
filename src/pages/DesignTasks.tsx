import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, 
  Upload, 
  CheckCircle2, 
  Clock,
  FileImage,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock projects with design tasks
const mockProjects = [
  {
    id: '1',
    clientName: 'Kumar Residence',
    progress: 80,
    tasks: [
      { id: 't1', name: 'Living Room 3D', status: 'completed', files: 3 },
      { id: 't2', name: 'Kitchen 3D', status: 'completed', files: 2 },
      { id: 't3', name: 'Bedroom 1 3D', status: 'completed', files: 2 },
      { id: 't4', name: 'Bedroom 2 3D', status: 'completed', files: 1 },
      { id: 't5', name: 'Master Bedroom 3D', status: 'completed', files: 2 },
      { id: 't6', name: 'TV Unit View', status: 'completed', files: 1 },
      { id: 't7', name: 'Wardrobe Elevation', status: 'completed', files: 2 },
      { id: 't8', name: 'Kitchen Layout 2D', status: 'completed', files: 1 },
      { id: 't9', name: 'Electrical Layout', status: 'completed', files: 1 },
      { id: 't10', name: 'False Ceiling Plan', status: 'completed', files: 1 },
      { id: 't11', name: 'Material Board', status: 'completed', files: 1 },
      { id: 't12', name: 'Color Palette', status: 'completed', files: 1 },
      { id: 't13', name: 'Furniture Plan', status: 'in_progress', files: 0 },
      { id: 't14', name: 'Partition Design', status: 'pending', files: 0 },
      { id: 't15', name: 'Final Render Set', status: 'pending', files: 0 },
    ],
  },
  {
    id: '2',
    clientName: 'Sharma Villa',
    progress: 53,
    tasks: [
      { id: 't1', name: 'Living Room 3D', status: 'completed', files: 2 },
      { id: 't2', name: 'Kitchen 3D', status: 'completed', files: 2 },
      { id: 't3', name: 'Bedroom 1 3D', status: 'completed', files: 1 },
      { id: 't4', name: 'Bedroom 2 3D', status: 'completed', files: 1 },
      { id: 't5', name: 'Master Bedroom 3D', status: 'completed', files: 2 },
      { id: 't6', name: 'TV Unit View', status: 'completed', files: 1 },
      { id: 't7', name: 'Wardrobe Elevation', status: 'completed', files: 1 },
      { id: 't8', name: 'Kitchen Layout 2D', status: 'completed', files: 1 },
      { id: 't9', name: 'Electrical Layout', status: 'in_progress', files: 0 },
      { id: 't10', name: 'False Ceiling Plan', status: 'pending', files: 0 },
      { id: 't11', name: 'Material Board', status: 'pending', files: 0 },
      { id: 't12', name: 'Color Palette', status: 'pending', files: 0 },
      { id: 't13', name: 'Furniture Plan', status: 'pending', files: 0 },
      { id: 't14', name: 'Partition Design', status: 'pending', files: 0 },
      { id: 't15', name: 'Final Render Set', status: 'pending', files: 0 },
    ],
  },
];

const DesignTasks: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProjects, setExpandedProjects] = useState<string[]>(['1']);

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-warning" />;
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success/20 text-success border-0">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-warning/20 text-warning border-0">In Progress</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground border-0">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-semibold text-foreground">Design Tasks</h1>
          <p className="text-muted-foreground mt-1">Track and manage design deliverables</p>
        </div>
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

      {/* Projects with Tasks */}
      <div className="space-y-4">
        {mockProjects.map((project, index) => (
          <Card 
            key={project.id} 
            className="glass-card animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardHeader 
              className="cursor-pointer"
              onClick={() => toggleProject(project.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {expandedProjects.includes(project.id) ? (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div>
                    <CardTitle className="text-lg">{project.clientName}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {project.tasks.filter(t => t.status === 'completed').length}/15 tasks completed
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-lg font-semibold text-primary">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="w-32" />
                </div>
              </div>
            </CardHeader>
            
            {expandedProjects.includes(project.id) && (
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {project.tasks.map((task, taskIndex) => (
                    <div 
                      key={task.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg",
                        task.status === 'completed' ? 'bg-success/5' : 
                        task.status === 'in_progress' ? 'bg-warning/5' : 'bg-muted/30'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(task.status)}
                        <span className={cn(
                          "font-medium",
                          task.status === 'completed' && 'text-muted-foreground line-through'
                        )}>
                          {taskIndex + 1}. {task.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {task.files > 0 && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <FileImage className="w-4 h-4" />
                            {task.files}
                          </div>
                        )}
                        {getStatusBadge(task.status)}
                        {task.status !== 'completed' && (
                          <Button size="sm" variant="outline" className="h-8">
                            <Upload className="w-3 h-3 mr-1" />
                            Upload
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DesignTasks;
