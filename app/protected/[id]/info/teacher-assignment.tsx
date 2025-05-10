'use client';
import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, Calendar as CalendarIcon, Info, Users, Clock, Book, ChevronRight, GraduationCap } from 'lucide-react';
import { format, parseISO, isAfter, isBefore, isToday, addDays, isWithinInterval, isSameDay } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Define the types needed for the component
interface Teacher {
  InstructorID: string;
  FirstName: string;
  LastName: string;
  Department: string;
}

interface ScheduleClass {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
}

interface Course {
  batchCourseId: string;
  courseName: string;
  courseCode: string;
  status: string;
  startDate: string;
  endDate: string;
  schedule: ScheduleClass[];
}

// Teacher Assignment Form Component
export const TeacherAssignmentForm = ({ 
    batchId, 
    courses, 
    onSuccess 
  }: { 
    batchId: string; 
    courses: Course[];
    onSuccess: () => void;
  }) => {
    const [selectedCourse, setSelectedCourse] = useState<string>('');
    const [selectedSchedule, setSelectedSchedule] = useState<string>('');
    const [selectedTeacher, setSelectedTeacher] = useState<string>('');
    const [remuneration, setRemuneration] = useState<string>('');
    const [selectedDates, setSelectedDates] = useState<Date[]>([]);
    const [dateRange, setDateRange] = useState<{from: Date | undefined, to: Date | undefined}>({
      from: undefined,
      to: undefined
    });
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [availableSchedules, setAvailableSchedules] = useState<ScheduleClass[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [assignmentMode, setAssignmentMode] = useState<'single' | 'range'>('single');
  
    // Fetch teachers from the database
    useEffect(() => {
      const fetchTeachers = async () => {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('teacher')
          .select('*');
        
        if (error) {
          console.error('Error fetching teachers:', error);
          return;
        }
  
        setTeachers(data as Teacher[]);
      };
  
      fetchTeachers();
    }, []);
  
    // Update available schedules when course changes
    useEffect(() => {
      if (selectedCourse) {
        const course = courses.find(c => c.batchCourseId === selectedCourse);
        if (course) {
          setAvailableSchedules(course.schedule);
        } else {
          setAvailableSchedules([]);
        }
        setSelectedSchedule('');
      } else {
        setAvailableSchedules([]);
      }
    }, [selectedCourse, courses]);
  
    // Get all dates for a specific day between start and end dates
    const getDatesForDay = (day: string, startDate: Date, endDate: Date): Date[] => {
      const dates: Date[] = [];
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayIndex = days.indexOf(day);
      
      if (dayIndex === -1) return [];
      
      const currentDate = new Date(startDate);
      
      // Find the first occurrence of the day
      while (currentDate.getDay() !== dayIndex) {
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // Collect all occurrences until end date
      while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 7); // Move to next week
      }
      
      return dates;
    };

    // Define DateRange type to match what the Calendar component expects
    interface DateRange {
      from: Date | undefined;
      to?: Date | undefined; // Note: 'to' is optional in the Calendar component's DateRange type
    }

    // Fixed handlers for the Calendar components
    const handleMultipleSelect = (dates: Date[] | undefined) => {
      setSelectedDates(dates || []);
    };

    const handleRangeSelect = (range: DateRange | undefined) => {
      // Ensure we maintain our state shape with both from and to properties
      setDateRange({
        from: range?.from,
        to: range?.to || undefined
      });
    };
  
    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!selectedCourse || !selectedSchedule || !selectedTeacher || !remuneration) {
        toast.error('Please fill in all required fields');
        return;
      }
  
      if (assignmentMode === 'single' && !selectedDates.length) {
        toast.error('Please select at least one date');
        return;
      }
  
      if (assignmentMode === 'range' && (!dateRange.from || !dateRange.to)) {
        toast.error('Please select a date range');
        return;
      }
  
      try {
        setIsSubmitting(true);
        const supabase = createClient();
        const course = courses.find(c => c.batchCourseId === selectedCourse);
        const schedule = availableSchedules.find(s => s.id === selectedSchedule);
        
        if (!course || !schedule) {
          toast.error('Invalid course or schedule selected');
          return;
        }
  
        // Determine which dates to use based on mode
        let datesToAssign: Date[] = [];
        
        if (assignmentMode === 'single') {
          datesToAssign = selectedDates;
        } else {
          // For range mode, get all occurrences of the schedule day within the date range
          if (dateRange.from && dateRange.to) {
            datesToAssign = getDatesForDay(
              schedule.day,
              dateRange.from,
              dateRange.to
            );
          }
        }
  
        // Filter dates to only include those within the course period
        const courseStartDate = parseISO(course.startDate);
        const courseEndDate = parseISO(course.endDate);
        
        datesToAssign = datesToAssign.filter(date => 
          isWithinInterval(date, { start: courseStartDate, end: courseEndDate })
        );
  
        if (datesToAssign.length === 0) {
          toast.error('No valid dates selected within the course period');
          return;
        }
  
        // Create assignments for each date
        const assignments = datesToAssign.map(date => ({
          assigned_date: format(date, 'yyyy-MM-dd'),
          batch_course_schedule_id: schedule.id,
          teacher_id: selectedTeacher,
          remuneration: parseFloat(remuneration),
          status: 'scheduled'
        }));
  
        // Batch insert all assignments
        const { data, error } = await supabase
          .from('assigned_teachers')
          .insert(assignments);
  
        if (error) {
          console.error('Error assigning teachers:', error);
          toast.error('Failed to assign teacher. Please try again.');
          return;
        }
  
        toast.success(`Teacher successfully assigned to ${datesToAssign.length} sessions`);
        onSuccess();
        
        // Reset form
        setSelectedCourse('');
        setSelectedSchedule('');
        setSelectedTeacher('');
        setRemuneration('');
        setSelectedDates([]);
        setDateRange({ from: undefined, to: undefined });
  
      } catch (error) {
        console.error('Error in teacher assignment:', error);
        toast.error('An unexpected error occurred');
      } finally {
        setIsSubmitting(false);
      }
    };
  
    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="course">Course</Label>
            <Select
              value={selectedCourse}
              onValueChange={setSelectedCourse}
            >
              <SelectTrigger id="course">
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {courses
                  .filter(course => course.status !== 'finished')
                  .map(course => (
                    <SelectItem key={course.batchCourseId} value={course.batchCourseId}>
                      {course.courseName} ({course.courseCode})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="schedule">Class Schedule</Label>
            <Select
              value={selectedSchedule}
              onValueChange={setSelectedSchedule}
              disabled={!selectedCourse}
            >
              <SelectTrigger id="schedule">
                <SelectValue placeholder="Select a class schedule" />
              </SelectTrigger>
              <SelectContent>
                {availableSchedules.map(schedule => (
                  <SelectItem key={schedule.id} value={schedule.id}>
                    {schedule.day}: {schedule.startTime} - {schedule.endTime}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="teacher">Teacher</Label>
            <Select
              value={selectedTeacher}
              onValueChange={setSelectedTeacher}
            >
              <SelectTrigger id="teacher">
                <SelectValue placeholder="Select a teacher" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map(teacher => (
                  <SelectItem key={teacher.InstructorID} value={teacher.InstructorID}>
                    {teacher.FirstName} {teacher.LastName} - {teacher.Department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="remuneration">Remuneration</Label>
            <Input
              id="remuneration"
              type="number"
              min="0"
              step="0.01"
              value={remuneration}
              onChange={e => setRemuneration(e.target.value)}
              placeholder="Enter amount"
            />
          </div>
  
          <div>
            <Label htmlFor="assignmentMode">Assignment Mode</Label>
            <Select
              value={assignmentMode}
              onValueChange={(value) => setAssignmentMode(value as 'single' | 'range')}
            >
              <SelectTrigger id="assignmentMode">
                <SelectValue placeholder="Select assignment mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single or Multiple Dates</SelectItem>
                <SelectItem value="range">Date Range</SelectItem>
              </SelectContent>
            </Select>
          </div>
  
          {assignmentMode === 'single' && (
            <div>
              <Label>Select Dates</Label>
              <div className="border rounded-md p-1 mt-1">
                <Calendar
                  mode="multiple"
                  selected={selectedDates}
                  onSelect={handleMultipleSelect} // Fixed: using the wrapper function
                  disabled={(date) => {
                    // Disable dates outside the course period or days that don't match the schedule
                    if (!selectedSchedule || !selectedCourse) return true;
                    
                    const course = courses.find(c => c.batchCourseId === selectedCourse);
                    const schedule = availableSchedules.find(s => s.id === selectedSchedule);
                    
                    if (!course || !schedule) return true;
                    
                    const courseStartDate = parseISO(course.startDate);
                    const courseEndDate = parseISO(course.endDate);
                    
                    // Check if date is within course period
                    const isWithinCourse = isWithinInterval(date, {
                      start: courseStartDate,
                      end: courseEndDate
                    });
                    
                    if (!isWithinCourse) return true;
                    
                    // Check if day of week matches schedule
                    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    const dateDay = days[date.getDay()];
                    
                    return dateDay !== schedule.day;
                  }}
                  className="border-none"
                />
              </div>
            </div>
          )}
  
          {assignmentMode === 'range' && (
            <div>
              <Label>Select Date Range</Label>
              <div className="grid gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "PPP")} - {format(dateRange.to, "PPP")}
                          </>
                        ) : (
                          format(dateRange.from, "PPP")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={handleRangeSelect} // Fixed: using the wrapper function
                      disabled={(date) => {
                        if (!selectedCourse) return true;
                        
                        const course = courses.find(c => c.batchCourseId === selectedCourse);
                        
                        if (!course) return true;
                        
                        const courseStartDate = parseISO(course.startDate);
                        const courseEndDate = parseISO(course.endDate);
                        
                        return !isWithinInterval(date, {
                          start: courseStartDate,
                          end: courseEndDate
                        });
                      }}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}
        </div>
  
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Assigning...' : 'Assign Teacher'}
          </Button>
        </div>
      </form>
    );
  };