'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { format } from 'date-fns';
import html2pdf from 'html2pdf.js';
import {
  Card,
  CardContent
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Download, 
  Printer,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'sonner';
import { Separator } from '@/components/ui/separator';

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
  program_code: string;
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

const FeeReceiptPage = ({ params }: { params: PageParams }) => {
  const { id } = params;
  const [feeDetails, setFeeDetails] = useState<StudentFee | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const receiptRef = useRef<HTMLDivElement | null>(null);
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

  const handlePrint = () => {
    if (!receiptRef.current) return;
    
    const printContents = receiptRef.current.innerHTML;
    const originalContents = document.body.innerHTML;
    
    // Create a stylesheet for printing
    const printStyles = `
      @page { 
        size: A4; 
        margin: 0.5cm;
      }
      body { 
        font-family: Arial, sans-serif;
        padding: 20px;
      }
      .receipt-container {
        max-width: 100%;
      }
      .print-hidden {
        display: none !important;
      }
    `;
    
    // Set body to print content
    document.body.innerHTML = `
      <style>${printStyles}</style>
      <div class="receipt-container">${printContents}</div>
    `;
    
    window.print();
    
    // Restore original content
    document.body.innerHTML = originalContents;
    
    // Need to re-create React components
    window.location.reload();
  };

  const handleDownloadPDF = async () => {
    if (!receiptRef.current || !feeDetails) return;
    
    try {
      setIsDownloadingPdf(true);
      
      // Show toast that we're preparing the PDF
      toast.loading('Preparing your receipt...');
      
      // Create a clone of the receipt element to modify for PDF
      const element = receiptRef.current.cloneNode(true) as HTMLElement;
      
      // Generate meaningful filename
      const studentName = `${feeDetails.student.firstname}_${feeDetails.student.lastname}`.replace(/\s+/g, '_');
      const timestamp = format(new Date(), 'yyyyMMdd');
      const filename = `Fee_Receipt_${studentName}_${timestamp}.pdf`;
      
      // Configure PDF options
      const options = {
        margin: [10, 10, 10, 10],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          logging: false 
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait',
          compress: true
        }
      };
      
      // Generate and download the PDF
      await html2pdf()
        .set(options)
        .from(element)
        .save();
      
      // Dismiss loading toast and show success
      toast.dismiss();
      toast.success('Receipt downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.dismiss();
      toast.error('Failed to download receipt. Please try again.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const generateReceiptNumber = () => {
    // In a real application, this would use a proper receipt numbering system
    const timestamp = new Date().getTime();
    return `RCPT-${timestamp.toString().slice(-8)}`;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <p className="text-lg">Generating receipt...</p>
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

  const receiptNumber = generateReceiptNumber();
  const receiptDate = format(new Date(), 'MMMM dd, yyyy');

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Toaster />
      
      <div className="flex items-center gap-4 mb-6 print-hidden">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Fee Receipt</h1>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button 
            onClick={handleDownloadPDF} 
            disabled={isDownloadingPdf}
          >
            {isDownloadingPdf ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </>
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6" ref={receiptRef}>
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-2xl font-bold">RECEIPT</h2>
              <p className="text-muted-foreground">{receiptDate}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">Receipt No: {receiptNumber}</p>
              <p className="text-muted-foreground">Fee ID: {id.slice(0, 8)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-semibold mb-2">From</h3>
              <p className="font-medium">Your Institute Name</p>
              <p className="text-muted-foreground">123 Education Street</p>
              <p className="text-muted-foreground">City, State 12345</p>
              <p className="text-muted-foreground">contact@yourinstitute.edu</p>
              <p className="text-muted-foreground">+1 (123) 456-7890</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">To</h3>
              <p className="font-medium">
                {feeDetails.student.firstname} {feeDetails.student.lastname}
              </p>
              <p className="text-muted-foreground">Roll No: {feeDetails.student.rollno}</p>
              <p className="text-muted-foreground">{feeDetails.student.email}</p>
              {feeDetails.student.phone && (
                <p className="text-muted-foreground">{feeDetails.student.phone}</p>
              )}
              {feeDetails.batch && (
                <p className="text-muted-foreground">
                  Batch: {feeDetails.batch.batch_id} ({feeDetails.batch.program_code})
                </p>
              )}
            </div>
          </div>

          <div className="mb-8">
            <h3 className="font-semibold mb-2">Fee Details</h3>
            <div className="border rounded-md overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="py-2 px-4 text-left font-medium text-sm">Description</th>
                    <th className="py-2 px-4 text-left font-medium text-sm">Type</th>
                    <th className="py-2 px-4 text-left font-medium text-sm">Due Date</th>
                    <th className="py-2 px-4 text-right font-medium text-sm">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-3 px-4">
                      {feeDetails.description || feeDetails.fee_type.name}
                      {feeDetails.academic_period && (
                        <span className="block text-sm text-muted-foreground">
                          {feeDetails.academic_period.name}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {feeDetails.fee_type.name}
                    </td>
                    <td className="py-3 px-4">
                      {format(new Date(feeDetails.due_date), 'MMM dd, yyyy')}
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      ₹{feeDetails.total_amount.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="bg-muted/20">
                    <td colSpan={3} className="py-2 px-4 text-right font-medium">
                      Total:
                    </td>
                    <td className="py-2 px-4 text-right font-bold">
                      ₹{feeDetails.total_amount.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="font-semibold mb-2">Payment History</h3>
            <div className="border rounded-md overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="py-2 px-4 text-left font-medium text-sm">Date</th>
                    <th className="py-2 px-4 text-left font-medium text-sm">Method</th>
                    <th className="py-2 px-4 text-left font-medium text-sm">Reference</th>
                    <th className="py-2 px-4 text-right font-medium text-sm">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-3 px-4 text-center text-muted-foreground">
                        No payments made yet
                      </td>
                    </tr>
                  ) : (
                    payments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="py-2 px-4">
                          {format(new Date(payment.payment_date), 'MMM dd, yyyy')}
                        </td>
                        <td className="py-2 px-4">
                          {payment.payment_method}
                        </td>
                        <td className="py-2 px-4">
                          {payment.transaction_reference || '-'}
                        </td>
                        <td className="py-2 px-4 text-right font-medium">
                          ₹{payment.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/20">
                    <td colSpan={3} className="py-2 px-4 text-right font-medium">
                      Paid Amount:
                    </td>
                    <td className="py-2 px-4 text-right font-bold text-green-600">
                      ₹{feeDetails.paid_amount.toLocaleString()}
                    </td>
                  </tr>
                  <tr className="bg-muted/20">
                    <td colSpan={3} className="py-2 px-4 text-right font-medium">
                      Remaining Amount:
                    </td>
                    <td className="py-2 px-4 text-right font-bold text-red-600">
                      ₹{feeDetails.remaining_amount.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="font-semibold mb-2">Payment Status</h3>
              <div className="flex items-center">
                {feeDetails.status === 'PAID' ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <span className="font-medium text-green-600">PAID IN FULL</span>
                  </>
                ) : feeDetails.status === 'PARTIAL' ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="font-medium text-blue-600">PARTIALLY PAID</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 text-red-600 mr-2" />
                    <span className="font-medium text-red-600">PENDING</span>
                  </>
                )}
              </div>
            </div>
            <div className="text-right">
              <h3 className="font-semibold mb-2">Due Date</h3>
              <p className="font-medium">
                {format(new Date(feeDetails.due_date), 'MMMM dd, yyyy')}
              </p>
            </div>
          </div>

          <Separator className="my-8" />

          <div className="text-center text-sm text-muted-foreground">
            <p>This is an electronically generated receipt and does not require a physical signature.</p>
            <p className="mt-2">For any queries regarding this receipt, please contact the accounts department.</p>
            <p className="mt-2">Thank you!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeeReceiptPage;