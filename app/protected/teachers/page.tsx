'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { DataTable } from './data-table';
import { columns } from './column';
import CreateTeacherForm from './create_teacher';
import ScrollButton from '@/components/ScrollButton';
import { useRouter } from 'next/navigation';

type Teacher = {
  instructorID: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  specialization: string;
  isActive: boolean;
  JoinDate: string;
};

const TeacherManagementPage = () => {
  const [teacherList, setTeacherList] = useState<Teacher[] | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const fetchTeachers = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          router.push('/sign-in');
          return;
        }

        const { data, error } = await supabase
          .from('teacher')
          .select('*')
          .order('JoinDate', { ascending: false });

        if (error) {
          console.error('Error fetching teachers:', error);
          setTeacherList(null);
        } else {
          setTeacherList(data);
        }
      } catch (error) {
        console.error('Unexpected error:', error);
        setTeacherList(null);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchTeachers();

    // Set up real-time subscription
    const channel = supabase
      .channel('teacher-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'teacher'
        },
        () => {
          fetchTeachers();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      channel.unsubscribe();
    };
  }, [router]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <p className="text-lg">Loading teacher data...</p>
      </div>
    );
  }

  if (!teacherList) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <p className="text-lg">No Teachers found</p>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-accent rounded-lg shadow-sm mb-8">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h1 className="text-2xl font-semibold">
              Teacher Management
            </h1>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg shadow-sm mb-8 overflow-hidden">
        <div className="p-6">
          <DataTable columns={columns} data={teacherList} />
        </div>
      </div>

      <div id="addTeacherForm" className="bg-card rounded-lg shadow-sm">
        <div className="p-6">
          <CreateTeacherForm />
        </div>
      </div>
    </div>
  );
};

export default TeacherManagementPage;