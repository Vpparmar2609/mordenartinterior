// Execution task stages with countdown logic

export interface ExecutionStage {
  id: string;
  name: string;
  orderRange: [number, number]; // inclusive range of order_index
  daysAllowed: number | null; // null means no timeline
  color: string;
}

export const EXECUTION_STAGES: ExecutionStage[] = [
  { id: 'client_meeting', name: 'Client Meeting', orderRange: [1, 3], daysAllowed: null, color: 'bg-slate-500' },
  { id: 'pop', name: 'POP Stage', orderRange: [4, 9], daysAllowed: 8, color: 'bg-blue-500' },
  { id: 'furniture', name: 'Furniture Stage', orderRange: [10, 17], daysAllowed: 25, color: 'bg-amber-500' },
  { id: 'laminate', name: 'Laminate Work', orderRange: [18, 22], daysAllowed: 30, color: 'bg-purple-500' },
  { id: 'colour', name: 'Colour Work', orderRange: [23, 28], daysAllowed: 15, color: 'bg-pink-500' },
  { id: 'other', name: 'Other Work', orderRange: [29, 35], daysAllowed: 12, color: 'bg-teal-500' },
];

export interface TaskWithProject {
  id: string;
  project_id: string;
  name: string;
  status: string;
  order_index: number;
  completed_date: string | null;
  updated_at: string;
  [key: string]: any;
}

export interface StageInfo {
  stage: ExecutionStage;
  tasks: TaskWithProject[];
  isCompleted: boolean;
  completedAt: Date | null;
  isActive: boolean;
  countdown: {
    daysLeft: number | null;
    startedAt: Date | null;
    isOverdue: boolean;
    status: 'no_timeline' | 'not_started' | 'in_progress' | 'completed' | 'overdue';
  };
}

// Get the stage for a given order_index
export function getStageForTask(orderIndex: number): ExecutionStage | null {
  return EXECUTION_STAGES.find(
    stage => orderIndex >= stage.orderRange[0] && orderIndex <= stage.orderRange[1]
  ) || null;
}

// Calculate stage information including countdown
export function calculateStageInfo(
  stage: ExecutionStage,
  allTasks: TaskWithProject[],
  previousStageInfo: StageInfo | null
): StageInfo {
  // Filter tasks belonging to this stage
  const stageTasks = allTasks.filter(
    task => task.order_index >= stage.orderRange[0] && task.order_index <= stage.orderRange[1]
  );

  // Check if all tasks in this stage are completed
  const isCompleted = stageTasks.length > 0 && stageTasks.every(t => t.status === 'completed');
  
  // Find when the stage was completed (latest completed_date of all tasks in stage)
  const completedAt = isCompleted 
    ? stageTasks.reduce((latest, task) => {
        if (!task.completed_date) return latest;
        const taskDate = new Date(task.completed_date);
        return !latest || taskDate > latest ? taskDate : latest;
      }, null as Date | null)
    : null;

  // Handle stages without timeline (Client Meeting)
  if (stage.daysAllowed === null) {
    return {
      stage,
      tasks: stageTasks,
      isCompleted,
      completedAt,
      isActive: !isCompleted, // Active until completed
      countdown: {
        daysLeft: null,
        startedAt: null,
        isOverdue: false,
        status: isCompleted ? 'completed' : 'no_timeline',
      },
    };
  }

  // Determine if this stage is active and calculate countdown
  let isActive = false;
  let startedAt: Date | null = null;
  let daysLeft = stage.daysAllowed;
  let status: 'no_timeline' | 'not_started' | 'in_progress' | 'completed' | 'overdue' = 'not_started';

  if (isCompleted) {
    status = 'completed';
    daysLeft = 0;
  } else if (previousStageInfo?.isCompleted && previousStageInfo.completedAt) {
    // Stage becomes active when previous stage is completed
    isActive = true;
    startedAt = previousStageInfo.completedAt;
    const daysPassed = Math.floor((Date.now() - startedAt.getTime()) / (1000 * 60 * 60 * 24));
    daysLeft = Math.max(0, stage.daysAllowed - daysPassed);
    status = daysLeft <= 0 ? 'overdue' : 'in_progress';
  }

  return {
    stage,
    tasks: stageTasks,
    isCompleted,
    completedAt,
    isActive,
    countdown: {
      daysLeft,
      startedAt,
      isOverdue: status === 'overdue',
      status,
    },
  };
}

// Get all stage info for a project's tasks
export function getProjectStagesInfo(tasks: TaskWithProject[]): StageInfo[] {
  const stagesInfo: StageInfo[] = [];
  
  for (let i = 0; i < EXECUTION_STAGES.length; i++) {
    const stage = EXECUTION_STAGES[i];
    const previousStageInfo = i > 0 ? stagesInfo[i - 1] : null;
    const stageInfo = calculateStageInfo(stage, tasks, previousStageInfo);
    stagesInfo.push(stageInfo);
  }
  
  return stagesInfo;
}
