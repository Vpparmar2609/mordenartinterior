import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProjects } from '@/hooks/useProjects';
import { useUsers } from '@/hooks/useUsers';
import { Loader2 } from 'lucide-react';

const projectSchema = z.object({
  client_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  client_phone: z.string().min(10, 'Phone must be at least 10 digits').max(15),
  client_email: z.string().email('Invalid email address'),
  location: z.string().min(3, 'Location must be at least 3 characters').max(200),
  flat_size: z.string().min(1, 'Flat size is required'),
  bhk: z.string().min(1, 'BHK is required'),
  budget: z.string().min(1, 'Budget is required'),
  start_date: z.string().min(1, 'Start date is required'),
  deadline: z.string().min(1, 'Deadline is required'),
  design_head_id: z.string().optional(),
  execution_manager_id: z.string().optional(),
  designer_id: z.string().optional(),
  site_supervisor_id: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateProjectDialog: React.FC<CreateProjectDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { createProject } = useProjects();
  const { getUsersByRole } = useUsers();
  
  const designHeads = getUsersByRole('design_head');
  const executionManagers = getUsersByRole('execution_manager');
  const designers = getUsersByRole('designer');
  const siteSupervisors = getUsersByRole('site_supervisor');

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      client_name: '',
      client_phone: '',
      client_email: '',
      location: '',
      flat_size: '',
      bhk: '',
      budget: '',
      start_date: new Date().toISOString().split('T')[0],
      deadline: '',
      design_head_id: undefined,
      execution_manager_id: undefined,
      designer_id: undefined,
      site_supervisor_id: undefined,
    },
  });

  const onSubmit = async (data: ProjectFormData) => {
    await createProject.mutateAsync({
      client_name: data.client_name,
      client_phone: data.client_phone,
      client_email: data.client_email,
      location: data.location,
      flat_size: data.flat_size,
      bhk: data.bhk,
      budget_range: data.budget, // Store as budget_range in DB
      start_date: data.start_date,
      deadline: data.deadline,
      design_head_id: data.design_head_id || null,
      execution_manager_id: data.execution_manager_id || null,
      designer_id: data.designer_id || null,
      site_supervisor_id: data.site_supervisor_id || null,
    });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Create New Project</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Client Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Client Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="client_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="client_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+91 98765 43210" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="client_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="client@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Property Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Property Details</h3>
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Koramangala, Bangalore" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="flat_size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Flat Size</FormLabel>
                      <FormControl>
                        <Input placeholder="1500 sq.ft" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bhk"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>BHK</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {['1', '2', '3', '4', '5'].map((bhk) => (
                            <SelectItem key={bhk} value={bhk}>{bhk} BHK</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget (₹)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="2500000" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Timeline</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="deadline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deadline</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Team Assignment */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Team Assignment (Optional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="design_head_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Design Head</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Design Head" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {designHeads.length === 0 ? (
                            <SelectItem value="none" disabled>No design heads available</SelectItem>
                          ) : (
                            designHeads.map((user) => (
                              <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="execution_manager_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Execution Manager</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Execution Manager" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {executionManagers.length === 0 ? (
                            <SelectItem value="none" disabled>No execution managers available</SelectItem>
                          ) : (
                            executionManagers.map((user) => (
                              <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="designer_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Designer</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Designer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {designers.length === 0 ? (
                            <SelectItem value="none" disabled>No designers available</SelectItem>
                          ) : (
                            designers.map((user) => (
                              <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="site_supervisor_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Site Supervisor</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Site Supervisor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {siteSupervisors.length === 0 ? (
                            <SelectItem value="none" disabled>No site supervisors available</SelectItem>
                          ) : (
                            siteSupervisors.map((user) => (
                              <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="hero" disabled={createProject.isPending}>
                {createProject.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Project
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};