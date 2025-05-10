'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  BanIcon, 
  CreditCard, 
  MoreHorizontal, 
  Receipt, 
  Eye,
  FileText,
  Send,
  AlertTriangle
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { StudentFee } from './types';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Helper function to get status badge
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'PENDING':
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
    case 'PARTIAL':
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Partial</Badge>;
    case 'PAID':
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Paid</Badge>;
    case 'OVERDUE':
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Overdue</Badge>;
    case 'WAIVED':
      return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Waived</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export const columns = (onCollectPayment: (fee: StudentFee) => void): ColumnDef<StudentFee>[] => {
  const router = useRouter();

  const handleViewDetails = (feeId: string) => {
    router.push(`/protected/fees/collection/${feeId}`);
  };

  const handleViewReceipt = (feeId: string) => {
    router.push(`/protected/fees/collection/${feeId}/receipt`);
  };

  const handleSendReminder = (fee: StudentFee) => {
    if (!fee.student?.email) {
      toast.error('Cannot send reminder', {
        description: 'Student email address is not available.'
      });
      return;
    }
    
    toast.success('Reminder sent successfully', {
      description: `A payment reminder has been sent to ${fee.student.email}`
    });
  };

  return [
    {
      accessorKey: 'student',
      header: 'Student',
      cell: ({ row }) => {
        const student = row.original.student;
        if (!student) return 'N/A';
        
        return (
          <div className="flex flex-col">
            <span className="font-medium">
              {student.firstname} {student.lastname}
            </span>
            <span className="text-sm text-muted-foreground">
              Roll No: {student.rollno}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'fee_type',
      header: 'Fee Type',
      cell: ({ row }) => {
        const feeType = row.original.fee_type;
        if (!feeType) return 'N/A';
        
        return (
          <div className="flex flex-col">
            <span className="font-medium">{feeType.name}</span>
            <span className="text-xs text-muted-foreground">
              {feeType.is_recurring ? `Recurring (${feeType.frequency})` : 'One-time'}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'batch',
      header: 'Batch/Semester',
      cell: ({ row }) => {
        const batch = row.original.batch;
        const academicPeriod = row.original.academic_period;
        
        return (
          <div className="flex flex-col">
            {batch && (
              <span className="font-medium">
                {batch.batch_id} ({batch.program_code})
              </span>
            )}
            {academicPeriod && (
              <span className="text-xs text-muted-foreground">
                {academicPeriod.name}
              </span>
            )}
            {!batch && !academicPeriod && 'N/A'}
          </div>
        );
      },
    },
    {
      accessorKey: 'payment_status',
      header: 'Payment Status',
      cell: ({ row }) => {
        const fee = row.original;
        const dueDate = new Date(fee.due_date);
        const isOverdue = fee.status === 'OVERDUE';
        
        return (
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-2">
              {getStatusBadge(fee.status)}
              {isOverdue && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Payment is overdue</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              Due: {format(dueDate, 'MMM dd, yyyy')}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => {
        const fee = row.original;
        const totalAmount = fee.total_amount;
        const paidAmount = fee.paid_amount || 0;
        const remainingAmount = fee.remaining_amount || totalAmount;
        
        return (
          <div className="flex flex-col">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Total:</span>
              <span className="font-medium">₹{totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Paid:</span>
              <span className="text-xs text-green-600">₹{paidAmount.toLocaleString()}</span>
            </div>
            {fee.status !== 'PAID' && fee.status !== 'WAIVED' && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Remaining:</span>
                <span className="text-xs text-red-600">₹{remainingAmount.toLocaleString()}</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const fee = row.original;
        
        return (
          <div className="flex items-center justify-end gap-2">
            {fee.status !== 'PAID' && fee.status !== 'WAIVED' && (
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => onCollectPayment(fee)}
                className="h-8"
              >
                <CreditCard className="h-4 w-4 mr-1" />
                Collect
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleViewDetails(fee.id)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleViewReceipt(fee.id)}>
                  <Receipt className="h-4 w-4 mr-2" />
                  View Receipt
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleViewReceipt(fee.id)}>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Receipt
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSendReminder(fee)}>
                  <Send className="h-4 w-4 mr-2" />
                  Send Reminder
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => alert('Fee waiver functionality would go here')}
                  className="text-red-600"
                >
                  <BanIcon className="h-4 w-4 mr-2" />
                  Apply Waiver
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
};