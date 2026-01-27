
# Plan: Complete Project Assignment, File Uploads, Approvals & Notifications System

## Overview
This plan addresses multiple interconnected issues in the project management hierarchy and adds the requested features for file uploads, approvals workflow, and real-time notifications with workload tracking.

---

## Current Issues Identified

### 1. Design Head Cannot Assign Designers to Projects
- **Root cause**: The DesignHeadDashboard only shows the "Assign" button in the "Design Approval Queue" section, which only lists projects with status `design_approval_pending`
- **Problem**: New projects with status `lead` or `design_in_progress` don't appear in that queue, so heads cannot assign designers

### 2. Execution Head Cannot Assign Execution Managers
- **Root cause**: Same issue - the assignment UI is only available on the project list, but no dedicated assignment workflow exists

### 3. Designer Cannot Upload Files to Checklist Tasks
- **Root cause**: The DesignerDashboard and DesignTasks pages don't have file upload functionality connected to the `design_task_files` table

### 4. Approvals Page Uses Mock Data
- **Root cause**: The Approvals.tsx page uses hardcoded `mockApprovals` array instead of the real `approvals` database table

### 5. Issues Page Uses Mock Data  
- **Root cause**: The Issues.tsx page uses hardcoded `mockIssues` array instead of the real `issues` database table

---

## Implementation Plan

### Phase 1: Fix Project Assignment for Heads

#### 1.1 Update DesignHeadDashboard
- Add "My Projects" section with direct assignment capability for ALL assigned projects (not just pending approval)
- Show project status and allow assigning a designer to any project in design phase
- Add workload indicator next to each designer showing their current project count

#### 1.2 Update ExecutionHeadDashboard  
- Add similar direct assignment capability for ALL execution projects
- Allow assigning execution managers to any project where `execution_head_id` matches current user
- Add workload indicator for execution managers

#### 1.3 Create Workload Tracking Hook
- New hook: `src/hooks/useWorkload.ts`
- Queries `project_team` table grouped by user_id to count active projects per team member
- Returns data structure: `{ userId: string, projectCount: number }[]`

### Phase 2: Enable File Uploads for Designers

#### 2.1 Create Storage Bucket (Database Migration)
```text
Storage bucket: "design-files"
- Public: false (files accessible via signed URLs)
- RLS: Designers can upload, team can view
```

#### 2.2 Create File Upload Component
- New component: `src/components/tasks/TaskFileUpload.tsx`
- Allows selecting files (images, PDFs, 3D renders)
- Uploads to storage bucket and creates record in `design_task_files` table
- Shows upload progress and success/error states

#### 2.3 Update Design Task UI
- Add upload button to each task row in DesignTasks.tsx
- Add upload button to DesignerDashboard pending tasks
- Show existing uploaded files with download/preview links
- Add "Submit for Approval" button when task has files attached

### Phase 3: Approvals Workflow

#### 3.1 Create Approvals Hook
- New hook: `src/hooks/useApprovals.ts`
- Queries real `approvals` table with project details
- Provides mutations: `requestApproval`, `approveRequest`, `rejectRequest`

#### 3.2 Update Approvals Page
- Replace mock data with real database queries
- Wire up Approve/Reject buttons to actual database mutations
- Add project progress calculation based on completed tasks

#### 3.3 Add "Submit for Approval" Flow
- Designer clicks "Submit for Approval" on a task
- Creates record in `approvals` table with:
  - `project_id`, `approval_type: 'design_task'`
  - `requested_by: current_user_id`
  - `status: 'pending'`
- Design Head sees it in their Approvals queue

### Phase 4: Real-Time Notifications (In-App)

#### 4.1 Create Notifications Table (Database Migration)
```text
Table: notifications
Columns:
- id (uuid, primary key)
- user_id (uuid, FK to profiles) - recipient
- type (text) - 'project_assigned', 'issue_raised', 'approval_requested', 'approval_responded'
- title (text)
- message (text)
- link (text, nullable) - deep link to relevant page
- read (boolean, default false)
- created_at (timestamp)

RLS: Users can only read/update their own notifications
```

#### 4.2 Create Notification Triggers (Database Functions)
- Trigger on `project_team` INSERT -> notify assigned user
- Trigger on `issues` INSERT -> notify relevant heads
- Trigger on `approvals` INSERT -> notify target head
- Trigger on `approvals` UPDATE (when responded) -> notify requester

#### 4.3 Enable Realtime for Notifications
```text
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
```

#### 4.4 Create Notifications Hook & Components
- Hook: `src/hooks/useNotifications.ts`
  - Subscribes to realtime changes for current user
  - Provides `markAsRead`, `markAllAsRead` mutations
  - Returns unread count and notification list

