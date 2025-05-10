'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, ArrowLeft, Download, Receipt, Send } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'sonner';

// Define type for fee status
type FeeStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'WAIVED' | string;

// Define interfaces based on database schema
interface Student {
  studentid: number;
  rollno: number;
  batchid: string | null;
  firstname: string;
  lastname: string;
  email: string;
  phone: string | null;
  isactive: boolean | null;
}

interface FeeType {
  id: string;
  name: string;
  description: string | null;
  is_recurring: boolean;
  frequency: string | null;
}

interface AcademicPeriod {
  id: string;
  name: string;
}

interface Batch {
  id: string;
  batch_id: string;
}

interface Payment {
  id: string;
  student_fee_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  transaction_reference: string | null;
  receipt_number: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
}

interface StudentFee {
  id: string;
  student_id: number;
  fee_type_id: string;
  academic_period_id: string | null;
  batch_id: string | null;
  description: string | null;
  total_amount: number;
  due_date: string;
  status: FeeStatus;
  created_at: string;
  updated_at: string;
  
  // Related entities
  student: Student;
  fee_type: FeeType;
  academic_period: AcademicPeriod | null;
  batch: Batch | null;
  
  // Calculated fields
  paid_amount: number;
  remaining_amount: number;
}

// Type for page params
interface PageParams {
  id: string;
}

