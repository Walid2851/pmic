'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckedState } from '@radix-ui/react-checkbox';
import { DateRange } from 'react-day-picker';

// Define types for props and state
interface AcademicPeriodModalProps {
  batchId: string;
  onSuccess?: () => void;
}

interface FeeComponent {
  id: string;
  fee_type_id: string;
  name: string;
  description?: string;
  amount: number;
  is_optional: boolean;
  is_active: boolean;
}

interface FeeType {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  is_recurring: boolean;
  frequency?: string;
}

// Extended interface for fee types with calculated total amount
interface FeeTypeWithComponents extends FeeType {
  totalAmount: number;
  components: FeeComponent[];
}

interface FormData {
  semester_number: string;
  start_date: Date | undefined;
  end_date: Date | undefined;
  is_active: boolean;
}

export function AcademicPeriodModal({ batchId, onSuccess }: AcademicPeriodModalProps) {
  // Dialog state
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Form data state
  const [formData, setFormData] = useState<FormData>({
    semester_number: '',
    start_date: undefined,
    end_date: undefined,
    is_active: false
  });
  
  // Date range state
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });
  
  // Fee assignment state
  const [assignFees, setAssignFees] = useState<boolean>(false);
  const [feeTypes, setFeeTypes] = useState<FeeTypeWithComponents[]>([]);
  const [selectedFeeType, setSelectedFeeType] = useState<string>('');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);

  // Update form data when date range changes
  useEffect(() => {
    if (dateRange?.from) {
      setFormData(prev => ({
        ...prev,
        start_date: dateRange.from,
        end_date: dateRange.to
      }));
    }
  }, [dateRange]);

  // Fetch available fee types with their components
  useEffect(() => {
    const fetchFeeTypes = async () => {
      try {
        const supabase = createClient();
        
        // Fetch active fee types
        const { data: feeTypeData, error: feeTypeError } = await supabase
          .from('fee_type')
          .select('*')
          .eq('is_active', true);

        if (feeTypeError) {
          console.error('Error fetching fee types:', feeTypeError);
          return;
        }

        // For each fee type, get all their components to calculate total amounts
        const feeTypesWithComponents: FeeTypeWithComponents[] = await Promise.all((feeTypeData || []).map(async (feeType) => {
          const { data: components, error: componentsError } = await supabase
            .from('fee_component')
            .select('*')
            .eq('fee_type_id', feeType.id)
            .eq('is_active', true);
            
          if (componentsError) {
            console.error(`Error fetching components for fee type ${feeType.id}:`, componentsError);
            return {
              ...feeType,
              totalAmount: 0,
              components: []
            };
          }
          
          // Calculate the total amount from all required components
          const requiredComponents = (components || []).filter(comp => !comp.is_optional);
          const totalAmount = requiredComponents.reduce((sum, comp) => sum + (comp.amount || 0), 0);
          
          return {
            ...feeType,
            totalAmount,
            components: components || []
          };
        }));

        setFeeTypes(feeTypesWithComponents);
      } catch (error) {
        console.error('Error in fetchFeeTypes:', error);
      }
    };

    if (open) {
      fetchFeeTypes();
    }
  }, [open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.semester_number || !formData.start_date || !formData.end_date) {
      toast.error('Please fill all required fields');
      return;
    }
    
    setLoading(true);

    try {
      const supabase = createClient();

      // Format dates for submission as per SQL structure
      const formattedData = {
        batch_id: batchId,
        semester_number: parseInt(formData.semester_number),
        start_date: formData.start_date ? format(formData.start_date, 'yyyy-MM-dd') : null,
        end_date: formData.end_date ? format(formData.end_date, 'yyyy-MM-dd') : null,
        is_active: formData.is_active
      };

      // Insert academic period
      const { data: periodData, error: periodError } = await supabase
        .from('academic_period')
        .insert(formattedData)
        .select()
        .single();

      if (periodError) {
        throw periodError;
      }

      // If fee assignment is enabled, assign fees to all students
      if (assignFees && selectedFeeType && dueDate) {
        // Get all students in the batch
        const { data: students, error: studentsError } = await supabase
          .from('student')
          .select('studentid')
          .eq('batchid', batchId)
          .eq('isactive', true);

        if (studentsError) {
          throw studentsError;
        }

        // Get fee type details
        const { data: feeTypeData, error: feeTypeError } = await supabase
          .from('fee_type')
          .select('*')
          .eq('id', selectedFeeType)
          .single();

        if (feeTypeError) {
          throw feeTypeError;
        }

        // Get fee components for this fee type
        const { data: feeComponents, error: componentsError } = await supabase
          .from('fee_component')
          .select('*')
          .eq('fee_type_id', selectedFeeType)
          .eq('is_active', true);

        if (componentsError) {
          throw componentsError;
        }

        // Calculate total fee amount from all required components
        const requiredComponents = (feeComponents || []).filter(comp => !comp.is_optional);
        const totalAmount = requiredComponents.reduce((sum, comp) => sum + (comp.amount || 0), 0);

        // Create fee records for all students
        if (students && students.length > 0) {
          const studentFees = students.map(student => ({
            student_id: student.studentid,
            fee_type_id: selectedFeeType,
            academic_period_id: periodData.id,
            batch_id: batchId,
            description: `${(feeTypeData as FeeType).name} for ${periodData.name || 'Semester ' + formData.semester_number}`,
            total_amount: totalAmount,
            due_date: format(dueDate, 'yyyy-MM-dd'),
            status: 'PENDING' // Using uppercase to match the database constraint
          }));

          const { error: feesError } = await supabase
            .from('student_fee')
            .insert(studentFees);

          if (feesError) {
            throw feesError;
          }
        }
      }

      toast.success('Academic period created successfully');
      
      // Reset form
      setFormData({
        semester_number: '',
        start_date: undefined,
        end_date: undefined,
        is_active: false
      });
      setDateRange({
        from: undefined,
        to: undefined
      });
      setAssignFees(false);
      setSelectedFeeType('');
      setDueDate(undefined);
      
      // Close modal and refresh parent
      setOpen(false);
      if (onSuccess) onSuccess();

    } catch (error: any) {
      console.error('Error creating academic period:', error);
      toast.error(`Failed to create academic period: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <CalendarIcon className="mr-2 h-4 w-4" />
          New Academic Period
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Academic Period</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="semester_number">Semester Number</Label>
            <Input
              id="semester_number"
              name="semester_number"
              type="number"
              value={formData.semester_number}
              onChange={handleChange}
              placeholder="e.g. 1, 2, 3..."
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label>Period Date Range</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRange?.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Select period start and end dates</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={new Date()}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
            <Label htmlFor="is_active">Mark as active period</Label>
          </div>
          
          <div className="border-t pt-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="assignFees"
                checked={assignFees}
                onCheckedChange={(checked: CheckedState) => setAssignFees(checked === true)}
              />
              <Label htmlFor="assignFees">Assign fees to all students</Label>
            </div>
            
            {assignFees && (
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="feeType">Fee Type</Label>
                  <Select
                    value={selectedFeeType}
                    onValueChange={setSelectedFeeType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select fee type" />
                    </SelectTrigger>
                    <SelectContent>
                      {feeTypes.map((feeType) => (
                        <SelectItem key={feeType.id} value={feeType.id}>
                          {feeType.name} - ₹{feeType.totalAmount?.toFixed(2) || '0.00'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dueDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dueDate ? format(dueDate, 'PPP') : <span>Set due date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dueDate}
                        onSelect={setDueDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Period'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}