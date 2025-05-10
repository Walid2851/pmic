'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, BookOpen, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';

// Course type definition
export type Course = {
  id: string;
  name: string;
  instructor: string;
  startDate: string;
  endDate: string;
  status: 'ongoing' | 'finished' | 'upcoming';
  batchId: string;
};

export const columns: ColumnDef<Course>[] = [
  {
    accessorKey: 'name',
    header: 'Course Name',
  },
  {
    accessorKey: 'instructor',
    header: 'Instructor',
  },
  {
    accessorKey: 'startDate',
    header: 'Start Date',
    cell: ({ row }) => {
      const date = new Date(row.getValue('startDate'));
      return <span>{date.toLocaleDateString()}</span>;
    },
  },
  {
    accessorKey: 'endDate',
    header: 'End Date',
    cell: ({ row }) => {
      const date = new Date(row.getValue('endDate'));
      return <span>{date.toLocaleDateString()}</span>;
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      
      return (
        <Badge 
          variant="outline" 
          className={
            status === 'ongoing' 
              ? "bg-green-100 text-green-800 border-green-300" 
              : status === 'upcoming' 
                ? "bg-blue-100 text-blue-800 border-blue-300"
                : "bg-gray-100 text-gray-800 border-gray-300"
          }
        >
          {status}
        </Badge>
      );
    },
  },
  {
    id: 'course_details',
    header: 'Course Details',
    cell: ({ row }) => {
      const course = row.original;
      return (
        <Link
          href={`/courses/${course.id}`}
          className="flex items-center text-blue-500 hover:text-blue-700"
        >
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            Details
            <BookOpen className="h-4 w-4" />
          </Button>
        </Link>
      );
    },
  },
  {
    id: 'schedule',
    header: 'Schedule',
    cell: ({ row }) => {
      const course = row.original;
      return (
        <Link
          href={`/courses/${course.id}/schedule`}
          className="flex items-center text-blue-500 hover:text-blue-700"
        >
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            Schedule
            <Calendar className="h-4 w-4" />
          </Button>
        </Link>
      );
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    enableHiding: false,
    cell: ({ row }) => {
      const course = row.original;
      const [isDeleting, setIsDeleting] = React.useState(false);

      const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this course?')) {
          setIsDeleting(true);
          const supabase = createClient();

          try {
            const { error } = await supabase
              .from('course')
              .delete()
              .eq('id', course.id);

            if (error) throw error;

            toast.success('Course deleted successfully');
            // You might want to refresh the data here
          } catch (error) {
            console.error('Error deleting course:', error);
            toast.error('Failed to delete course');
          } finally {
            setIsDeleting(false);
          }
        }
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/courses/${course.id}/edit`}>
                Edit Course
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/courses/${course.id}/materials`}>
                Course Materials
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-red-600"
            >
              Delete Course
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];