'use client';
import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar as CalendarIcon, Info, Users, Clock, Book, ChevronRight, GraduationCap } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { DataTable } from './data-table';
import { columns } from './column';
import { columns_1 } from './column1';
import { AddStudentForm } from './create_student';
import { Skeleton } from '@/components/ui/skeleton';
import { Toaster } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, parseISO, isAfter, isBefore, isToday, addDays, isWithinInterval, isSameDay } from 'date-fns';
import { AddCourseModal } from './course_modal';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { TeacherAssignmentForm } from './teacher-assignment';
import { BatchCalendar } from './batch-calendar';
import { AcademicPeriodModal } from './academic-period-modal';
import { use } from 'react';

// TeacherAssignments component for displaying all teacher assignments
const TeacherAssignments = ({ 
  assignments, 
  handleDelete 
}: { 
  assignments: TeacherAssignment[];
  handleDelete: (id: string) => Promise<void>;
}) => {
  // Group assignments by date
  const groupedAssignments = assignments.reduce((acc, curr) => {
    const date = curr.assigned_date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(curr);
    return acc;
  }, {} as Record<string, TeacherAssignment[]>);

  // Sort dates
  const sortedDates = Object.keys(groupedAssignments).sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  );

  return (
    <div className="space-y-6">
      {sortedDates.length > 0 ? (
        sortedDates.map(date => (
          <div key={date} className="space-y-2">
            <h3 className="font-semibold">{format(new Date(date), 'EEEE, MMMM d, yyyy')}</h3>
            <div className="space-y-2">
              {groupedAssignments[date].map(assignment => (
                <div key={assignment.id} className="flex justify-between items-center p-3 border rounded-md">
                  <div>
                    <div className="flex items-center">
                      <div className="mr-2">
                        <GraduationCap className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{assignment.courseName}</p>
                        <p className="text-xs text-gray-500">{assignment.courseCode}</p>
                      </div>
                    </div>
                    <p className="text-sm mt-1">{assignment.teacher_name}</p>
                    <p className="text-xs text-gray-500">{assignment.startTime} - {assignment.endTime}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <Badge 
                      variant="outline" 
                      className={
                        assignment.status === 'completed' 
                          ? "bg-green-100 text-green-800 border-green-300" 
                          : assignment.status === 'cancelled' 
                            ? "bg-red-100 text-red-800 border-red-300"
                            : "bg-blue-100 text-blue-800 border-blue-300"
                      }
                    >
                      {assignment.status}
                    </Badge>
                    <p className="text-xs mt-1">₹{assignment.remuneration.toFixed(2)}</p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-600 hover:text-red-800 mt-1 h-6 px-2"
                      onClick={() => handleDelete(assignment.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        <p className="text-gray-500 text-center py-4">No teacher assignments found.</p>
      )}
    </div>
  );
};

// CourseDetail component for showing course information
const CourseDetail = ({ course, onClose }: { course: Course, onClose: () => void }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">{course.courseName}</h2>
          <p className="text-gray-500">{course.courseCode}</p>
        </div>
        <Badge 
          variant="outline" 
          className={
            course.status === 'ongoing' 
              ? "bg-green-100 text-green-800 border-green-300" 
              : course.status === 'upcoming' 
                ? "bg-blue-100 text-blue-800 border-blue-300"
                : "bg-gray-100 text-gray-800 border-gray-300"
          }
        >
          {course.status}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Duration</h3>
          <p className="text-sm">{format(parseISO(course.startDate), 'MMM dd, yyyy')} - {format(parseISO(course.endDate), 'MMM dd, yyyy')}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Academic Year</h3>
          <p className="text-sm">{course.academicYear}</p>
        </div>
        {course.credits && (
          <div>
            <h3 className="text-sm font-medium text-gray-500">Credits</h3>
            <p className="text-sm">{course.credits}</p>
          </div>
        )}
      </div>
      
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-2">Schedule</h3>
        <div className="space-y-2">
          {course.schedule.map((session, index) => (
            <div key={index} className="flex items-center p-2 border rounded-md">
              <div className="bg-blue-100 p-2 rounded-md mr-3">
                <Clock className="h-4 w-4 text-blue-800" />
              </div>
              <div>
                <p className="font-medium">{session.day}</p>
                <p className="text-sm text-gray-500">{session.startTime} - {session.endTime}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {course.description && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
          <p className="text-sm">{course.description}</p>
        </div>
      )}
      
      {course.prerequisites && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Prerequisites</h3>
          <p className="text-sm">{course.prerequisites}</p>
        </div>
      )}
      
      <div className="flex justify-end">
        <Button onClick={onClose}>Close</Button>
      </div>
    </div>
  );
};



export default function BatchStudentsPage({ params }: BatchStudentsPageProps) {
  
  const [batch, setBatch] = useState<Batch | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]); // Store all courses for filtering
  const [tomorrowSchedule, setTomorrowSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('students');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseDetailOpen, setCourseDetailOpen] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [teacherAssignments, setTeacherAssignments] = useState<TeacherAssignment[]>([]);
  const [allTeacherAssignments, setAllTeacherAssignments] = useState<TeacherAssignment[]>([]); // Store all assignments for filtering
  const [assignTeacherOpen, setAssignTeacherOpen] = useState<boolean>(false);
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');

  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Fetch academic periods
  useEffect(() => {
    const fetchAcademicPeriods = async () => {
      try {
        const supabase = createClient();
        const batchId = params?.id;

        if (!batchId) return;

        const { data, error } = await supabase
          .from('academic_period')
          .select('*')
          .eq('batch_id', batchId)
          .order('start_date', { ascending: false });

        if (error) {
          console.error('Error fetching academic periods:', error);
          return;
        }

        setAcademicPeriods(data || []);
        
        // Set the active period as default if available
        const activePeriod = (data || []).find(period => period.is_active);
        if (activePeriod) {
          setSelectedPeriodId(activePeriod.id);
        } else if (data && data.length > 0) {
          setSelectedPeriodId(data[0].id);
        }
      } catch (error) {
        console.error('Error in fetchAcademicPeriods:', error);
      }
    };

    fetchAcademicPeriods();
  }, [params]);

  useEffect(() => {
    const fetchBatchData = async () => {
      try {
        const supabase = createClient();
        const batchId = params?.id;

        if (!batchId) return notFound();

        // Fetch batch details
        const { data: batchData, error: batchError } = await supabase
          .from('batch')
          .select('*')
          .eq('id', batchId)
          .single();

        if (batchError || !batchData) return notFound();
        setBatch(batchData as Batch);

        // Fetch students
        const { data: studentData, error: studentError } = await supabase
          .from('student')
          .select('*')
          .eq('batchid', batchId);

        if (!studentError) {
          setStudents(studentData as Student[] || []);
        }

        // Fetch all courses (regardless of period)
        const { data: batchCoursesData, error: batchCoursesError } = await supabase
          .from('batch_courses')
          .select('*, course:course("CourseID", "CourseCode", "CourseTitle", "Credits", "Description", "Prerequisites")')
          .eq('batch_id', batchId);

        if (batchCoursesError) {
          console.error('Error fetching batch courses:', batchCoursesError);
          return;
        }

        // Now fetch the schedules for each batch course
        const coursesWithSchedules = await Promise.all(
          (batchCoursesData || []).map(async (batchCourse) => {
            const { data: scheduleData, error: scheduleError } = await supabase
              .from('batch_course_schedules')
              .select('*')
              .eq('batch_course_id', batchCourse.id);

            if (scheduleError) {
              console.error('Error fetching schedule for course:', scheduleError);
              return null;
            }

            // Format the schedule data
            const schedule = (scheduleData || []).map(item => ({
              id: item.id,
              day: item.class_day,
              startTime: item.start_time,
              endTime: item.end_time,
              courseName: batchCourse.course.CourseTitle,
              courseCode: batchCourse.course.CourseCode
            }));

            // Determine course status based on dates
            const today = new Date();
            const startDate = parseISO(batchCourse.start_date);
            const endDate = parseISO(batchCourse.end_date);
            
            let status: 'ongoing' | 'finished' | 'upcoming';
            if (isAfter(today, endDate)) {
              status = 'finished';
            } else if (isBefore(today, startDate)) {
              status = 'upcoming';
            } else {
              status = 'ongoing';
            }

            return {
              id: batchCourse.course.CourseID.toString(),
              batchCourseId: batchCourse.id,
              courseId: batchCourse.course.CourseID,
              courseName: batchCourse.course.CourseTitle,
              courseCode: batchCourse.course.CourseCode,
              academicYear: batchCourse.academic_year,
              startDate: batchCourse.start_date,
              endDate: batchCourse.end_date,
              status,
              schedule,
              description: batchCourse.course.Description,
              prerequisites: batchCourse.course.Prerequisites,
              credits: batchCourse.course.Credits,
              academicPeriodId: batchCourse.academic_period_id
            };
          })
        );

        // Filter out null values and store all courses 
        const validCourses = coursesWithSchedules.filter(Boolean) as Course[];
        setAllCourses(validCourses);
        
        // Filter courses by selected period if any
        if (selectedPeriodId) {
          const filteredCourses = validCourses.filter(course => 
            course.academicPeriodId === selectedPeriodId
          );
          setCourses(filteredCourses);
        } else {
          setCourses(validCourses);
        }

        // Fetch teacher assignments with all required data in a single query
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from('assigned_teachers')
          .select(`
            *,
            teacher:teacher(FirstName, LastName),
            batch_course_schedule:batch_course_schedules(
              id,
              class_day,
              start_time,
              end_time,
              batch_course_id,
              batch_course:batch_courses(id, academic_period_id, course:course(CourseCode, CourseTitle))
            )
          `)
          .order('assigned_date', { ascending: true });

        if (assignmentsError) {
          console.error('Error fetching teacher assignments:', assignmentsError);
        } else {
          // Process teacher assignments
          const processedAssignments = (assignmentsData || []).map(assignment => {
            const schedule = assignment.batch_course_schedule;
            
            return {
              id: assignment.id,
              assigned_date: assignment.assigned_date,
              batch_course_schedule_id: assignment.batch_course_schedule_id,
              teacher_id: assignment.teacher_id,
              teacher_name: `${assignment.teacher.FirstName} ${assignment.teacher.LastName}`,
              remuneration: assignment.remuneration,
              tax: assignment.tax || 0,
              payment: assignment.payment || 0,
              status: assignment.status,
              day: schedule.class_day,
              startTime: schedule.start_time,
              endTime: schedule.end_time,
              courseCode: schedule.batch_course.course.CourseCode,
              courseName: schedule.batch_course.course.CourseTitle,
              academicPeriodId: schedule.batch_course.academic_period_id
            };
          });

          // Store all assignments
          setAllTeacherAssignments(processedAssignments);
          
          // Filter assignments by academic period if selected
          if (selectedPeriodId) {
            const filteredAssignments = processedAssignments.filter(
              assignment => assignment.academicPeriodId === selectedPeriodId
            );
            setTeacherAssignments(filteredAssignments);
          } else {
            setTeacherAssignments(processedAssignments);
          }

          // Get tomorrow's schedule
          const tomorrow = addDays(new Date(), 1);
          const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const tomorrowDay = daysOfWeek[tomorrow.getDay()];
          const tomorrowDateStr = format(tomorrow, 'yyyy-MM-dd');
          
          // Filter courses with classes tomorrow
          const relevantCourses = selectedPeriodId
            ? validCourses.filter(course => course.academicPeriodId === selectedPeriodId)
            : validCourses;
            
          const tomorrowClasses = relevantCourses
            .filter(course => course.status !== 'finished')
            .flatMap(course => {
              const tomorrowSessions = course.schedule.filter(s => s.day === tomorrowDay);
              return tomorrowSessions.map(session => {
                // Find teacher assignment for this session and tomorrow's date
                const teacherAssignment = processedAssignments.find(a => 
                  a.batch_course_schedule_id === session.id && 
                  a.assigned_date === tomorrowDateStr
                );

                let teacherName;
                if (teacherAssignment) {
                  teacherName = teacherAssignment.teacher_name;
                }

                return {
                  courseName: course.courseName,
                  courseCode: course.courseCode,
                  startTime: session.startTime,
                  endTime: session.endTime,
                  teacherName
                };
              });
            });
          
          setTomorrowSchedule(tomorrowClasses);
        }
      } catch (error) {
        console.error('Error fetching batch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBatchData();
  }, [params, refreshTrigger, selectedPeriodId]);
  
  // Handle period change
  const handlePeriodChange = (periodId: string) => {
    setSelectedPeriodId(periodId);
    
    // The useEffect hook will handle the actual filtering when selectedPeriodId changes
  };

  // Handle teacher assignment deletion
  const handleDeleteAssignment = async (id: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('assigned_teachers')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting assignment:', error);
        toast.error('Failed to delete assignment');
        return;
      }

      toast.success('Assignment deleted successfully');
      refreshData();
    } catch (error) {
      console.error('Error in delete operation:', error);
      toast.error('An unexpected error occurred');
    }
  };
  
  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Combine all schedules from all courses for the calendar with teacher info
  const allSchedules = courses.flatMap(course => 
    course.schedule.map(s => {
      // Find the teacher for today's date if any
      const today = format(new Date(), 'yyyy-MM-dd');
      const teacherForToday = teacherAssignments.find(a => 
        a.batch_course_schedule_id === s.id && 
        a.assigned_date === today
      );

      return {
        ...s,
        courseName: course.courseName,
        courseCode: course.courseCode,
        teacherName: teacherForToday?.teacher_name
      };
    })
  );

  const openCourseDetail = (course: Course) => {
    setSelectedCourse(course);
    setCourseDetailOpen(true);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Toaster />
      
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-3xl font-bold">Batch: {batch?.batch_id}</h1>
            <div className="w-64">
              <Select
                value={selectedPeriodId}
                onValueChange={handlePeriodChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select academic period" />
                </SelectTrigger>
                <SelectContent>
                  {academicPeriods.map((period) => (
                    <SelectItem key={period.id} value={period.id}>
                      {period.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-gray-500">Program: {batch?.program_code} | Intake: {batch?.intake_session}</p>
        </div>
        <div className="flex gap-2">
  <Dialog open={assignTeacherOpen} onOpenChange={setAssignTeacherOpen}>
    <DialogTrigger asChild>
      <Button variant="outline">
        <GraduationCap className="mr-2 h-4 w-4" />
        Assign Teacher
      </Button>
    </DialogTrigger>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Assign Teacher to Classes</DialogTitle>
      </DialogHeader>
      {batch?.id && (
        <TeacherAssignmentForm 
          batchId={batch.id} 
          courses={courses}
          onSuccess={() => {
            refreshData();
            setAssignTeacherOpen(false);
          }}
        />
      )}
    </DialogContent>
  </Dialog>
  
  {/* Add the new Academic Period Modal component */}
  {batch?.id && (
    <AcademicPeriodModal 
      batchId={batch.id} 
      onSuccess={refreshData}
    />
  )}
  
  <Dialog>
    <DialogTrigger asChild>
      <Button>
        <Plus className="mr-2 h-4 w-4" />
        Add Student
      </Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Add New Student</DialogTitle>
      </DialogHeader>
      {batch?.id && <AddStudentForm batchId={batch.id} />}
    </DialogContent>
  </Dialog>
</div>
      </div>
      
      <Separator />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Tomorrow's Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tomorrowSchedule.length > 0 ? (
              <div className="space-y-4">
                {tomorrowSchedule.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border rounded-md">
                    <div>
                      <p className="font-semibold">{item.courseName}</p>
                      <p className="text-sm text-gray-500">Code: {item.courseCode}</p>
                      {item.teacherName && (
                        <div className="flex items-center mt-1 text-sm text-blue-600">
                          <GraduationCap className="h-4 w-4 mr-1" />
                          {item.teacherName}
                        </div>
                      )}
                    </div>
                    <div className="text-sm">
                      {item.startTime} - {item.endTime}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No classes scheduled for tomorrow.</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Manage Courses</CardTitle>
            {batch?.id && (
              <AddCourseModal
                batchId={batch.id}
                academicPeriodId={selectedPeriodId}
                onSuccess={refreshData}
              />
            )}
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">Total: {courses.length} courses</p>
            <div className="space-y-2">
              {courses.map(course => (
                <div 
                  key={course.batchCourseId} 
                  className="flex justify-between items-center p-3 border rounded-md hover:bg-gray-50 cursor-pointer transition"
                  onClick={() => openCourseDetail(course)}
                >
                  <div>
                    <p className="font-medium">{course.courseName}</p>
                    <p className="text-xs text-gray-500">{course.courseCode}</p>
                  </div>
                  <div className="flex items-center">
                    <Badge 
                      variant="outline" 
                      className={
                        course.status === 'ongoing' 
                          ? "bg-green-100 text-green-800 border-green-300" 
                          : course.status === 'upcoming' 
                            ? "bg-blue-100 text-blue-800 border-blue-300"
                            : "bg-gray-100 text-gray-800 border-gray-300"
                      }
                    >
                      {course.status}
                    </Badge>
                    <ChevronRight className="h-4 w-4 ml-2 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="students">
            <Users className="h-4 w-4 mr-2" />
            Students
          </TabsTrigger>
          <TabsTrigger value="schedule">
            <CalendarIcon className="h-4 w-4 mr-2" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="teachers">
            <GraduationCap className="h-4 w-4 mr-2" />
            Teachers
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="students" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Student Management</CardTitle>
              <CardDescription>
                Manage students enrolled in this batch.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable columns={columns_1} data={students} />
            </CardContent>
          </Card>
        </TabsContent> 
        
        <TabsContent value="schedule" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Batch Schedule
              </CardTitle>
              <CardDescription>
                Weekly schedule of all courses for this batch.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BatchCalendar schedule={allSchedules} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teachers" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Teacher Assignments
              </CardTitle>
              <CardDescription>
                Manage teacher assignments for all courses.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-4">
                <Button onClick={() => setAssignTeacherOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Assign Teacher
                </Button>
              </div>
              <TeacherAssignments 
                assignments={teacherAssignments} 
                handleDelete={handleDeleteAssignment}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Course Detail Dialog */}
      <Dialog open={courseDetailOpen} onOpenChange={setCourseDetailOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Course Details</DialogTitle>
          </DialogHeader>
          {selectedCourse && (
            <CourseDetail 
              course={selectedCourse} 
              onClose={() => setCourseDetailOpen(false)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
};