'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Edit, ToggleLeft, ToggleRight } from 'lucide-react';
import { format } from 'date-fns';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import EditFeeTypeModal from './edit-fee-type-modal';

type FeeComponent = {
  id: string;
  fee_type_id: string;
  name: string;
  description: string | null;
  amount: number;
  is_optional: boolean;
  is_active: boolean;
}

type FeeType = {
  id: string;
  name: string;
  description: string | null;
  is_recurring: boolean;
  frequency: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  components?: FeeComponent[];
  total_amount?: number;
}

// Component for displaying fee components in a dialog
const FeeComponentsList = ({ components }: { components?: FeeComponent[] }) => {
  if (!components || components.length === 0) {
    return <p className="text-center py-4">No components found</p>;
  }

  return (
    <div className="overflow-y-auto max-h-96">
      <table className="w-full border-collapse">
        <thead className="bg-muted">
          <tr>
            <th className="text-left p-2 border">Component</th>
            <th className="text-left p-2 border">Description</th>
            <th className="text-right p-2 border">Amount</th>
            <th className="text-center p-2 border">Optional</th>
            <th className="text-center p-2 border">Status</th>
          </tr>
        </thead>
        <tbody>
          {components.map((component) => (
            <tr key={component.id} className="border-b">
              <td className="p-2 border">{component.name}</td>
              <td className="p-2 border">{component.description || 'N/A'}</td>
              <td className="p-2 border text-right">${component.amount.toFixed(2)}</td>
              <td className="p-2 border text-center">
                {component.is_optional ? 
                  <Badge variant="outline">Optional</Badge> : 
                  <Badge variant="secondary">Required</Badge>
                }
              </td>
              <td className="p-2 border text-center">
                {component.is_active ? 
                  <Badge variant="default">Active</Badge> : 
                  <Badge variant="destructive">Inactive</Badge>
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const columns: ColumnDef<FeeType>[] = [
  {
    accessorKey: 'name',
    header: 'Fee Type',
    cell: ({ row }) => {
      const feeType = row.original;
      return (
        <div>
          <div className="font-medium">{feeType.name}</div>
          {feeType.description && (
            <div className="text-sm text-muted-foreground truncate max-w-md">{feeType.description}</div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'total_amount',
    header: 'Total Amount',
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('total_amount') || '0');
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
      
      return (
        <div className="text-right font-medium">{formatted}</div>
      );
    },
  },
  {
    accessorKey: 'is_recurring',
    header: 'Type',
    cell: ({ row }) => {
      const isRecurring = row.getValue('is_recurring');
      const frequency = row.original.frequency;
      
      return (
        <div className="flex justify-center">
          {isRecurring ? (
            <Badge variant="outline" className="capitalize">
              {frequency || 'Recurring'}
            </Badge>
          ) : (
            <Badge variant="secondary">One-time</Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'is_active',
    header: 'Status',
    cell: ({ row }) => {
      const isActive = row.getValue('is_active');
      
      return (
        <div className="flex justify-center">
          {isActive ? (
            <Badge>Active</Badge>
          ) : (
            <Badge variant="destructive">Inactive</Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Created',
    cell: ({ row }) => {
      const date = new Date(row.getValue('created_at'));
      return <div>{format(date, 'MMM d, yyyy')}</div>;
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const feeType = row.original;
      
      // State for dialog
      const [open, setOpen] = useState(false);
      
      // Toggle active status
      const toggleStatus = async () => {
        const supabase = createClient();
        
        const { error } = await supabase
          .from('fee_type')
          .update({ is_active: !feeType.is_active })
          .eq('id', feeType.id);
          
        if (error) {
          toast.error(`Error: ${error.message}`);
        } else {
          toast.success(`Fee type ${feeType.is_active ? 'deactivated' : 'activated'} successfully!`);
        }
      };
      
      // State for edit modal
      const [editModalOpen, setEditModalOpen] = useState(false);
      
      // Import edit modal component - added at the top of the file
      // import EditFeeTypeModal from './edit-fee-type-modal';
      
      return (
        <>
          <Dialog open={open} onOpenChange={setOpen}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DialogTrigger asChild>
                  <DropdownMenuItem>
                    <Eye className="mr-2 h-4 w-4" />
                    View Components
                  </DropdownMenuItem>
                </DialogTrigger>
                <DropdownMenuItem onClick={() => setEditModalOpen(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleStatus}>
                  {feeType.is_active ? (
                    <>
                      <ToggleLeft className="mr-2 h-4 w-4" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <ToggleRight className="mr-2 h-4 w-4" />
                      Activate
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle>{feeType.name} Components</DialogTitle>
              </DialogHeader>
              <FeeComponentsList components={feeType.components} />
              <div className="mt-4 flex justify-between">
                <div>
                  <Badge variant={feeType.is_recurring ? "outline" : "secondary"} className="capitalize">
                    {feeType.is_recurring ? feeType.frequency || 'Recurring' : 'One-time'}
                  </Badge>
                  <Badge variant={feeType.is_active ? "default" : "destructive"} className="ml-2">
                    {feeType.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="font-bold">
                  Total: ${feeType.total_amount?.toFixed(2) || '0.00'}
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          {/* Edit Modal */}
          <EditFeeTypeModal 
            isOpen={editModalOpen}
            onClose={() => setEditModalOpen(false)}
            feeType={feeType}
          />
        </>
      );
    },
  },
];