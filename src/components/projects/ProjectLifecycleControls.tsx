import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useProjects } from '@/hooks/useProjects';
import { useNavigate } from 'react-router-dom';
import { Trash2, StopCircle, PlayCircle, Loader2 } from 'lucide-react';

interface ProjectLifecycleControlsProps {
  projectId: string;
  lifecycleStatus: string;
}

export const ProjectLifecycleControls: React.FC<ProjectLifecycleControlsProps> = ({
  projectId,
  lifecycleStatus,
}) => {
  const navigate = useNavigate();
  const { updateLifecycleStatus, deleteProject } = useProjects();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const isActive = lifecycleStatus === 'active';
  const isStopped = lifecycleStatus === 'stopped';

  const handleToggleLifecycle = () => {
    updateLifecycleStatus.mutate({
      id: projectId,
      lifecycle_status: isActive ? 'stopped' : 'active',
    });
  };

  const handleDelete = () => {
    deleteProject.mutate(projectId, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        navigate('/projects');
      },
    });
  };

  return (
    <div className="flex items-center gap-3">
      {/* Status Badge */}
      <Badge 
        variant="outline" 
        className={isActive 
          ? 'border-success text-success bg-success/10' 
          : 'border-warning text-warning bg-warning/10'
        }
      >
        {isActive ? 'Active' : 'Stopped'}
      </Badge>

      {/* Toggle Button */}
      <Button
        variant={isActive ? 'outline' : 'default'}
        size="sm"
        onClick={handleToggleLifecycle}
        disabled={updateLifecycleStatus.isPending}
        className={!isActive ? 'bg-success hover:bg-success/90' : ''}
      >
        {updateLifecycleStatus.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : isActive ? (
          <StopCircle className="w-4 h-4 mr-2" />
        ) : (
          <PlayCircle className="w-4 h-4 mr-2" />
        )}
        {isActive ? 'Stop' : 'Continue'}
      </Button>

      {/* Delete Button */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project
              and all associated tasks, files, and data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteProject.isPending}
            >
              {deleteProject.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
