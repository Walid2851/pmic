'use client';

import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useState, useEffect, useRef } from 'react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';  // Make sure you have this utility

const studentSchema = z.object({
  studentid: z.number().min(1, 'Student ID is required'),
  rollno: z.number().min(1, 'Roll number is required'),
  firstname: z.string().min(1, 'First name is required'),
  lastname: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  workexperience: z.number().min(0, 'Work experience cannot be negative'),
  // Optional fee assignment fields
  assignFee: z.boolean().default(false),
  feeTypeId: z.string().optional(),
  feeAmount: z.number().optional(),
  feeDueDate: z.date().optional(),
});

type StudentFormProps = {
  batchId: string;
  academicPeriodId?: string;
  onSuccess?: () => void;
};

type FeeType = {
  id: string;
  name: string;
  description: string | null;
};

export function AddStudentForm({ batchId, academicPeriodId, onSuccess }: StudentFormProps) {
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
  const [loading, setLoading] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  
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
      assignFee: false,
      feeAmount: 0,
    },
  });

  const assignFee = form.watch('assignFee');
  const selectedFeeTypeId = form.watch('feeTypeId');

  // Ensure form content is visible on Firefox
  useEffect(() => {
    const handleResize = () => {
      if (formRef.current) {
        if (window.innerHeight < formRef.current.scrollHeight) {
          document.body.style.overflowY = 'auto';
        }
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Fetch fee types from database
  useEffect(() => {
    const fetchFeeTypes = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('fee_type')
        .select('id, name, description')
        .eq('is_active', true)
        .order('name');
        
      if (error) {
        console.error('Error fetching fee types:', error);
        toast.error('Failed to load fee types');
      } else {
        setFeeTypes(data || []);
      }
    };
    
    fetchFeeTypes();
  }, []);

  // Update fee amount when fee type changes
  useEffect(() => {
    if (selectedFeeTypeId && assignFee) {
      const fetchFeeAmount = async () => {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('fee_component')
          .select('amount')
          .eq('fee_type_id', selectedFeeTypeId)
          .eq('is_active', true);
          
        if (!error && data && data.length > 0) {
          // Sum all component amounts
          const totalAmount = data.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
          form.setValue('feeAmount', totalAmount);
        }
      };
      
      fetchFeeAmount();
    }
  }, [selectedFeeTypeId, assignFee, form]);

  const onSubmit = async (values: z.infer<typeof studentSchema>) => {
    setLoading(true);
    const supabase = createClient();

    try {
      // Begin transaction with student creation
      const { data: studentData, error: studentError } = await supabase
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

      if (studentError) throw studentError;

      // If fee assignment is checked, create fee record
      if (values.assignFee && values.feeTypeId && values.feeAmount && values.feeDueDate) {
        const { error: feeError } = await supabase
          .from('student_fee')
          .insert([
            {
              student_id: values.studentid,
              fee_type_id: values.feeTypeId,
              academic_period_id: academicPeriodId || null,
              batch_id: batchId,
              total_amount: values.feeAmount,
              due_date: values.feeDueDate.toISOString().split('T')[0],
              status: 'PENDING',
              description: `Initial fee assignment for ${values.firstname} ${values.lastname}`
            },
          ]);

        if (feeError) throw feeError;
      }

      // Success
      toast.success('Student added successfully!');
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to add student');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full overflow-auto pb-6">
      <Form {...form}>
        <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="studentid"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student ID</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter Student ID"
                      type="number"
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
                      type="number"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    type="number"
                    placeholder="Enter Work Experience"
                    {...field} 
                    onChange={e => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="border p-4 rounded-md mt-6 bg-gray-50 overflow-visible">
            <div className="flex items-center space-x-2 mb-4">
              <FormField
                control={form.control}
                name="assignFee"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="font-medium">Assign fee to student</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {assignFee && (
              <div className="space-y-4 p-3 border rounded-md bg-white">
                <FormField
                  control={form.control}
                  name="feeTypeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fee Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a fee type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent 
                          position="popper" 
                          className="w-full max-h-48 overflow-y-auto"
                          sideOffset={4}
                          align="start"
                        >
                          {feeTypes.map((feeType) => (
                            <SelectItem key={feeType.id} value={feeType.id}>
                              {feeType.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="feeAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fee Amount</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Fee Amount"
                          type="number"
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
                  name="feeDueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Due Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal flex justify-between items-center",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <span className="truncate">
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Select a date</span>
                                )}
                              </span>
                              <CalendarIcon className="h-4 w-4 opacity-50 flex-shrink-0" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent 
                          className="w-auto p-0 z-50" 
                          align="start" 
                          side="bottom"
                          sideOffset={4}
                          avoidCollisions={true}
                          onOpenAutoFocus={(e) => {
                            e.preventDefault(); // Prevent default focus behavior
                            requestAnimationFrame(() => {
                              if (calendarRef.current) {
                                const firstDay = calendarRef.current.querySelector('button:not([disabled])');
                                if (firstDay instanceof HTMLElement) {
                                  firstDay.focus();
                                }
                              }
                            });
                          }}
                        >
                          <div ref={calendarRef} className="w-full overflow-visible">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={(date) => {
                                field.onChange(date);
                                // Add a small delay before closing to ensure value is set
                                setTimeout(() => {
                                  document.body.click(); // Close the popover
                                }, 100);
                              }}
                              className="p-0"
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? 'Adding...' : 'Add Student'}
            </Button>
          </div> 
        </form>
      </Form>
    </div>
  );
}