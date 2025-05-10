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
import { Textarea } from '@/components/ui/textarea';

// Define the validation schema
const createCourseSchema = z.object({
    courseCode: z.string()
        .min(1, 'Course code is required')
        .max(20, 'Course code must be less than 20 characters'),
    courseTitle: z.string()
        .min(1, 'Course title is required')
        .max(255, 'Course title must be less than 255 characters'),
    credits: z.number()
        .min(0.5, 'Credits must be at least 0.5')
        .max(6.0, 'Credits must be less than or equal to 6.0'),
    semesterNo: z.number()
        .min(1, 'Semester must be between 1 and 8')
        .max(8, 'Semester must be between 1 and 8'),
    courseType: z.string()
        .min(1, 'Course type is required')
        .max(50, 'Course type must be less than 50 characters'),
    description: z.string().optional(),
    prerequisites: z.string().optional(),
});

const CreateCourseFormGO = () => {
    const router = useRouter();

    const form = useForm<z.infer<typeof createCourseSchema>>({
        resolver: zodResolver(createCourseSchema),
        defaultValues: {
            courseCode: '',
            courseTitle: '',
            credits: 3.0,
            semesterNo: 1,
            courseType: '',
            description: '',
            prerequisites: '',
        },
    });

    const onSubmit = async (values: z.infer<typeof createCourseSchema>) => {
        const supabase = createClient();

        const supabasePromise = new Promise(async (resolve, reject) => {
            try {
                const { data, error } = await supabase
                    .from('course')
                    .insert([
                        {
                            CourseCode: values.courseCode,
                            CourseTitle: values.courseTitle,
                            Credits: values.credits,
                            SemesterNo: values.semesterNo,
                            CourseType: values.courseType,
                            Description: values.description,
                            Prerequisites: values.prerequisites,
                            IsActive: true,
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
            loading: 'Creating course...',
            success: (data) => {
                form.reset();
                setTimeout(() => {
                    router.refresh();
                }, 500);
                return 'Course created successfully!';
            },
            error: (err) => {
                return 'An error occurred while creating the course';
            },
        });
    };

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8 border py-8 px-8 rounded-xl"
                id="addCourseForm"
            >
                <h1 className="text-lg font-semibold md:text-2xl mb-2">Create New Course</h1>
                
                <FormField
                    control={form.control}
                    name="courseCode"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Course Code</FormLabel>
                            <FormControl>
                                <Input placeholder="CSE101" {...field} required />
                            </FormControl>
                            <FormDescription>
                                Enter a unique course code (e.g., CSE101, EEE201)
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="courseTitle"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Course Title</FormLabel>
                            <FormControl>
                                <Input 
                                    placeholder="Introduction to Programming"
                                    {...field}
                                    required
                                />
                            </FormControl>
                            <FormDescription>
                                Enter the full title of the course
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="credits"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Credits</FormLabel>
                            <FormControl>
                                <Input 
                                    type="number"
                                    step="0.5"
                                    {...field}
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                            </FormControl>
                            <FormDescription>
                                Enter the number of credits (between 0.5 and 6.0)
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="semesterNo"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Semester Number</FormLabel>
                            <FormControl>
                                <Input 
                                    type="number"
                                    min="1"
                                    max="8"
                                    {...field}
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                            </FormControl>
                            <FormDescription>
                                Enter the semester number (1-8)
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="courseType"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Course Type</FormLabel>
                            <FormControl>
                                <Input 
                                    placeholder="Theory/Lab/Project"
                                    {...field}
                                    required
                                />
                            </FormControl>
                            <FormDescription>
                                Specify the type of course
                            </FormDescription>
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
                                    placeholder="Enter course description..."
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription>
                                Provide a brief description of the course
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="prerequisites"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Prerequisites</FormLabel>
                            <FormControl>
                                <Textarea 
                                    placeholder="Enter prerequisites..."
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription>
                                List any prerequisites for this course
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit">Create Course</Button>
            </form>
        </Form>
    );
};

export default CreateCourseFormGO;