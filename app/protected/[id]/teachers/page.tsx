'use client';

import { useEffect, useState, use } from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { DataTable } from './data-table';
import { columns } from './column';
import { AddStudentForm } from './create_student';
import { Skeleton } from '@/components/ui/skeleton';
import { Toaster } from 'sonner';

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

type BatchInfo = {
  batch_id: string;
  intake_session: string;
  program_code: string;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default function BatchStudentsPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const [students, setStudents] = useState<Student[]>([]);
  const [batchInfo, setBatchInfo] = useState<BatchInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // If no ID is provided, show 404
  if (!resolvedParams.id) {
    notFound();
  }

  const fetchBatchInfo = async () => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('batch')
        .select('batch_id, intake_session, program_code')
        .eq('id', resolvedParams.id)
        .single();

      if (error) throw error;
      setBatchInfo(data);
    } catch (error) {
      console.error('Error fetching batch info:', error);
    }
  };

  const fetchStudents = async () => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('student')
        .select('*')
        .eq('batchid', resolvedParams.id)
        .order('rollno', { ascending: true });

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBatchInfo();
    fetchStudents();
  }, [resolvedParams.id]);

  const handleStudentAdded = () => {
    setIsAddDialogOpen(false);
    fetchStudents();
  };

  return (
    <>
      <Toaster />
      <div className="container mx-auto py-8 space-y-8">
        {/* Batch Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle>Batch Information</CardTitle>
                {isLoading ? (
                  <Skeleton className="h-4 w-48" />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {batchInfo?.batch_id} - {batchInfo?.program_code}
                  </p>
                )}
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Student
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Add New Student</DialogTitle>
                  </DialogHeader>
                  <AddStudentForm 
                    batchId={resolvedParams.id}
                    onSuccess={handleStudentAdded}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Intake Session</dt>
                <dd className="text-2xl font-bold">
                  {isLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    batchInfo?.intake_session
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Program</dt>
                <dd className="text-2xl font-bold">
                  {isLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    batchInfo?.program_code
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Total Students</dt>
                <dd className="text-2xl font-bold">
                  {isLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    students.length
                  )}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Students Table Card */}
        <Card>
          <CardHeader>
            <CardTitle>Students List</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <DataTable 
                columns={columns} 
                data={students}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}