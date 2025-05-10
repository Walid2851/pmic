// Define the Batch type
type Batch = {
    id: string;
    batch_id: string;
    intake_session: string;
    number_of_students: number;
    program_code: string;
    created_at: string;
    updated_at: string;
  };
  
  // Define Academic Period type
  type AcademicPeriod = {
    id: string;
    batch_id: string;
    semester_number: number;
    name: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
  
  // Define Student type
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
  
  // Define Teacher type
  type Teacher = {
    InstructorID: string;
    FirstName: string;
    LastName: string;
    Email: string;
    Phone: string;
    Department: string;
    Qualification: string;
  };
  
  // Define course type with new fields matching our BCNF schema
  type Course = {
    id: string;
    batchCourseId: string;
    courseId: number;
    courseName: string;
    courseCode: string;
    academicYear: string;
    startDate: string;
    endDate: string;
    status: 'ongoing' | 'finished' | 'upcoming';
    schedule: ScheduleClass[];
    description?: string;
    prerequisites?: string;
    credits?: number;
    academicPeriodId?: string;
  };
  
  // Define schedule class type
  type ScheduleClass = {
    id: string;
    day: string;
    startTime: string;
    endTime: string;
    courseName?: string; // Optional for when we combine schedules
    courseCode?: string; // Optional for combined schedules
  };
  
  // Define teacher assignment type
  type TeacherAssignment = {
    id: string;
    assigned_date: string;
    batch_course_schedule_id: string;
    teacher_id: string;
    teacher_name: string;
    remuneration: number;
    tax: number;
    payment: number;
    status: 'scheduled' | 'completed' | 'cancelled';
    courseCode?: string;
    courseName?: string;
    startTime?: string;
    endTime?: string;
    day?: string;
    academicPeriodId?: string;
  };
  
  // Define schedule type for tomorrow's class
  type ScheduleItem = {
    courseName: string;
    courseCode: string;
    startTime: string;
    endTime: string;
    teacherName?: string;
  };


// Define props types for components
type BatchCalendarProps = {
    schedule: (ScheduleClass & { 
      courseName: string; 
      courseCode: string; 
      teacherName?: string;
    })[];
  };
  
  type BatchStudentsPageProps = {
    params: { id: string };
  };