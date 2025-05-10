'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, CalendarIcon } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { TimePicker } from '@/components/ui/time-picker';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

// Schema for the form
const addCourseSchema = z.object({
  courseId: z.string().min(1, 'Course is required'),
  batchId: z.string().min(1, 'Batch ID is required'),
  academicYear: z.string().min(1, 'Academic year is required'),
  academicPeriodId: z.string().min(1, 'Academic period is required'),
  dateRange: z.object({
    from: z.date({
      required_error: "Start date is required",
    }),
    to: z.date({
      required_error: "End date is required",
    }),
  }).refine(data => data.to >= data.from, {
    message: "End date must be after start date",
    path: ["to"],
  }),
  classDays: z.array(z.string()).min(1, 'At least one class day is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
}).refine(data => {
  // Convert times to comparable format
  const start = data.startTime.split(':').map(Number);
  const end = data.endTime.split(':').map(Number);
  
  // Compare hours first, then minutes if hours are equal
  if (start[0] < end[0] || (start[0] === end[0] && start[1] < end[1])) {
    return true;
  }
  return false;
}, {
  message: "End time must be after start time",
  path: ["endTime"],
});

// Course type
type Course = {
  "CourseID": number;
  "CourseCode": string;
  "CourseTitle": string;
  "Credits": number;
  "SemesterNo": number;
  "CourseType": string;
  "IsActive": boolean;
  "Description": string;
  "Prerequisites": string;
  "CreatedAt": string;
};

// Academic Period type
type AcademicPeriod = {
  "id": string;
  "name": string;
  "batch_id": string;
  "semester_number": number;
  "start_date": string;
  "end_date": string;
  "is_active": boolean;
};

type AddCourseModalProps = {
  batchId: string;
  academicPeriodId?: string;
  onSuccess?: () => void;
};

export function AddCourseModal({ batchId, academicPeriodId, onSuccess }: AddCourseModalProps) {
  const [open, setOpen] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const form = useForm<z.infer<typeof addCourseSchema>>({
    resolver: zodResolver(addCourseSchema),
    defaultValues: {
      courseId: '',
      batchId: batchId,
      academicYear: new Date().getFullYear().toString(),
      academicPeriodId: academicPeriodId || '',
      dateRange: {
        from: new Date(),
        to: addDays(new Date(), 90) // Default 3 months duration
      },
      classDays: [],
      startTime: '09:00',
      endTime: '11:00',
    },
  });

  // Update academicPeriodId when the prop changes
  useEffect(() => {
    if (academicPeriodId) {
      form.setValue('academicPeriodId', academicPeriodId);
    }
  }, [academicPeriodId, form]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        
        // Fetch courses
        const { data: coursesData, error: coursesError } = await supabase
          .from('course')
          .select('*')
          .eq('IsActive', true);
        
        if (coursesError) throw coursesError;
        setCourses(coursesData || []);
        
        // Fetch academic periods
        const { data: periodsData, error: periodsError } = await supabase
          .from('academic_period')
          .select('*')
          .eq('batch_id', batchId)
          .order('semester_number', { ascending: true });
        
        if (periodsError) throw periodsError;
        setAcademicPeriods(periodsData || []);
        
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchData();
    }
  }, [open, batchId]);

  const filteredCourses = courses.filter(course => 
    course.CourseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.CourseCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleDay = (day: string) => {
    const currentDays = form.getValues('classDays');
    if (currentDays.includes(day)) {
      form.setValue('classDays', currentDays.filter(d => d !== day));
    } else {
      form.setValue('classDays', [...currentDays, day]);
    }
  };

  const onSubmit = async (values: z.infer<typeof addCourseSchema>) => {
    const supabase = createClient();
    
    // Format dates for database
    const formattedStartDate = format(values.dateRange.from, 'yyyy-MM-dd');
    const formattedEndDate = format(values.dateRange.to, 'yyyy-MM-dd');

    const supabasePromise = new Promise(async (resolve, reject) => {
      try {
        // Start a transaction by using a single request with multiple operations
        
        // 1. Insert into batch_courses table
        const { data: batchCourseData, error: batchCourseError } = await supabase
          .from('batch_courses')
          .insert({
            batch_id: values.batchId,
            "CourseID": parseInt(values.courseId),
            academic_year: values.academicYear,
            start_date: formattedStartDate,
            end_date: formattedEndDate,
            academic_period_id: values.academicPeriodId
          })
          .select('id')
          .single();

        if (batchCourseError) throw batchCourseError;
        
        // 2. Insert schedule entries for each selected day with the same time
        const schedulePromises = values.classDays.map(async (day) => {
          const { error: scheduleError } = await supabase
            .from('batch_course_schedules')
            .insert({
              batch_course_id: batchCourseData.id,
              class_day: day,
              start_time: values.startTime,
              end_time: values.endTime
            });
          
          if (scheduleError) throw scheduleError;
        });
        
        // Wait for all schedule insertions to complete
        await Promise.all(schedulePromises);
        
        resolve({ success: true });
      } catch (error) {
        console.error('Error in transaction:', error);
        reject(error);
      }
    });

    toast.promise(supabasePromise, {
      loading: 'Adding course to batch...',
      success: () => {
        setOpen(false);
        form.reset();
        if (onSuccess) onSuccess();
        return 'Course added to batch successfully!';
      },
      error: (error) => {
        console.error(error);
        return 'Failed to add course to batch';
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Course
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Course to Batch</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="courseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="flex items-center px-3 pb-2">
                          <Input
                            placeholder="Search courses..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="border-0 bg-transparent"
                          />
                        </div>
                        {loading ? (
                          <div className="p-2 text-center">Loading courses...</div>
                        ) : filteredCourses.length > 0 ? (
                          filteredCourses.map((course) => (
                            <SelectItem key={course.CourseID} value={course.CourseID.toString()}>
                              {course.CourseCode} - {course.CourseTitle}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-center">No courses found</div>
                        )}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="academicPeriodId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Academic Period</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select academic period" />
                      </SelectTrigger>
                      <SelectContent>
                        {loading ? (
                          <div className="p-2 text-center">Loading periods...</div>
                        ) : academicPeriods.length > 0 ? (
                          academicPeriods.map((period) => (
                            <SelectItem key={period.id} value={period.id}>
                              {period.name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-center">No academic periods found</div>
                        )}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="academicYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Academic Year</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dateRange"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Course Duration</FormLabel>
                  <div className="w-full">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="date-range-picker"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value?.from ? (
                            field.value.to ? (
                              <>
                                {format(field.value.from, "LLL dd, yyyy")} -{" "}
                                {format(field.value.to, "LLL dd, yyyy")}
                              </>
                            ) : (
                              format(field.value.from, "LLL dd, yyyy")
                            )
                          ) : (
                            <span>Pick a date range</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          id="date-range-calendar"
                          mode="range"
                          defaultMonth={field.value?.from}
                          selected={field.value}
                          onSelect={(newDateRange) => {
                            console.log("Calendar selection:", newDateRange);
                            field.onChange(newDateRange);
                          }}
                          numberOfMonths={2}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="classDays"
              render={() => (
                <FormItem>
                  <FormLabel>Class Days</FormLabel>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {daysOfWeek.map((day) => {
                      const isSelected = form.getValues('classDays').includes(day);
                      return (
                        <Badge
                          key={day}
                          variant={isSelected ? "default" : "outline"}
                          className={cn(
                            "cursor-pointer",
                            isSelected && "bg-primary text-primary-foreground"
                          )}
                          onClick={() => toggleDay(day)}
                        >
                          {day.substring(0, 3)}
                        </Badge>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <TimePicker value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <TimePicker value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit">Add Course to Batch</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}