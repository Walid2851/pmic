'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil } from 'lucide-react';
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
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { EditStudentModal } from './student_modal';

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

export const columns_1: ColumnDef<Student>[] = [
  {
    accessorKey: 'studentid',
    header: 'Student ID',
  },
  {
    accessorKey: 'rollno',
    header: 'Roll No',
  },
  {
    accessorFn: row => `${row.firstname} ${row.lastname}`,
    header: 'Name',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'phone',
    header: 'Phone',
    cell: ({ row }) => {
      return row.original.phone || 'N/A';
    },
  },
  {
    accessorKey: 'workexperience',
    header: 'Experience',
    cell: ({ row }) => {
      const months = row.original.workexperience;
      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;
      return (
        <span>
          {years > 0 ? `${years}y ` : ''}{remainingMonths}m
        </span>
      );
    },
  },
  {
    accessorKey: 'isactive',
    header: 'Status',
    cell: ({ row }) => {
      const isActive = row.original.isactive;
      return (
        <Badge 
          variant="default" 
          className={isActive ? "bg-green-500 hover:bg-green-600" : ""}
        >
          {isActive ? "Active" : "Inactive"}
        </Badge>
      );
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    enableHiding: false,
    cell: ({ row }) => {
      const student = row.original;
      const [isDeleting, setIsDeleting] = React.useState(false);

      const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this student?')) {
          setIsDeleting(true);
          const supabase = createClient();

          try {
            const { error } = await supabase
              .from('student')
              .delete()
              .eq('studentid', student.studentid);

            if (error) throw error;

            toast.success('Student deleted successfully');
            // You might want to refresh the data here
          } catch (error) {
            console.error('Error deleting student:', error);
            toast.error('Failed to delete student');
          } finally {
            setIsDeleting(false);
          }
        }
      };

      const handleCopyEmail = () => {
        navigator.clipboard.writeText(student.email);
        toast.success('Email copied to clipboard');
      };

      const handleToggleStatus = async () => {
        const supabase = createClient();

        try {
          const { error } = await supabase
            .from('student')
            .update({ isactive: !student.isactive })
            .eq('studentid', student.studentid);

          if (error) throw error;

          toast.success(`Student ${student.isactive ? 'deactivated' : 'activated'} successfully`);
          // You might want to refresh the data here
        } catch (error) {
          console.error('Error updating student status:', error);
          toast.error('Failed to update student status');
        }
      };

      return (
        <div className="flex items-center gap-2">
          <EditStudentModal student={student} />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={handleCopyEmail}>
                Copy Email
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleToggleStatus}>
                {student.isactive ? 'Deactivate Student' : 'Activate Student'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-red-600"
              >
                Delete Student
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];