'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast, Toaster } from 'sonner';
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Search, 
  AlertCircle,
  UserPlus
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import StudentSearch from './student-search';
import FeeAssignmentModal from './fee-assignment-modal';
import { 
  Student, 
  FeeType, 
  AcademicPeriod, 
  Batch 
} from './types';

const FeeAssignmentPage = () => {
  const [activeTab, setActiveTab] = useState('individual');
  const [feeTypes, setFeeTypes] = useState<FeeType[] | null>(null);
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[] | null>(null);
  const [batches, setBatches] = useState<Batch[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const supabase = createClient();

        // Fetch fee types
        const { data: feeTypeData, error: feeTypeError } = await supabase
          .from('fee_type')
          .select('*')
          .order('name');
          
        if (feeTypeError) throw feeTypeError;
        setFeeTypes(feeTypeData);
        
        // Fetch academic periods
        const { data: academicPeriodData, error: academicPeriodError } = await supabase
          .from('academic_period')
          .select('*')
          .order('start_date', { ascending: false });
          
        if (academicPeriodError) throw academicPeriodError;
        setAcademicPeriods(academicPeriodData);
        
        // Fetch batches
        const { data: batchData, error: batchError } = await supabase
          .from('batch')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (batchError) throw batchError;
        setBatches(batchData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data', {
          description: 'There was an error loading required data. Please try again.'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    setShowAssignmentModal(true);
  };

  const handleAssignmentComplete = () => {
    setShowAssignmentModal(false);
    setSelectedStudent(null);
    toast.success('Fee assigned successfully', {
      description: 'The fee has been assigned to the selected student.'
    });
  };

  return (
    <>
      <Toaster />
      <div className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push('/protected/fees/collection')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Fee Collection
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Assign Fees</h1>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Fee Assignment</CardTitle>
            <CardDescription>
              Assign fees to students individually or in bulk by batch
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs 
              defaultValue="individual" 
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid grid-cols-2 w-full max-w-md">
                <TabsTrigger value="individual">Individual Student</TabsTrigger>
                <TabsTrigger value="batch">Batch Assignment</TabsTrigger>
              </TabsList>
              
              <TabsContent value="individual" className="pt-4">
                <div className="space-y-4">
                  <div className="bg-muted/40 p-4 rounded-lg">
                    <h3 className="font-medium mb-2">Individual Fee Assignment</h3>
                    <p className="text-sm text-muted-foreground">
                      Search for a student by ID, name, or email, then assign specific fees to them.
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <StudentSearch onSelectStudent={handleStudentSelect} />
                  
                  {selectedStudent && (
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <h3 className="font-medium">Selected Student</h3>
                          <p className="text-sm">{selectedStudent.firstname} {selectedStudent.lastname} (Roll No: {selectedStudent.rollno})</p>
                          <p className="text-xs text-muted-foreground">{selectedStudent.email}</p>
                        </div>
                        <Button 
                          onClick={() => setShowAssignmentModal(true)}
                          className="md:self-end"
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          Assign Fee
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="batch" className="pt-4">
                <div className="space-y-4">
                  <div className="bg-muted/40 p-4 rounded-lg">
                    <h3 className="font-medium mb-2">Batch Fee Assignment</h3>
                    <p className="text-sm text-muted-foreground">
                      Assign fees to all students in a specific batch or academic period at once.
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div className="p-6 border border-dashed rounded-lg flex flex-col items-center justify-center text-center">
                    <UserPlus className="h-8 w-8 text-muted-foreground mb-2" />
                    <h3 className="font-medium mb-1">Batch Assignment Coming Soon</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      This feature is under development. For now, please use the individual assignment option.
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Fee Assignment Tips</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside text-sm space-y-1 mt-1">
              <li>Verify student details before assigning fees to ensure accuracy</li>
              <li>Double-check the fee amount and due date to avoid errors</li>
              <li>Use the batch assignment feature for semester or annual fees</li>
              <li>Communicate fee assignments to students via email for transparency</li>
            </ul>
          </AlertDescription>
        </Alert>
        
        {showAssignmentModal && selectedStudent && feeTypes && (
          <FeeAssignmentModal
            student={selectedStudent}
            feeTypes={feeTypes}
            academicPeriods={academicPeriods || []}
            batches={batches || []}
            onClose={() => {
              setShowAssignmentModal(false);
              setSelectedStudent(null);
            }}
            onAssignmentComplete={handleAssignmentComplete}
          />
        )}
      </div>
    </>
  );
};

export default FeeAssignmentPage;