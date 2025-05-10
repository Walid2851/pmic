'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';

const editStudentSchema = z.object({
  rollno: z.number().min(1, 'Roll number is required'),
  firstname: z.string().min(1, 'First name is required'),
  lastname: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  workexperience: z.number().min(0, 'Work experience cannot be negative'),
  isactive: z.boolean(),
});

type Student = {
  studentid: number;
  rollno: number;
  batchid: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string | null;
  workexperience: number;
  isactive: boolean;
  createdat: string;
};
type EditStudentModalProps = {
  student: Student;
  onSuccess?: () => void;
};

export function EditStudentModal({ student, onSuccess }: EditStudentModalProps) {
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof editStudentSchema>>({
    resolver: zodResolver(editStudentSchema),
    defaultValues: {
      rollno: student.rollno,
      firstname: student.firstname,
      lastname: student.lastname,
      email: student.email,
      phone: student.phone || '',
      workexperience: student.workexperience,
      isactive: student.isactive,
    },
  });

  const onSubmit = async (values: z.infer<typeof editStudentSchema>) => {
    const supabase = createClient();

    const formattedValues = {
      ...values,
      rollno: Number(values.rollno),
      workexperience: Number(values.workexperience),
    };

    const supabasePromise = new Promise(async (resolve, reject) => {
      try {
        const { data, error } = await supabase
          .from('student')
          .update(formattedValues)
          .eq('studentid', student.studentid)
          .select();

        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      } catch (error) {
        reject('An unexpected error occurred');
      }
    });

    toast.promise(supabasePromise, {
      loading: 'Updating student...',
      success: () => {
        setOpen(false);
        onSuccess?.();
        return 'Student updated successfully!';
      },
      error: (error) => {
        console.log(error);
        return 'Failed to update student';
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Student Information</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="rollno"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Roll Number</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      onChange={e => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="workexperience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Work Experience (months)</FormLabel>
                  <FormControl>
                    <Input  
                      {...field} 
                      onChange={e => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isactive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Status</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button type="submit">Save Changes</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}