'use client';
import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ExternalLink, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';

// Define the Batch type if not using Prisma
type Batch = {
  id: string;
  batch_id: string;
  intake_session: string;
  number_of_students: number;
  program_code: string;
  created_at: string;
  updated_at: string;
};

export const columns: ColumnDef<Batch>[] = [
  {
    accessorKey: 'batch_id',
    header: 'Batch ID',
  },
  {
    accessorKey: 'intake_session',
    header: 'Intake Session',
  },
  {
    accessorKey: 'program_code',
    header: 'Program',
  },
  {
    accessorKey: 'number_of_students',
    header: 'Students',
  },
  {
    id: 'batch_info',
    header: 'Batch Info',
    cell: ({ row }) => {
      const batch = row.original;
      return (
        <Link
          href={`protected/${batch.id}/info`}
          className="flex items-center text-blue-500 hover:text-blue-700"
        >
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            Batch Info
            <Info className="h-4 w-4" />
          </Button>
        </Link>
      );
    },
  },
  {
    id: 'view_students',
    header: 'Student Details',
    cell: ({ row }) => {
      const batch = row.original;
      return (
        <Link
          href={`protected/${batch.id}/students`}
          className="flex items-center text-blue-500 hover:text-blue-700"
        >
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            View Students
            <ExternalLink className="h-4 w-4" />
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
      const batch = row.original;
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
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(batch.batch_id)}
            >
              Copy Batch ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/batches/${batch.id}/edit`}>
                Update Batch Info
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/batches/${batch.id}/students`}>
                Manage Students
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              Delete Batch
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];