- Component: `src/components/notifications/NotificationBell.tsx`
  - Bell icon in sidebar/header with unread badge
  - Dropdown showing recent notifications
  - Click to navigate and mark as read

- Component: `src/components/notifications/NotificationToast.tsx`
  - Toast popup for new notifications
  - Shows briefly then auto-dismisses

- Page: `src/pages/Notifications.tsx`
  - Full list of all notifications
  - Mark all as read button

### Phase 5: Execution Side Enhancements

#### 5.1 Enable Execution Photo Uploads
- Create storage bucket: "execution-photos"
- Add photo upload to execution tasks (both Execution Manager and Site Supervisor)
- Link photos to `execution_task_photos` table

#### 5.2 Wire Issues Page to Real Data
- Replace mock data with `useIssues` hook
- Add "Report Issue" form dialog with project selection
- Connect to real issue creation flow

#### 5.3 Update Issues Hook
- Already exists and works
- Just need to connect the UI

---

## File Changes Summary

### New Files
1. `src/hooks/useWorkload.ts` - Track project counts per team member
2. `src/hooks/useApprovals.ts` - Approvals CRUD operations
3. `src/hooks/useNotifications.ts` - Real-time notifications
4. `src/components/tasks/TaskFileUpload.tsx` - File upload component
5. `src/components/notifications/NotificationBell.tsx` - Bell icon with dropdown
6. `src/components/notifications/NotificationToast.tsx` - Toast for new notifications
7. `src/pages/Notifications.tsx` - Full notifications list page

### Modified Files
1. `src/components/dashboards/DesignHeadDashboard.tsx` - Add assignment to all projects + workload display
2. `src/components/dashboards/ExecutionHeadDashboard.tsx` - Add assignment to all projects + workload display
3. `src/components/dashboards/DesignerDashboard.tsx` - Add file upload capability + submit for approval
4. `src/pages/DesignTasks.tsx` - Add file upload per task + submit for approval
5. `src/pages/ExecutionTasks.tsx` - Add photo upload per task
6. `src/pages/Approvals.tsx` - Replace mock data with real queries
7. `src/pages/Issues.tsx` - Replace mock data with real queries + create dialog
8. `src/components/layout/Sidebar.tsx` - Add notification bell
9. `src/App.tsx` - Add notifications route

### Database Migrations
1. Create `notifications` table with RLS policies
2. Create notification trigger functions
3. Create storage buckets for design-files and execution-photos
4. Enable realtime on notifications table

---

## Technical Details

### Workload Tracking Query
```sql
SELECT user_id, COUNT(project_id) as active_projects
FROM project_team
WHERE role IN ('designer', 'execution_manager', 'site_supervisor')
GROUP BY user_id
```

### Notification Creation Pattern
When an assignment happens:
```typescript
await supabase.from('notifications').insert({
  user_id: assignedUserId,
  type: 'project_assigned',
  title: 'New Project Assigned',
  message: `You have been assigned to ${projectName}`,
  link: `/projects/${projectId}`,
});
```

### Realtime Subscription Pattern
```typescript
useEffect(() => {
  const channel = supabase
    .channel('notifications')
    .on('postgres_changes', 
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
      (payload) => {
        // Show toast and update notification list
      }
    )
    .subscribe();
  
  return () => { supabase.removeChannel(channel); };
}, [userId]);
```

---

## Visual Flow

### Designer Workflow
```text
1. Design Head assigns project to Designer
   -> Designer receives notification
2. Designer sees project in dashboard with 15-task checklist
3. Designer uploads files to each task
4. Designer marks task complete and clicks "Submit for Approval"
   -> Creates approval request
   -> Design Head receives notification
5. Design Head approves/rejects
   -> Designer receives notification with feedback
```

### Execution Workflow
```text
1. Execution Head assigns project to Execution Manager
   -> Manager receives notification
2. Manager assigns site supervisors
   -> Supervisors receive notifications
3. Both can upload photos and update checklist
4. Supervisor raises issues
   -> Manager receives notification
5. Manager/Head resolves issues
   -> Supervisor receives notification
```

---

## Expected Outcomes

After implementation:
- Design Head can see ALL their assigned projects and assign designers with workload visibility
- Execution Head can assign execution managers with workload visibility
- Execution Manager can assign site supervisors
- Designers can upload files to tasks and submit for approval
- Both Execution Manager and Site Supervisor can upload photos
- Approvals page shows real data with functional approve/reject
- Issues page shows real data with create issue capability
- All users receive real-time in-app notifications for:
  - Project assignments
  - Issue reports
  - Approval requests and responses
- Workload tracking helps heads distribute work fairly
