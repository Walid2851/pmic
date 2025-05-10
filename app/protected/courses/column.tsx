'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ExternalLink } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';

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

export const columns: ColumnDef<Course>[] = [
    {
        accessorKey: 'CourseCode',
        header: 'Code',
    },
    {
        accessorKey: 'CourseTitle',
        header: 'Title',
    },
    {
        accessorKey: 'Credits',
        header: 'Credits',
    },
    {
        accessorKey: 'SemesterNo',
        header: 'Semester',
    },
    {
        accessorKey: 'CourseType',
        header: 'Type',
        cell: ({ row }) => {
            const courseType = row.getValue('CourseType') as string;
            return (
                <Badge variant="outline">
                    {courseType}
                </Badge>
            );
        },
    },
    {
        accessorKey: 'IsActive',
        header: 'Status',
        cell: ({ row }) => {
            const isActive = row.getValue('IsActive') as boolean;
            return (
                <Badge 
                    variant="default" 
                    className={isActive ? "bg-green-500 hover:bg-green-600" : ""}
                >
                    {isActive ? 'Active' : 'Inactive'}
                </Badge>
            );
        },
    },
    {
        id: 'view_details',
        header: 'Course Details',
        cell: ({ row }) => {
            const course = row.original;
            return (
                <Link
                    href={`/protected/courses/${course.CourseID}/details`}
                    className="flex items-center text-blue-500 hover:text-blue-700"
                >
                    <Button variant="ghost" size="sm" className="flex items-center gap-2">
                        View Details
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
            const course = row.original;
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
                            onClick={() => navigator.clipboard.writeText(course.CourseCode)}
                        >
                            Copy Course Code
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href={`/courses/${course.CourseID}/edit`}>
                                Edit Course
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => {
                                // Toggle active status
                                // Implementation needed
                            }}
                        >
                            {course.IsActive ? 'Deactivate Course' : 'Activate Course'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                                // Delete course
                                // Implementation needed
                            }}
                        >
                            Delete Course
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];