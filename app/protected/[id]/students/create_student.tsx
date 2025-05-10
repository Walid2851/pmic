'use client';

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
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';

const studentSchema = z.object({
  studentid: z.number().min(1, 'Student ID is required'),
  rollno: z.number().min(1, 'Roll number is required'),
  firstname: z.string().min(1, 'First name is required'),
  lastname: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  workexperience: z.number().min(0, 'Work experience cannot be negative'),
});

type StudentFormProps = {
  batchId: string;
  onSuccess?: () => void;
};

export function AddStudentForm({ batchId, onSuccess }: StudentFormProps) {
  const form = useForm<z.infer<typeof studentSchema>>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      studentid: 0,
      rollno: 0,
      firstname: '',
      lastname: '',
      email: '',
      phone: '',
      workexperience: 0,
    },
  });

  const onSubmit = async (values: z.infer<typeof studentSchema>) => {
    const supabase = createClient();

    const supabasePromise = new Promise(async (resolve, reject) => {
      try {
        const { data, error } = await supabase
          .from('student')
          .insert([
            {
              studentid: values.studentid,
              rollno: values.rollno,
              firstname: values.firstname,
              lastname: values.lastname,
              email: values.email,
              phone: values.phone,
              workexperience: values.workexperience,
              batchid: batchId,
              isactive: true,
            },
          ])
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
      loading: 'Adding student...',
      success: () => {
        form.reset();
        onSuccess?.();
        return 'Student added successfully!';
      },
      error: (error) => {
        console.log(error);
        return 'Failed to add student';
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="studentid"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Student ID</FormLabel>
                <FormControl>
                  <Input 
                   
                    placeholder="Enter Student ID"
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
            name="rollno"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Roll Number</FormLabel>
                <FormControl>
                  <Input 
                    
                    placeholder="Enter Roll Number"
                    {...field} 
                    onChange={e => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstname"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter First Name" {...field} />
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
                  <Input placeholder="Enter Last Name" {...field} />
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
                <Input type="email" placeholder="Enter Email" {...field} />
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
                <Input placeholder="Enter Phone Number" {...field} />
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
                 
                  placeholder="Enter Work Experience"
                  {...field} 
                  onChange={e => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Add Student</Button>
      </form>
    </Form>
  );
}