const getStatusBadge = (status: FeeStatus) => {
  switch (status) {
    case 'PENDING':
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
    case 'PARTIAL':
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Partial</Badge>;
    case 'PAID':
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Paid</Badge>;
    case 'OVERDUE':
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Overdue</Badge>;
    case 'WAIVED':
      return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Waived</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const FeeDetailsPage = ({ params }: { params: PageParams }) => {
  const { id } = params;
  const [feeDetails, setFeeDetails] = useState<StudentFee | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchFeeDetails = async () => {
      try {
        setLoading(true);
        const supabase = createClient();
        
        // Fetch fee details with related data
        const { data: feeData, error: feeError } = await supabase
          .from('student_fee')
          .select(`
            *,
            student:student_id(studentid, rollno, firstname, lastname, email, phone, isactive, batchid),
            fee_type:fee_type_id(*),
            academic_period:academic_period_id(*),
            batch:batch_id(*)
          `)
          .eq('id', id)
          .single();
          
        if (feeError) throw feeError;
        
        // Fetch payments for this fee
        const { data: paymentData, error: paymentError } = await supabase
          .from('payment')
          .select('*')
          .eq('student_fee_id', id)
          .order('payment_date', { ascending: false });
          
        if (paymentError) throw paymentError;
        
        // Calculate paid amount
        const paidAmount = paymentData.reduce((sum, payment) => sum + payment.amount, 0);
        const remainingAmount = feeData.total_amount - paidAmount;
        
        setFeeDetails({
          ...feeData,
          paid_amount: paidAmount,
          remaining_amount: remainingAmount
        });
        setPayments(paymentData || []);
      } catch (err) {
        console.error('Error fetching fee details:', err);
        setError('Failed to load fee details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFeeDetails();
  }, [id]);

  const handleSendReminder = async () => {
    try {
      if (!feeDetails) return;
      
      // In a real app, this would send an email to the student
      // For now, we'll just show a toast notification
      toast.success('Reminder sent successfully', {
        description: `A payment reminder has been sent to ${feeDetails.student.email}`
      });
    } catch (error) {
      toast.error('Failed to send reminder', {
        description: 'There was an error sending the reminder.'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <p className="text-lg">Loading fee details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  if (!feeDetails) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>The requested fee details could not be found.</AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Toaster />
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Fee Details</h1>
        <div className="ml-auto flex gap-2">
          {feeDetails.status !== 'PAID' && feeDetails.status !== 'WAIVED' && (
            <Button variant="outline" onClick={handleSendReminder}>
              <Send className="mr-2 h-4 w-4" />
              Send Reminder
            </Button>
          )}
          <Button onClick={() => window.open(`/admin/fees/${id}/receipt`, '_blank')}>
            <Receipt className="mr-2 h-4 w-4" />
            Generate Receipt
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fee Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status:</span>
                <div>{getStatusBadge(feeDetails.status)}</div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Due Date:</span>
                <span className="font-medium">
                  {format(new Date(feeDetails.due_date), 'MMM dd, yyyy')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Amount:</span>
                <span className="font-medium">₹{feeDetails.total_amount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Paid Amount:</span>
                <span className="font-medium text-green-600">₹{feeDetails.paid_amount.toLocaleString()}</span>
              </div>
              {feeDetails.status !== 'PAID' && feeDetails.status !== 'WAIVED' && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Remaining:</span>
                  <span className="font-medium text-red-600">₹{feeDetails.remaining_amount.toLocaleString()}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Student Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">
                  {feeDetails.student.firstname} {feeDetails.student.lastname}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Roll No:</span>
                <span className="font-medium">{feeDetails.student.rollno}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium break-all">{feeDetails.student.email}</span>
              </div>
              {feeDetails.student.phone && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-medium">{feeDetails.student.phone}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fee Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Fee Type:</span>
                <span className="font-medium">{feeDetails.fee_type.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Recurring:</span>
                <span className="font-medium">
                  {feeDetails.fee_type.is_recurring ? `Yes (${feeDetails.fee_type.frequency})` : 'No'}
                </span>
              </div>
              {feeDetails.batch && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Batch:</span>
                  <span className="font-medium">{feeDetails.batch.batch_id}</span>
                </div>
              )}
              {feeDetails.academic_period && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Semester:</span>
                  <span className="font-medium">{feeDetails.academic_period.name}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="payments" className="w-full mt-6">
        <TabsList>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
          <TabsTrigger value="details">Additional Details</TabsTrigger>
        </TabsList>
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>
                Record of all payments made towards this fee
              </CardDescription>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No payments made yet</p>
                </div>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="py-3 px-4 text-left font-medium text-sm">Date</th>
                        <th className="py-3 px-4 text-left font-medium text-sm">Amount</th>
                        <th className="py-3 px-4 text-left font-medium text-sm">Method</th>
                        <th className="py-3 px-4 text-left font-medium text-sm">Reference</th>
                        <th className="py-3 px-4 text-left font-medium text-sm">Receipt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment, index) => (
                        <tr 
                          key={payment.id} 
                          className={index % 2 === 0 ? 'bg-white' : 'bg-muted/20'}
                        >
                          <td className="py-3 px-4">
                            {format(new Date(payment.payment_date), 'MMM dd, yyyy')}
                          </td>
                          <td className="py-3 px-4 font-medium">
                            ₹{payment.amount.toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            {payment.payment_method}
                          </td>
                          <td className="py-3 px-4">
                            {payment.transaction_reference || '-'}
                          </td>
                          <td className="py-3 px-4">
                            {payment.receipt_number ? (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8"
                                onClick={() => window.open(`/admin/payments/${payment.id}/receipt`, '_blank')}
                              >
                                <Receipt className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            ) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Payments: {payments.length}
                </p>
              </div>
              {payments.length > 0 && (
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Export History
                </Button>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Fee Details</CardTitle>
              <CardDescription>
                Additional information about this fee
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {feeDetails.description && (
                  <div>
                    <h3 className="font-medium mb-1">Description</h3>
                    <p className="text-muted-foreground">{feeDetails.description}</p>
                  </div>
                )}
                
                <div>
                  <h3 className="font-medium mb-1">Fee Components</h3>
                  {/* This would require an additional query to get fee components */}
                  <div className="bg-muted/30 p-4 rounded-md">
                    <p className="text-muted-foreground text-sm">
                      Fee component details are not available in this view.
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-1">Created At</h3>
                    <p className="text-muted-foreground">
                      {format(new Date(feeDetails.created_at), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Last Updated</h3>
                    <p className="text-muted-foreground">
                      {format(new Date(feeDetails.updated_at), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FeeDetailsPage;