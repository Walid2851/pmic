'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { DataTable } from './data-table';
import { columns } from './column';
import CreateCourseFormGO from './create_course';
import ScrollButton from '@/components/ScrollButton';
import { useRouter } from 'next/navigation';

type Course = {
    CourseID: number;
    CourseCode: string;
    CourseTitle: string;
    Credits: number;
    SemesterNo: number;
    CourseType: string;
    IsActive: boolean;
    Description: string | null;
    Prerequisites: string | null;
    CreatedAt: string;
};

const CourseManagementPage = () => {
    const [courseList, setCourseList] = useState<Course[] | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const supabase = createClient();
                const { data: { user }, error: authError } = await supabase.auth.getUser();

                if (authError || !user) {
                    router.push('/sign-in');
                    return;
                }

                const { data, error } = await supabase
                    .from('course')
                    .select('*')
                    .order('CreatedAt', { ascending: false });

                if (error) {
                    console.error('Error fetching courses:', error);
                    setCourseList(null);
                } else {
                    setCourseList(data);
                }
            } catch (error) {
                console.error('Unexpected error:', error);
                setCourseList(null);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();

        const supabase = createClient();
        const channel = supabase
            .channel('course-changes')
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'course'
                },
                () => {
                    fetchCourses();
                }
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [router]);

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[400px]">
                <p className="text-lg">Loading course data...</p>
            </div>
        );
    }

    if (!courseList) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[400px]">
                <p className="text-lg">No courses found</p>
            </div>
        );
    }

    return (
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header Section */}
            <div className="bg-accent rounded-lg shadow-sm mb-8">
                <div className="p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <h1 className="text-2xl font-semibold">
                            Course Management
                        </h1>
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-card rounded-lg shadow-sm mb-8 overflow-hidden">
                <div className="p-6">
                    <DataTable columns={columns} data={courseList} />
                </div>
            </div>

    
                    <CreateCourseFormGO/>
                

       
        </div>
    );
};

export default CourseManagementPage;