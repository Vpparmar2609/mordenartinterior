import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Search,
  Loader2,
  Palette,
  HardHat,
  IndianRupee,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Zap,
  ListTodo,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCustomTasks, CustomTask } from '@/hooks/useCustomTasks';
import { useProjects } from '@/hooks/useProjects';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { CreateCustomTaskDialog } from '@/components/tasks/CreateCustomTaskDialog';
import { motion, AnimatePresence } from 'framer-motion';

const categoryConfig = {
  designing: { label: 'Designing', icon: Palette, color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/30' },
  execution: { label: 'Execution', icon: HardHat, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30' },
  account_manager: { label: 'Account Manager', icon: IndianRupee, color: 'text-success', bg: 'bg-success/10', border: 'border-success/30' },
};

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  pending: { label: 'Pending', icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted' },
  in_progress: { label: 'In Progress', icon: AlertCircle, color: 'text-warning', bg: 'bg-warning/20' },
  completed: { label: 'Completed', icon: CheckCircle2, color: 'text-success', bg: 'bg-success/20' },
};

const TaskBoard: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [activeCategory, setActiveCategory] = useState('all');

  const { tasks, isLoading, updateTask } = useCustomTasks();
  const { projects } = useProjects();
  const { users } = useUsers();
  const { role } = useAuth();
  const { isAdmin } = useUserRole();

  const canCreateTask = isAdmin || role === 'design_head' || role === 'execution_manager';

  // Resolve profiles from users list as fallback
  const getUserName = (userId: string, task: CustomTask) => {
    if (task.assigned_profile?.name) return task.assigned_profile.name;
    const user = users.find(u => u.id === userId);
    return user?.name || 'Unknown';
  };

  const getUserAvatar = (userId: string, task: CustomTask) => {
    if (task.assigned_profile?.avatar_url) return task.assigned_profile.avatar_url;
    return null;
  };

  const getProjectName = (projectId: string, task: CustomTask) => {
    if (task.project?.client_name) return task.project.client_name;
    const project = projects.find(p => p.id === projectId);
    return project?.client_name || 'Unknown';
  };

  // Filter tasks
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    if (selectedProject !== 'all') {
      result = result.filter(t => t.project_id === selectedProject);
    }

    if (activeCategory !== 'all') {
      result = result.filter(t => t.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        getUserName(t.assigned_to, t).toLowerCase().includes(q) ||
        getProjectName(t.project_id, t).toLowerCase().includes(q)
      );
    }

    // Sort: urgent first, then by due date, then by created_at
    result.sort((a, b) => {
      if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
      if (b.priority === 'urgent' && a.priority !== 'urgent') return 1;
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (b.status === 'completed' && a.status !== 'completed') return -1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return result;
  }, [tasks, selectedProject, activeCategory, searchQuery, users, projects]);

  // Stats
  const stats = useMemo(() => {
    const total = filteredTasks.length;
    const completed = filteredTasks.filter(t => t.status === 'completed').length;
    const urgent = filteredTasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length;
    const overdue = filteredTasks.filter(t => {
      if (!t.due_date || t.status === 'completed') return false;
      return new Date(t.due_date) < new Date();
    }).length;
    return { total, completed, urgent, overdue };
  }, [filteredTasks]);

  const handleStatusToggle = (task: CustomTask) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    updateTask.mutate({ id: task.id, status: newStatus });
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Task Board</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage & track assigned tasks across projects</p>
        </div>
        {canCreateTask && <CreateCustomTaskDialog />}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Tasks', value: stats.total, icon: ListTodo, color: 'text-primary' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-success' },
          { label: 'Urgent', value: stats.urgent, icon: Zap, color: 'text-destructive' },
          { label: 'Overdue', value: stats.overdue, icon: AlertCircle, color: 'text-warning' },
        ].map(stat => (
          <Card key={stat.label} className="glass-card">
            <CardContent className="p-3 sm:p-4 flex items-center gap-3">
              <div className={cn("p-2 rounded-lg bg-muted/50", stat.color)}>
                <stat.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-display font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks, people, projects..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="All Projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.client_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="text-xs sm:text-sm">All</TabsTrigger>
          <TabsTrigger value="designing" className="text-xs sm:text-sm gap-1">
            <Palette className="w-3.5 h-3.5 hidden sm:block" /> Designing
          </TabsTrigger>
          <TabsTrigger value="execution" className="text-xs sm:text-sm gap-1">
            <HardHat className="w-3.5 h-3.5 hidden sm:block" /> Execution
          </TabsTrigger>
          <TabsTrigger value="account_manager" className="text-xs sm:text-sm gap-1">
            <IndianRupee className="w-3.5 h-3.5 hidden sm:block" /> Accounts
          </TabsTrigger>
        </TabsList>

        {/* All tabs share the same content, filtered above */}
        {['all', 'designing', 'execution', 'account_manager'].map(tab => (
          <TabsContent key={tab} value={tab} className="mt-4">
            {filteredTasks.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <ListTodo className="w-12 h-12 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">No tasks found</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Create a new task to get started</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {filteredTasks.map((task, idx) => {
                    const cat = categoryConfig[task.category];
                    const st = statusConfig[task.status] || statusConfig.pending;
                    const isOverdue = task.due_date && task.status !== 'completed' && new Date(task.due_date) < new Date();
                    const name = getUserName(task.assigned_to, task);
                    const avatar = getUserAvatar(task.assigned_to, task);
                    const projectName = getProjectName(task.project_id, task);

                    return (
                      <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, delay: idx * 0.03 }}
                      >
                        <Card className={cn(
                          "glass-card transition-all duration-200 hover:shadow-md",
                          task.priority === 'urgent' && task.status !== 'completed' && 'border-destructive/40 shadow-destructive/10',
                          task.status === 'completed' && 'opacity-70'
                        )}>
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex items-start gap-3">
                              {/* Status toggle */}
                              <button
                                onClick={() => handleStatusToggle(task)}
                                className="mt-0.5 shrink-0 transition-transform active:scale-90"
                                disabled={updateTask.isPending}
                              >
                                {task.status === 'completed' ? (
                                  <CheckCircle2 className="w-5 h-5 text-success" />
                                ) : (
                                  <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 hover:border-primary transition-colors" />
                                )}
                              </button>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <h3 className={cn(
                                      "font-medium text-sm sm:text-base",
                                      task.status === 'completed' && 'line-through text-muted-foreground'
                                    )}>
                                      {task.title}
                                    </h3>
                                    {task.description && (
                                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{task.description}</p>
                                    )}
                                  </div>
                                  {task.priority === 'urgent' && task.status !== 'completed' && (
                                    <Badge className="bg-destructive/20 text-destructive border-0 shrink-0 gap-1 animate-pulse">
                                      <Zap className="w-3 h-3" />
                                      Urgent
                                    </Badge>
                                  )}
                                </div>

                                {/* Meta row */}
                                <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                                  {/* Project badge */}
                                  <Badge variant="outline" className="text-xs font-normal gap-1">
                                    {projectName}
                                  </Badge>

                                  {/* Category badge */}
                                  <Badge className={cn(cat.bg, cat.color, 'border-0 text-xs font-normal gap-1')}>
                                    <cat.icon className="w-3 h-3" />
                                    {cat.label}
                                  </Badge>

                                  {/* Due date */}
                                  {task.due_date && (
                                    <Badge className={cn(
                                      'border-0 text-xs font-normal gap-1',
                                      isOverdue ? 'bg-destructive/20 text-destructive' : 'bg-muted text-muted-foreground'
                                    )}>
                                      <Calendar className="w-3 h-3" />
                                      {new Date(task.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                      {isOverdue && ' (overdue)'}
                                    </Badge>
                                  )}

                                  {/* Status */}
                                  <Badge className={cn(st.bg, st.color, 'border-0 text-xs font-normal gap-1')}>
                                    <st.icon className="w-3 h-3" />
                                    {st.label}
                                  </Badge>
                                </div>
                              </div>

                              {/* Assigned person */}
                              <div className="flex flex-col items-center gap-1 shrink-0">
                                <Avatar className="w-8 h-8 border-2 border-background shadow-sm">
                                  {avatar && <AvatarImage src={avatar} alt={name} />}
                                  <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                                    {name.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-[10px] text-muted-foreground text-center max-w-[60px] truncate">{name}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default TaskBoard;
