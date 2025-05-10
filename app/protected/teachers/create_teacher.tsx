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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const createTeacherSchema = z.object({
    instructorID: z.string()
    .min(1, 'Course code is required')
    .max(20, 'Course code must be less than 20 characters'),
    firstName: z.string()
        .min(1, 'First name is required')
        .max(50, 'First name must be less than 50 characters'),
    lastName: z.string()
        .min(1, 'Last name is required')
        .max(50, 'Last name must be less than 50 characters'),
    email: z.string()
        .min(1, 'Email is required')
        .email('Invalid email address'),
    phone: z.string()
        .optional(),
    designation: z.string()
        .optional(),
    department: z.string()
        .optional(),
    joinDate: z.date({
        required_error: "Join date is required",
    }),
    specialization: z.string()
        .optional(),
    isActive: z.boolean().default(true),
});

const CreateTeacherForm = () => {
    const router = useRouter();

    const form = useForm<z.infer<typeof createTeacherSchema>>({
        resolver: zodResolver(createTeacherSchema),
        defaultValues: {
            instructorID:'',
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            designation: '',
            department: '',
            specialization: '',
            isActive: true,
        },
    });

    const onSubmit = async (values: z.infer<typeof createTeacherSchema>) => {
        const supabase = createClient();

        const supabasePromise = new Promise(async (resolve, reject) => {
            try {
                const { data, error } = await supabase
                    .from('teacher')
                    .insert([
                        {
                            InstructorID: values.instructorID,
                            FirstName: values.firstName,
                            LastName: values.lastName,
                            Email: values.email,
                            Phone: values.phone,
                            Designation: values.designation,
                            Department: values.department,
                            JoinDate: values.joinDate,
                            Specialization: values.specialization,
                            IsActive: values.isActive,
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
            loading: 'Creating teacher profile...',
            success: (data) => {
                form.reset();
                setTimeout(() => {
                    router.refresh();
                }, 500);
                return 'Teacher profile created successfully!';
            },
            error: (err) => {
                return 'An error occurred while creating the teacher profile';
            },
        });
    };

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8 border py-8 px-8 rounded-xl"
                id="addTeacherForm"
            >
                <h1 className="text-lg font-semibold md:text-2xl mb-2">Create New Teacher Profile</h1>

                <FormField
                    control={form.control}
                    name="instructorID"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Instructor ID</FormLabel>
                            <FormControl>
                                <Input placeholder="T1012342" {...field} required />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                
                <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                                <Input placeholder="John" {...field} required />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Doe" {...field} required />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input 
                                    type="email"
                                    placeholder="john.doe@example.com"
                                    {...field}
                                    required
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                                <Input 
                                    placeholder="+1234567890"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="designation"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Designation</FormLabel>
                            <FormControl>
                                <Input 
                                    placeholder="Professor"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Department</FormLabel>
                            <FormControl>
                                <Input 
                                    placeholder="Computer Science"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="joinDate"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Join Date</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full pl-3 text-left font-normal",
                                                !field.value && "text-muted-foreground"
                                            )}
                                        >
                                            {field.value ? (
                                                format(field.value, "PPP")
                                            ) : (
                                                <span>Pick a date</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={(date) =>
                                            date > new Date()
                                        }
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="specialization"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Specialization</FormLabel>
                            <FormControl>
                                <Input 
                                    placeholder="Machine Learning"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit">Create Teacher Profile</Button>
            </form>
        </Form>
    );
};

export default CreateTeacherForm;