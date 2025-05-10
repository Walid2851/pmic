'use client';

import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, Trash2, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

// Define schema for fee components
const feeComponentSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, 'Component name is required'),
    description: z.string().optional(),
    amount: z.coerce.number().min(0, 'Amount must be a positive number'),
    is_optional: z.boolean().default(false),
    is_active: z.boolean().default(true),
    isDeleted: z.boolean().optional(),
});

// Define schema for fee type
const editFeeTypeSchema = z.object({
    id: z.string(),
    name: z.string().min(1, 'Fee type name is required').max(100, 'Fee type name must be less than 100 characters'),
    description: z.string().optional(),
    is_recurring: z.boolean().default(false),
    frequency: z.string().optional(),
    is_active: z.boolean().default(true),
    components: z.array(feeComponentSchema).min(1, 'At least one fee component is required'),
});

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

interface EditFeeTypeModalProps {
    isOpen: boolean;
    onClose: () => void;
    feeType: FeeType | null;
    onSuccess?: () => void;
}

const EditFeeTypeModal = ({ isOpen, onClose, feeType, onSuccess }: EditFeeTypeModalProps) => {
    const [totalAmount, setTotalAmount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);

    // Initialize form with react-hook-form
    const form = useForm<z.infer<typeof editFeeTypeSchema>>({
        resolver: zodResolver(editFeeTypeSchema),
        defaultValues: {
            id: '',
            name: '',
            description: '',
            is_recurring: false,
            frequency: 'one-time',
            is_active: true,
            components: [
                {
                    id: '',
                    name: '',
                    description: '',
                    amount: 0,
                    is_optional: false,
                    is_active: true,
                }
            ],
        },
    });

    // Setup field array for dynamic components
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "components",
    });

    // Reset form when fee type changes
    useEffect(() => {
        if (feeType) {
            form.reset({
                id: feeType.id,
                name: feeType.name,
                description: feeType.description || '',
                is_recurring: feeType.is_recurring,
                frequency: feeType.frequency || 'one-time',
                is_active: feeType.is_active,
                components: feeType.components?.map(component => ({
                    id: component.id,
                    name: component.name,
                    description: component.description || '',
                    amount: component.amount,
                    is_optional: component.is_optional,
                    is_active: component.is_active,
                    isDeleted: false,
                })) || [],
            });
        }
    }, [feeType, form]);

    // Watch form values to calculate total
    const formValues = form.watch();

    // Calculate total amount whenever components change
    useEffect(() => {
        const total = formValues.components.reduce((sum, component) => {
            if (component.isDeleted) return sum;
            return sum + (component.amount || 0);
        }, 0);
        setTotalAmount(total);
    }, [formValues.components]);

    const onSubmit = async (values: z.infer<typeof editFeeTypeSchema>) => {
        if (!feeType) return;
        setIsLoading(true);

        const supabase = createClient();

        const updatePromise = new Promise(async (resolve, reject) => {
            try {
                // 1. Update fee type details
                const { error: feeTypeError } = await supabase
                    .from('fee_type')
                    .update({
                        name: values.name,
                        description: values.description || null,
                        is_recurring: values.is_recurring,
                        frequency: values.is_recurring ? values.frequency : null,
                        is_active: values.is_active,
                    })
                    .eq('id', values.id);

                if (feeTypeError) {
                    reject(feeTypeError);
                    return;
                }

                // 2. Handle components - update, create, or delete
                // Components to create (no id)
                const componentsToCreate = values.components
                    .filter(c => !c.id && !c.isDeleted)
                    .map(component => ({
                        fee_type_id: values.id,
                        name: component.name,
                        description: component.description || null,
                        amount: component.amount,
                        is_optional: component.is_optional,
                        is_active: component.is_active,
                    }));

                if (componentsToCreate.length > 0) {
                    const { error: createError } = await supabase
                        .from('fee_component')
                        .insert(componentsToCreate);

                    if (createError) {
                        reject(createError);
                        return;
                    }
                }

                // Components to update (has id and not deleted)
                const componentsToUpdate = values.components
                    .filter(c => c.id && !c.isDeleted)
                    .map(component => ({
                        id: component.id,
                        name: component.name,
                        description: component.description || null,
                        amount: component.amount,
                        is_optional: component.is_optional,
                        is_active: component.is_active,
                    }));

                for (const component of componentsToUpdate) {
                    const { error: updateError } = await supabase
                        .from('fee_component')
                        .update({
                            name: component.name,
                            description: component.description,
                            amount: component.amount,
                            is_optional: component.is_optional,
                            is_active: component.is_active,
                        })
                        .eq('id', component.id);

                    if (updateError) {
                        reject(updateError);
                        return;
                    }
                }

                // Components to delete (has id and isDeleted)
                const componentsToDelete = values.components
                    .filter(c => c.id && c.isDeleted)
                    .map(c => c.id as string);

                if (componentsToDelete.length > 0) {
                    const { error: deleteError } = await supabase
                        .from('fee_component')
                        .delete()
                        .in('id', componentsToDelete);

                    if (deleteError) {
                        reject(deleteError);
                        return;
                    }
                }

                resolve({
                    success: true,
                    message: 'Fee type updated successfully',
                });
            } catch (error) {
                console.error(error);
                reject('An unexpected error occurred, please try again.');
            } finally {
                setIsLoading(false);
            }
        });

        toast.promise(updatePromise, {
            loading: 'Updating fee type...',
            success: () => {
                onClose();
                if (onSuccess) {
                    onSuccess();
                }
                return 'Fee type updated successfully!';
            },
            error: (err) => {
                return `Error: ${err.message || 'An error occurred while updating the fee type'}`;
            },
        });
    };

    // Handle deleting a fee type
    const handleDeleteFeeType = async () => {
        if (!feeType) return;
        setIsLoading(true);

        const supabase = createClient();

        const deletePromise = new Promise(async (resolve, reject) => {
            try {
                // Delete fee components first (they will cascade, but let's be explicit)
                const { error: componentsError } = await supabase
                    .from('fee_component')
                    .delete()
                    .eq('fee_type_id', feeType.id);

                if (componentsError) {
                    reject(componentsError);
                    return;
                }

                // Delete the fee type
                const { error: feeTypeError } = await supabase
                    .from('fee_type')
                    .delete()
                    .eq('id', feeType.id);

                if (feeTypeError) {
                    reject(feeTypeError);
                    return;
                }

                resolve({
                    success: true,
                    message: 'Fee type deleted successfully',
                });
            } catch (error) {
                console.error(error);
                reject('An unexpected error occurred, please try again.');
            } finally {
                setIsLoading(false);
                setShowDeleteAlert(false);
            }
        });

        toast.promise(deletePromise, {
            loading: 'Deleting fee type...',
            success: () => {
                onClose();
                if (onSuccess) {
                    onSuccess();
                }
                return 'Fee type deleted successfully!';
            },
            error: (err) => {
                return `Error: ${err.message || 'An error occurred while deleting the fee type'}`;
            },
        });
    };

    // Helper to mark a component as deleted
    const markComponentDeleted = (index: number) => {
        const updatedComponents = [...form.getValues().components];
        if (updatedComponents[index].id) {
            // If it has an ID, mark it for deletion
            form.setValue(`components.${index}.isDeleted`, true);
        } else {
            // If it's a new component, remove it from the form
            remove(index);
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Fee Type</DialogTitle>
                        <DialogDescription>
                            Update the details of this fee type and its components.
                        </DialogDescription>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Fee Type Name</FormLabel>
                                                <FormControl>
                                                    <Input {...field} required />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Description</FormLabel>
                                                <FormControl>
                                                    <Textarea 
                                                        {...field} 
                                                        value={field.value || ''}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="is_recurring"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">Recurring Fee</FormLabel>
                                                    <FormDescription>
                                                        Is this fee charged periodically?
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    {form.watch("is_recurring") && (
                                        <FormField
                                            control={form.control}
                                            name="frequency"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Frequency</FormLabel>
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        defaultValue={field.value}
                                                        value={field.value}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select frequency" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="semester">Per Semester</SelectItem>
                                                            <SelectItem value="monthly">Monthly</SelectItem>
                                                            <SelectItem value="yearly">Yearly</SelectItem>
                                                            <SelectItem value="quarterly">Quarterly</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}

                                    <FormField
                                        control={form.control}
                                        name="is_active"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">Active Status</FormLabel>
                                                    <FormDescription>
                                                        Is this fee type currently active?
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-medium">Fee Components</h3>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => append({
                                                name: '',
                                                description: '',
                                                amount: 0,
                                                is_optional: false,
                                                is_active: true,
                                                isDeleted: false,
                                            })}
                                        >
                                            <PlusCircle className="h-4 w-4 mr-2" />
                                            Add Component
                                        </Button>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        {fields.map((field, index) => {
                                            // Skip rendering deleted components
                                            if (form.getValues().components[index]?.isDeleted) {
                                                return null;
                                            }
                                            
                                            return (
                                                <Card key={field.id} className="relative">
                                                    <CardContent className="pt-6">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="absolute top-2 right-2"
                                                            onClick={() => {
                                                                if (fields.length <= 1) {
                                                                    toast.error("You must have at least one component");
                                                                    return;
                                                                }
                                                                markComponentDeleted(index);
                                                            }}
                                                            disabled={fields.filter(f => !form.getValues().components[fields.indexOf(f)]?.isDeleted).length <= 1}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                        
                                                        <div className="space-y-4">
                                                            <FormField
                                                                control={form.control}
                                                                name={`components.${index}.name`}
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel>Component Name</FormLabel>
                                                                        <FormControl>
                                                                            <Input {...field} />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                            
                                                            <FormField
                                                                control={form.control}
                                                                name={`components.${index}.description`}
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel>Description</FormLabel>
                                                                        <FormControl>
                                                                            <Input 
                                                                                {...field}
                                                                                value={field.value || ''}
                                                                            />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                            
                                                            <FormField
                                                                control={form.control}
                                                                name={`components.${index}.amount`}
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel>Amount</FormLabel>
                                                                        <FormControl>
                                                                            <Input 
                                                                                type="number"
                                                                                min="0"
                                                                                step="0.01"
                                                                                {...field}
                                                                            />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                            
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <FormField
                                                                    control={form.control}
                                                                    name={`components.${index}.is_optional`}
                                                                    render={({ field }) => (
                                                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                                                            <div className="space-y-0.5">
                                                                                <FormLabel className="text-sm">Optional</FormLabel>
                                                                            </div>
                                                                            <FormControl>
                                                                                <Switch
                                                                                    checked={field.value}
                                                                                    onCheckedChange={field.onChange}
                                                                                />
                                                                            </FormControl>
                                                                        </FormItem>
                                                                    )}
                                                                />
                                                                
                                                                <FormField
                                                                    control={form.control}
                                                                    name={`components.${index}.is_active`}
                                                                    render={({ field }) => (
                                                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                                                            <div className="space-y-0.5">
                                                                                <FormLabel className="text-sm">Active</FormLabel>
                                                                            </div>
                                                                            <FormControl>
                                                                                <Switch
                                                                                    checked={field.value}
                                                                                    onCheckedChange={field.onChange}
                                                                                />
                                                                            </FormControl>
                                                                        </FormItem>
                                                                    )}
                                                                />
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })}
                                    </div>

                                    <div className="flex justify-between items-center p-4 bg-secondary rounded-lg">
                                        <span className="font-medium">Total Amount:</span>
                                        <span className="font-bold text-lg">${totalAmount.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className="flex justify-between items-center gap-4 pt-4">
                                <Button 
                                    type="button" 
                                    variant="destructive"
                                    onClick={() => setShowDeleteAlert(true)}
                                    disabled={isLoading}
                                >
                                    Delete Fee Type
                                </Button>
                                <div className="flex gap-2">
                                    <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={isLoading}>
                                        Save Changes
                                    </Button>
                                </div>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the fee type "{feeType?.name}" and all its components.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={(e) => {
                                e.preventDefault();
                                handleDeleteFeeType();
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isLoading}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default EditFeeTypeModal;