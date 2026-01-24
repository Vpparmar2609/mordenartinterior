export type ProjectStatus = 
  | 'lead'
  | 'design_in_progress'
  | 'design_approval_pending'
  | 'design_approved'
  | 'execution_started'
  | 'work_in_progress'
  | 'finishing'
  | 'handover_pending'
  | 'snag_fix'
  | 'completed';

export interface Project {
  id: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  location: string;
  flatSize: string;
  bhk: string;
  budgetRange: string;
  startDate: Date;
  deadline: Date;
  designHeadId?: string;
  executionHeadId?: string;
  status: ProjectStatus;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
}

export const statusLabels: Record<ProjectStatus, string> = {
  lead: 'New Lead',
  design_in_progress: 'Design In Progress',
  design_approval_pending: 'Awaiting Design Approval',
  design_approved: 'Design Approved',
  execution_started: 'Execution Started',
  work_in_progress: 'Work In Progress',
  finishing: 'Finishing',
  handover_pending: 'Handover Pending',
  snag_fix: 'Snag Fix',
  completed: 'Completed',
};

export const statusColors: Record<ProjectStatus, { bg: string; text: string }> = {
  lead: { bg: 'bg-muted', text: 'text-muted-foreground' },
  design_in_progress: { bg: 'bg-accent/20', text: 'text-accent' },
  design_approval_pending: { bg: 'bg-warning/20', text: 'text-warning' },
  design_approved: { bg: 'bg-success/20', text: 'text-success' },
  execution_started: { bg: 'bg-primary/20', text: 'text-primary' },
  work_in_progress: { bg: 'bg-primary/30', text: 'text-primary' },
  finishing: { bg: 'bg-accent/30', text: 'text-accent' },
  handover_pending: { bg: 'bg-warning/30', text: 'text-warning' },
  snag_fix: { bg: 'bg-destructive/20', text: 'text-destructive' },
  completed: { bg: 'bg-success/30', text: 'text-success' },
};

export interface DesignTask {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  assignedTo?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'revision';
  files: string[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExecutionTask {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  assignedTo?: string;
  status: 'pending' | 'in_progress' | 'completed';
  expectedDate?: Date;
  completedDate?: Date;
  photos: string[];
  notes?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export const defaultDesignTasks = [
  'Living room 3D',
  'Kitchen 3D',
  'Bedroom 1 3D',
  'Bedroom 2 3D',
  'Master bedroom 3D',
  'TV unit view',
  'Wardrobe elevation',
  'Kitchen layout 2D',
  'Electrical layout plan',
  'False ceiling plan',
  'Material board',
  'Color palette',
  'Furniture plan',
  'Partition design',
  'Final walkthrough renders',
];

export const defaultExecutionTasks = [
  'POP/False ceiling start',
  'Electrical marking',
  'Wiring completed',
  'Plumbing points checked',
  'Modular kitchen base installed',
  'Kitchen shutters installed',
  'Wardrobe structure ready',
  'Wardrobe shutters + handles',
  'TV unit installation',
  'Painting started',
  'Paint completed',
  'Lights installation',
  'Cleaning + polish',
  'Final QC check',
  'Handover ready',
];
