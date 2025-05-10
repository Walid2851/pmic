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
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';

// Define the validation schema
const createBatchSchema = z.object({
    batchId: z.string()
        .min(1, 'Batch ID is required')
        .max(50, 'Batch ID must be less than 50 characters'),
    intakeSession: z.string()
        .min(1, 'Intake session is required')
        .max(50, 'Intake session must be less than 50 characters'),
    numberOfStudents: z.number()
        .min(0, 'Number of students must be 0 or greater')
        .max(1000, 'Number of students must be less than 1000'),
    programCode: z.string()
        .min(1, 'Program code is required')
        .max(20, 'Program code must be less than 20 characters'),
});

const CreateBatchForm = () => {
    const router = useRouter();

    const form = useForm<z.infer<typeof createBatchSchema>>({
        resolver: zodResolver(createBatchSchema),
        defaultValues: {
            batchId: '',
            intakeSession: '',
            numberOfStudents: 0,
            programCode: '',
        },
    });

    const onSubmit = async (values: z.infer<typeof createBatchSchema>) => {
        const supabase = createClient();

        const supabasePromise = new Promise(async (resolve, reject) => {
            try {
                const { data, error } = await supabase
                    .from('batch')
                    .insert([
                        {
                            batch_id: values.batchId,
                            intake_session: values.intakeSession,
                            number_of_students: values.numberOfStudents,
                            program_code: values.programCode,
                        },
                    ])
                    .select();

                if (error) {
                    reject(error);
                } else {
                    resolve(data);
                }
            } catch (error) {
                console.error(error);
                reject('An unexpected error occurred, please try again.');
            }
        });

        toast.promise(supabasePromise, {
            loading: 'Creating batch...',
            success: (data) => {
                form.reset();
                setTimeout(() => {
                    router.refresh();
                }, 500);
                return 'Batch created successfully!';
            },
            error: (err) => {
                return 'An error occurred while creating the batch';
            },
        });
    };

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8 border py-8 px-8 rounded-xl"
                id="addBatchForm"
            >
                <h1 className="text-lg font-semibold md:text-2xl mb-2">Create New Batch</h1>
                
                <FormField
                    control={form.control}
                    name="batchId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Batch ID</FormLabel>
                            <FormControl>
                                <Input placeholder="FALL2024-CSE" {...field} required />
                            </FormControl>
                            <FormDescription>
                                Enter a unique identifier for this batch
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="intakeSession"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Intake Session</FormLabel>
                            <FormControl>
                                <Input 
                                    placeholder="Fall 2024"
                                    {...field}
                                    required
                                />
                            </FormControl>
                            <FormDescription>
                                Enter the intake session (e.g., Fall 2024, Spring 2025)
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="numberOfStudents"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Number of Students</FormLabel>
                            <FormControl>
                                <Input 
                                    type="number"
                                    {...field}
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                            </FormControl>
                            <FormDescription>
                                Enter the total number of students in this batch
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="programCode"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Program Code</FormLabel>
                            <FormControl>
                                <Input 
                                    placeholder="CSE"
                                    {...field}
                                    required
                                />
                            </FormControl>
                            <FormDescription>
                                Enter the program code (e.g., CSE, BBA, EEE)
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit">Create Batch</Button>
            </form>
        </Form>
    );
};

export default CreateBatchForm;