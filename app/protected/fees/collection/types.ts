// types.ts - Common types for fee collection system

export type Student = {
    studentid: number;
    rollno: number;
    batchid: string | null;
    firstname: string;
    lastname: string;
    email: string;
    phone: string | null;
    isactive: boolean;
  }
  
  export type FeeType = {
    id: string;
    name: string;
    description: string | null;
    is_recurring: boolean;
    frequency: string | null;
    is_active: boolean;
  }
  
  export type AcademicPeriod = {
    id: string;
    batch_id: string;
    semester_number: number;
    name: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
  }
  
  export type Batch = {
    id: string;
    batch_id: string;
    intake_session: string;
    program_code: string;
    number_of_students: number;
  }
  
  export type Payment = {
    id: string;
    student_fee_id: string;
    amount: number;
    payment_date: string;
    payment_method: string;
    transaction_reference: string | null;
    receipt_number: string | null;
    notes: string | null;
    created_by: string;
  }
  
  export type StudentFee = {
    id: string;
    student_id: number;
    fee_type_id: string;
    academic_period_id: string | null;
    batch_id: string | null;
    description: string | null;
    total_amount: number;
    due_date: string;
    status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'WAIVED';
    student?: Student;
    fee_type?: FeeType;
    academic_period?: AcademicPeriod | null;
    batch?: Batch | null;
    payments?: Payment[];
    paid_amount?: number;
    remaining_amount?: number;
  }
  
  // Filter types
  export type FeeFilters = {
    search: string;
    batchId: string;
    feeTypeId: string;
    academicPeriodId: string;
    status: string;
    dueDateRange: [Date | null, Date | null];
  }

  // Common type definitions for the fee management system

export type FeeStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'WAIVED' | string;

