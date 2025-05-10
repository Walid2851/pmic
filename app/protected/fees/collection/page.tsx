'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast, Toaster } from 'sonner';
import { DataTable } from './data-table';
import { columns } from './column'; // Note: Make sure the filename is correct
import { Button } from '@/components/ui/button';
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertCircle, 
  CreditCard, 
  Download, 
  FileText, 
  Filter 
} from 'lucide-react';
import FeeCollectionFilters from './fee-collection-filters';
import PaymentModal from './payment-modal';
import { Badge } from '@/components/ui/badge';
import { format, isBefore, isAfter } from 'date-fns';
import { 
  StudentFee, 
  Student, 
  FeeType, 
  AcademicPeriod, 
  Batch, 
  Payment, 
  FeeFilters 
} from './types';

const FeeCollectionPage = () => {
  const [studentFees, setStudentFees] = useState<StudentFee[] | null>(null);
  const [filteredStudentFees, setFilteredStudentFees] = useState<StudentFee[] | null>(null);
  const [batches, setBatches] = useState<Batch[] | null>(null);
  const [feeTypes, setFeeTypes] = useState<FeeType[] | null>(null);
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState<StudentFee | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch batches
        const { data: batchData, error: batchError } = await supabase
          .from('batch')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (batchError) throw batchError;
        if (isMounted) setBatches(batchData);
        
        // Fetch fee types
        const { data: feeTypeData, error: feeTypeError } = await supabase
          .from('fee_type')
          .select('*')
          .order('name');
          
        if (feeTypeError) throw feeTypeError;
        if (isMounted) setFeeTypes(feeTypeData);
        
        // Fetch academic periods
        const { data: academicPeriodData, error: academicPeriodError } = await supabase
          .from('academic_period')
          .select('*')
          .order('start_date', { ascending: false });
          
        if (academicPeriodError) throw academicPeriodError;
        if (isMounted) setAcademicPeriods(academicPeriodData);
        
        // Fetch student fees with related data
        const { data: studentFeeData, error: studentFeeError } = await supabase
          .from('student_fee')
          .select(`
            *,
            student:student_id(studentid, rollno, firstname, lastname, email, phone, isactive, batchid),
            fee_type:fee_type_id(*),
            academic_period:academic_period_id(*),
            batch:batch_id(*)
          `)
          .order('due_date', { ascending: false });
          
        if (studentFeeError) throw studentFeeError;
        
        // Fetch payments for each student fee
        const studentFeesWithPayments = await Promise.all(
          studentFeeData.map(async (fee) => {
            const { data: payments, error: paymentsError } = await supabase
              .from('payment')
              .select('*')
              .eq('student_fee_id', fee.id)
              .order('payment_date', { ascending: false });
              
            if (paymentsError) {
              console.error(`Error fetching payments for fee ${fee.id}:`, paymentsError);
              return {
                ...fee,
                payments: [],
                paid_amount: 0,
                remaining_amount: fee.total_amount
              };
            }
            
            const paidAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
            const remainingAmount = fee.total_amount - paidAmount;
            
            // Check if the status needs to be updated
            let status = fee.status;
            const currentDate = new Date();
            const dueDate = new Date(fee.due_date);
            
            if (paidAmount === 0 && currentDate > dueDate && status === 'PENDING') {
              status = 'OVERDUE';
              // Update status in DB
              await supabase
                .from('student_fee')
                .update({ status: 'OVERDUE' })
                .eq('id', fee.id);
            } else if (paidAmount > 0 && paidAmount < fee.total_amount && status !== 'PARTIAL') {
              status = 'PARTIAL';
              // Update status in DB
              await supabase
                .from('student_fee')
                .update({ status: 'PARTIAL' })
                .eq('id', fee.id);
            } else if (paidAmount >= fee.total_amount && status !== 'PAID') {
              status = 'PAID';
              // Update status in DB
              await supabase
                .from('student_fee')
                .update({ status: 'PAID' })
                .eq('id', fee.id);
            }
            
            return {
              ...fee,
              status,
              payments,
              paid_amount: paidAmount,
              remaining_amount: remainingAmount
            };
          })
        );
        
        if (isMounted) {
          setStudentFees(studentFeesWithPayments);
          setFilteredStudentFees(studentFeesWithPayments);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchData();
    
    // Set up real-time subscriptions
    const feeChannel = supabase
      .channel('student-fees-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'student_fee'
        },
        () => fetchData()
      )
      .subscribe();
      
    const paymentChannel = supabase
      .channel('payments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payment'
        },
        () => fetchData()
      )
      .subscribe();
      
    return () => {
      isMounted = false;
      feeChannel.unsubscribe();
      paymentChannel.unsubscribe();
    };
  }, []);
  
  useEffect(() => {
    if (!studentFees) return;
    
    let filtered = [...studentFees];
    
    // Apply tab filters
    if (activeTab === 'pending') {
      filtered = filtered.filter(fee => fee.status === 'PENDING');
    } else if (activeTab === 'partial') {
      filtered = filtered.filter(fee => fee.status === 'PARTIAL');
    } else if (activeTab === 'paid') {
      filtered = filtered.filter(fee => fee.status === 'PAID');
    } else if (activeTab === 'overdue') {
      filtered = filtered.filter(fee => fee.status === 'OVERDUE');
    } else if (activeTab === 'waived') {
      filtered = filtered.filter(fee => fee.status === 'WAIVED');
    }
    
    setFilteredStudentFees(filtered);
  }, [studentFees, activeTab]);
  
  const handleFilterChange = (filters: FeeFilters) => {
    if (!studentFees) return;
    
    let filtered = [...studentFees];
    
    // Apply tab filters first
    if (activeTab === 'pending') {
      filtered = filtered.filter(fee => fee.status === 'PENDING');
    } else if (activeTab === 'partial') {
      filtered = filtered.filter(fee => fee.status === 'PARTIAL');
    } else if (activeTab === 'paid') {
      filtered = filtered.filter(fee => fee.status === 'PAID');
    } else if (activeTab === 'overdue') {
      filtered = filtered.filter(fee => fee.status === 'OVERDUE');
    } else if (activeTab === 'waived') {
      filtered = filtered.filter(fee => fee.status === 'WAIVED');
    }
    
    // Apply search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(fee => 
        fee.student?.firstname.toLowerCase().includes(searchLower) ||
        fee.student?.lastname.toLowerCase().includes(searchLower) ||
        fee.student?.email.toLowerCase().includes(searchLower) ||
        String(fee.student?.rollno).includes(searchLower) ||
        fee.fee_type?.name.toLowerCase().includes(searchLower) ||
        fee.description?.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply batch filter
    if (filters.batchId !== 'all') {
      filtered = filtered.filter(fee => fee.batch_id === filters.batchId);
    }
    
    // Apply fee type filter
    if (filters.feeTypeId !== 'all') {
      filtered = filtered.filter(fee => fee.fee_type_id === filters.feeTypeId);
    }
    
    // Apply academic period filter
    if (filters.academicPeriodId !== 'all') {
      filtered = filtered.filter(fee => fee.academic_period_id === filters.academicPeriodId);
    }
    
    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(fee => fee.status === filters.status);
    }
    
    // Apply due date range filter
    if (filters.dueDateRange[0] || filters.dueDateRange[1]) {
      filtered = filtered.filter(fee => {
        const feeDate = new Date(fee.due_date);
        
        if (filters.dueDateRange[0] && filters.dueDateRange[1]) {
          return isAfter(feeDate, filters.dueDateRange[0]) && 
                 isBefore(feeDate, filters.dueDateRange[1]);
        } else if (filters.dueDateRange[0]) {
          return isAfter(feeDate, filters.dueDateRange[0]);
        } else if (filters.dueDateRange[1]) {
          return isBefore(feeDate, filters.dueDateRange[1]);
        }
        
        return true;
      });
    }
    
    setFilteredStudentFees(filtered);
  };
  
  const handleCollectPayment = (fee: StudentFee) => {
    setSelectedFee(fee);
    setShowPaymentModal(true);
  };
  
  const handlePaymentComplete = async () => {
    setShowPaymentModal(false);
    setSelectedFee(null);
    
    // Refresh data
    const supabase = createClient();
    
    try {
      // Fetch student fees with related data
      const { data: studentFeeData, error: studentFeeError } = await supabase
        .from('student_fee')
        .select(`
          *,
          student:student_id(studentid, rollno, firstname, lastname, email, phone, isactive, batchid),
          fee_type:fee_type_id(*),
          academic_period:academic_period_id(*),
          batch:batch_id(*)
        `)
        .order('due_date', { ascending: false });
        
      if (studentFeeError) {
        console.error('Error fetching data after payment:', studentFeeError);
        return;
      }
      
      // Fetch payments for each student fee
      const studentFeesWithPayments = await Promise.all(
        studentFeeData.map(async (fee) => {
          const { data: payments, error: paymentsError } = await supabase
            .from('payment')
            .select('*')
            .eq('student_fee_id', fee.id)
            .order('payment_date', { ascending: false });
            
          if (paymentsError) {
            console.error(`Error fetching payments for fee ${fee.id}:`, paymentsError);
            return {
              ...fee,
              payments: [],
              paid_amount: 0,
              remaining_amount: fee.total_amount
            };
          }
          
          const paidAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
          const remainingAmount = fee.total_amount - paidAmount;
          
          return {
            ...fee,
            payments,
            paid_amount: paidAmount,
            remaining_amount: remainingAmount
          };
        })
      );
      
      setStudentFees(studentFeesWithPayments);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };
  
  const handleExportData = () => {
    if (!filteredStudentFees || filteredStudentFees.length === 0) return;
    
    setIsExporting(true);
    
    try {
      const exportData = filteredStudentFees.map(fee => ({
        'Student ID': fee.student?.studentid,
        'Roll Number': fee.student?.rollno,
        'Student Name': `${fee.student?.firstname} ${fee.student?.lastname}`,
        'Email': fee.student?.email,
        'Fee Type': fee.fee_type?.name,
        'Academic Period': fee.academic_period?.name || 'N/A',
        'Batch': fee.batch?.batch_id || 'N/A',
        'Total Amount': fee.total_amount,
        'Paid Amount': fee.paid_amount || 0,
        'Remaining Amount': fee.remaining_amount || 0,
        'Due Date': fee.due_date,
        'Status': fee.status
      }));
      
      const csvContent = 'data:text/csv;charset=utf-8,' + 
        [
          Object.keys(exportData[0]).join(','),
          ...exportData.map(row => Object.values(row).join(','))
        ].join('\n');
        
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `fee_collection_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data', { 
        description: 'There was an error generating the CSV file.' 
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  const getSummaryData = () => {
    if (!filteredStudentFees) return null;
    
    const total = filteredStudentFees.length;
    const pending = filteredStudentFees.filter(fee => fee.status === 'PENDING').length;
    const partial = filteredStudentFees.filter(fee => fee.status === 'PARTIAL').length;
    const paid = filteredStudentFees.filter(fee => fee.status === 'PAID').length;
    const overdue = filteredStudentFees.filter(fee => fee.status === 'OVERDUE').length;
    const waived = filteredStudentFees.filter(fee => fee.status === 'WAIVED').length;
    
    const totalAmount = filteredStudentFees.reduce((sum, fee) => sum + fee.total_amount, 0);
    const paidAmount = filteredStudentFees.reduce((sum, fee) => sum + (fee.paid_amount || 0), 0);
    const remainingAmount = filteredStudentFees.reduce((sum, fee) => sum + (fee.remaining_amount || 0), 0);
    
    return {
      total,
      pending,
      partial,
      paid,
      overdue,
      waived,
      totalAmount,
      paidAmount,
      remainingAmount
    };
  };
  
  const summaryData = getSummaryData();
  
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <p className="text-lg">Loading fee data...</p>
      </div>
    );
  }
  
  return (
    <>
      <Toaster />
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Fee Collection</h1>
              <p className="text-muted-foreground mt-1">
                Manage and collect student fees across all batches and programs
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline"
                onClick={handleExportData}
                disabled={isExporting || !filteredStudentFees || filteredStudentFees.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                {isExporting ? 'Exporting...' : 'Export Data'}
              </Button>
              <Button asChild>
                <a href="/reports/fee-collection" target="_blank">
                  <FileText className="mr-2 h-4 w-4" />
                  Fee Reports
                </a>
              </Button>
            </div>
          </div>
        </div>
        
        {summaryData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Collection Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Amount:</span>
                    <span className="font-medium">₹{summaryData.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Collected:</span>
                    <span className="font-medium text-green-600">₹{summaryData.paidAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Remaining:</span>
                    <span className="font-medium text-red-600">₹{summaryData.remainingAmount.toLocaleString()}</span>
                  </div>
                  <div className="pt-2">
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary" 
                        style={{ 
                          width: `${summaryData.totalAmount ? (summaryData.paidAmount / summaryData.totalAmount) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 text-right">
                      {summaryData.totalAmount ? Math.round((summaryData.paidAmount / summaryData.totalAmount) * 100) : 0}% collected
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Fee Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-yellow-50">
                      <span className="h-2 w-2 rounded-full bg-yellow-500 mr-1"></span>
                      Pending
                    </Badge>
                    <span className="font-medium">{summaryData.pending}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-blue-50">
                      <span className="h-2 w-2 rounded-full bg-blue-500 mr-1"></span>
                      Partial
                    </Badge>
                    <span className="font-medium">{summaryData.partial}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-50">
                      <span className="h-2 w-2 rounded-full bg-green-500 mr-1"></span>
                      Paid
                    </Badge>
                    <span className="font-medium">{summaryData.paid}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-red-50">
                      <span className="h-2 w-2 rounded-full bg-red-500 mr-1"></span>
                      Overdue
                    </Badge>
                    <span className="font-medium">{summaryData.overdue}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start" 
                    onClick={() => router.push('/admin/fee-types')}
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    Manage Fee Types
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => router.push('/admin/fee-assignment')}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Assign Fees to Students
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        <Tabs
          defaultValue="all"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full mb-6"
        >
          <TabsList className="grid grid-cols-6 w-full max-w-4xl">
            <TabsTrigger value="all" className="text-xs md:text-sm">All Fees</TabsTrigger>
            <TabsTrigger value="pending" className="text-xs md:text-sm">Pending</TabsTrigger>
            <TabsTrigger value="partial" className="text-xs md:text-sm">Partial</TabsTrigger>
            <TabsTrigger value="paid" className="text-xs md:text-sm">Paid</TabsTrigger>
            <TabsTrigger value="overdue" className="text-xs md:text-sm">Overdue</TabsTrigger>
            <TabsTrigger value="waived" className="text-xs md:text-sm">Waived</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-4">
            <FeeCollectionFilters 
              batches={batches}
              feeTypes={feeTypes}
              academicPeriods={academicPeriods}
              onFilterChange={handleFilterChange}
            />
          </TabsContent>
          <TabsContent value="pending" className="mt-4">
            <FeeCollectionFilters 
              batches={batches}
              feeTypes={feeTypes}
              academicPeriods={academicPeriods}
              onFilterChange={handleFilterChange}
            />
          </TabsContent>
          <TabsContent value="partial" className="mt-4">
            <FeeCollectionFilters 
              batches={batches}
              feeTypes={feeTypes}
              academicPeriods={academicPeriods}
              onFilterChange={handleFilterChange}
            />
          </TabsContent>
          <TabsContent value="paid" className="mt-4">
            <FeeCollectionFilters 
              batches={batches}
              feeTypes={feeTypes}
              academicPeriods={academicPeriods}
              onFilterChange={handleFilterChange}
            />
          </TabsContent>
          <TabsContent value="overdue" className="mt-4">
            <FeeCollectionFilters 
              batches={batches}
              feeTypes={feeTypes}
              academicPeriods={academicPeriods}
              onFilterChange={handleFilterChange}
            />
          </TabsContent>
          <TabsContent value="waived" className="mt-4">
            <FeeCollectionFilters 
              batches={batches}
              feeTypes={feeTypes}
              academicPeriods={academicPeriods}
              onFilterChange={handleFilterChange}
            />
          </TabsContent>
        </Tabs>
        
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {!filteredStudentFees || filteredStudentFees.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12">
                <div className="text-center max-w-md space-y-4">
                  {studentFees && studentFees.length > 0 ? (
                    <>
                      <h3 className="text-lg font-semibold">No matching fees</h3>
                      <p className="text-muted-foreground">
                        No fees match your current filters. Try adjusting your search criteria.
                      </p>
                      <Button variant="outline" onClick={() => {
                        setActiveTab('all');
                        handleFilterChange({
                          search: '',
                          batchId: 'all',
                          feeTypeId: 'all',
                          academicPeriodId: 'all',
                          status: 'all',
                          dueDateRange: [null, null],
                        });
                      }}>
                        Reset Filters
                      </Button>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold">No fees found</h3>
                      <p className="text-muted-foreground">
                        There are no student fees in the system. Assign fees to students to get started.
                      </p>
                      <Button onClick={() => router.push('/admin/fee-assignment')}>
                        Assign Fees to Students
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <DataTable 
                columns={columns(handleCollectPayment)} 
                data={filteredStudentFees}
              />
            )}
          </CardContent>
        </Card>
        
        <div className="bg-muted/40 rounded-lg p-4 mt-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Fee Collection Tips</AlertTitle>
            <AlertDescription>
              Regularly check for overdue payments and send reminders to students.
              Use the export feature to generate reports for finance department.
              Update fee status immediately after receiving payments to maintain accurate records.
            </AlertDescription>
          </Alert>
        </div>
        
        {showPaymentModal && selectedFee && (
          <PaymentModal
            studentFee={selectedFee}
            onClose={() => {
              setShowPaymentModal(false);
              setSelectedFee(null);
            }}
            onPaymentComplete={handlePaymentComplete}
          />
        )}
      </div>
    </>
  );
};

export default FeeCollectionPage;