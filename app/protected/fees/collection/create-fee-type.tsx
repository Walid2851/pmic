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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
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
import { PlusCircle, Trash2 } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';

// Define schema for fee components
const feeComponentSchema = z.object({
    name: z.string().min(1, 'Component name is required'),
    description: z.string().optional(),
    amount: z.coerce.number().min(0, 'Amount must be a positive number'),
    is_optional: z.boolean().default(false),
});

// Define schema for fee type
const createFeeTypeSchema = z.object({
    name: z.string().min(1, 'Fee type name is required').max(100, 'Fee type name must be less than 100 characters'),
    description: z.string().optional(),
    is_recurring: z.boolean().default(false),
    frequency: z.string().optional(),
    is_active: z.boolean().default(true),
    components: z.array(feeComponentSchema).min(1, 'At least one fee component is required'),
});

interface CreateFeeTypeFormProps {
    onComplete?: () => void;
}

const CreateFeeTypeForm = ({ onComplete }: CreateFeeTypeFormProps) => {
    const router = useRouter();
    
    // Initialize form with react-hook-form
    const form = useForm<z.infer<typeof createFeeTypeSchema>>({
        resolver: zodResolver(createFeeTypeSchema),
        defaultValues: {
            name: '',
            description: '',
            is_recurring: false,
            frequency: 'one-time',
            is_active: true,
            components: [
                {
                    name: '',
                    description: '',
                    amount: 0,
                    is_optional: false,
                }
            ],
        },
        mode: 'onChange', // Enable validation on change for real-time feedback
    });

    // Setup field array for dynamic components
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "components",
    });

    // Watch components for real-time calculations
    const components = form.watch("components");
    
    // Calculate total amount using useMemo for better performance
    const totalAmount = useMemo(() => {
        if (!components || components.length === 0) return 0;
        
        return components.reduce((total, component) => {
            // Skip optional components in the total calculation
            if (component.is_optional) return total;
            
            // Handle NaN or undefined values
            const amount = typeof component.amount === 'number' ? component.amount : 0;
            return total + amount;
        }, 0);
    }, [components]);

    // Calculate optional components total
    const optionalTotal = useMemo(() => {
        if (!components || components.length === 0) return 0;
        
        return components.reduce((total, component) => {
            // Only include optional components
            if (!component.is_optional) return total;
            
            const amount = typeof component.amount === 'number' ? component.amount : 0;
            return total + amount;
        }, 0);
    }, [components]);

    const onSubmit = async (values: z.infer<typeof createFeeTypeSchema>) => {
        const supabase = createClient();

        const supabasePromise = new Promise(async (resolve, reject) => {
            try {
                // Start a transaction
                // First, insert the fee type
                const { data: feeTypeData, error: feeTypeError } = await supabase
                    .from('fee_type')
                    .insert([
                        {
                            name: values.name,
                            description: values.description || null,
                            is_recurring: values.is_recurring,
                            frequency: values.is_recurring ? values.frequency : null,
                            is_active: values.is_active,
                        },
                    ])
                    .select();

                if (feeTypeError) {
                    reject(feeTypeError);
                    return;
                }

                const feeTypeId = feeTypeData[0].id;

                // Next, insert all fee components
                const componentsToInsert = values.components.map(component => ({
                    fee_type_id: feeTypeId,
                    name: component.name,
                    description: component.description || null,
                    amount: component.amount,
                    is_optional: component.is_optional,
                    is_active: true,
                }));

                const { data: componentsData, error: componentsError } = await supabase
                    .from('fee_component')
                    .insert(componentsToInsert)
                    .select();

                if (componentsError) {
                    reject(componentsError);
                    return;
                }

                resolve({ feeType: feeTypeData[0], components: componentsData });
            } catch (error) {
                console.error(error);
                reject('An unexpected error occurred, please try again.');
            }
        });

        toast.promise(supabasePromise, {
            loading: 'Creating fee type...',
            success: () => {
                form.reset();
                if (onComplete) {
                    onComplete();
                }
                setTimeout(() => {
                    router.refresh();
                }, 500);
                return 'Fee type created successfully!';
            },
            error: (err) => {
                return `Error: ${err.message || 'An error occurred while creating the fee type'}`;
            },
        });
    };

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8 border py-8 px-8 rounded-xl"
            >
                <h1 className="text-lg font-semibold md:text-2xl mb-2">Create New Fee Type</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Fee Type Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Registration Fee" {...field} required />
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
                                            placeholder="Fee collected at the time of registration" 
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
                                })}
                            >
                                <PlusCircle className="h-4 w-4 mr-2" />
                                Add Component
                            </Button>
                        </div>
                        
                        <div className="space-y-4">
                            {fields.map((field, index) => (
                                <Card key={field.id} className="relative">
                                    <CardContent className="pt-6">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-2 right-2"
                                            onClick={() => fields.length > 1 && remove(index)}
                                            disabled={fields.length <= 1}
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
                                                            <Input placeholder="Tuition Fee" {...field} />
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
                                                                placeholder="Basic tuition charges" 
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
                                                                placeholder="0.00"
                                                                onChange={(e) => {
                                                                    // Immediately update the form value for real-time calculation
                                                                    field.onChange(parseFloat(e.target.value) || 0);
                                                                }}
                                                                value={field.value}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            
                                            <FormField
                                                control={form.control}
                                                name={`components.${index}.is_optional`}
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                                        <div className="space-y-0.5">
                                                            <FormLabel className="text-sm">Optional</FormLabel>
                                                            <FormDescription className="text-xs">
                                                                Optional fees are not included in the required total
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
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-secondary/50 rounded-lg">
                                <span className="font-medium">Required Fees:</span>
                                <span className="font-bold">${totalAmount.toFixed(2)}</span>
                            </div>
                            
                            {optionalTotal > 0 && (
                                <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg">
                                    <span className="font-medium">Optional Fees:</span>
                                    <span className="font-medium">${optionalTotal.toFixed(2)}</span>
                                </div>
                            )}
                            
                            <div className="flex justify-between items-center p-4 bg-secondary rounded-lg">
                                <span className="font-medium">Total Amount:</span>
                                <span className="font-bold text-lg">${(totalAmount + optionalTotal).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <Button type="submit" className="w-full md:w-auto">Create Fee Type</Button>
            </form>
        </Form>
    );
};

export default CreateFeeTypeForm;