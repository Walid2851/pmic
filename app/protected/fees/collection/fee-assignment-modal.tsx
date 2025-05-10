'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
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
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format, addMonths } from 'date-fns';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Student, FeeType, AcademicPeriod, Batch } from './types';

interface FeeAssignmentModalProps {
  student: Student;
  feeTypes: FeeType[];
  academicPeriods: AcademicPeriod[];
  batches: Batch[];
  onClose: () => void;
  onAssignmentComplete: () => void;
}

// Define form schema
const formSchema = z.object({
  feeTypeId: z.string({
    required_error: "Fee type is required",
  }),
  description: z.string().optional(),
  totalAmount: z.number({
    required_error: "Amount is required",
    invalid_type_error: "Amount must be a number",
  }).positive({
    message: "Amount must be greater than 0",
  }),
  dueDate: z.date({
    required_error: "Due date is required",
  }),
  academicPeriodId: z.string().optional(),
  batchId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const FeeAssignmentModal = ({
  student,
  feeTypes,
  academicPeriods,
  batches,
  onClose,
  onAssignmentComplete,
}: FeeAssignmentModalProps) => {
  const [loading, setLoading] = useState(false);
  const [selectedFeeType, setSelectedFeeType] = useState<FeeType | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
      totalAmount: 0,
      dueDate: addMonths(new Date(), 1),
      academicPeriodId: undefined,
      batchId: student.batchid || undefined,
    },
  });

  const handleFeeTypeChange = (feeTypeId: string) => {
    const feeType = feeTypes.find(ft => ft.id === feeTypeId);
    setSelectedFeeType(feeType || null);
    
    // Clear previous values and set new defaults
    form.setValue('feeTypeId', feeTypeId);
  };

  const onSubmit = async (values: FormValues) => {
    try {
      setLoading(true);
      const supabase = createClient();
      
      // Create a new fee record
      const { data, error } = await supabase
        .from('student_fee')
        .insert([
          {
            student_id: student.studentid,
            fee_type_id: values.feeTypeId,
            academic_period_id: values.academicPeriodId || null,
            batch_id: values.batchId || null,
            description: values.description || null,
            total_amount: values.totalAmount,
            due_date: format(values.dueDate, 'yyyy-MM-dd'),
            status: 'PENDING',
          }
        ])
        .select();
      
      if (error) throw error;
      
      // Handle success
      onAssignmentComplete();
    } catch (error) {
      console.error('Error assigning fee:', error);
      toast.error('Failed to assign fee', {
        description: 'There was an error assigning the fee. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[475px]">
        <DialogHeader>
          <DialogTitle>Assign Fee</DialogTitle>
          <DialogDescription>
            Assign a fee to {student.firstname} {student.lastname} (Roll No: {student.rollno})
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="feeTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fee Type</FormLabel>
                  <Select 
                    onValueChange={(value) => handleFeeTypeChange(value)} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a fee type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {feeTypes.map((feeType) => (
                        <SelectItem key={feeType.id} value={feeType.id}>
                          {feeType.name}
                          {feeType.is_recurring && ` (${feeType.frequency})`}
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
              name="totalAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (₹)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0.00"
                      min={0}
                      step={0.01}
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className="w-full pl-3 text-left font-normal"
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="academicPeriodId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Academic Period</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {academicPeriods.map((period) => (
                          <SelectItem key={period.id} value={period.id}>
                            {period.name}
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
                name="batchId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Batch</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select batch" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {batches.map((batch) => (
                          <SelectItem key={batch.id} value={batch.id}>
                            {batch.batch_id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add any additional details about this fee" 
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button variant="outline" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Assign Fee
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default FeeAssignmentModal;