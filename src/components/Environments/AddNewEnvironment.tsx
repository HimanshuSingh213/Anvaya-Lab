"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createEnvironmentSchema } from '@/validations/environment.validation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface AddNewEnvironmentProps {
    setIsCreatingEnvironment: (show: boolean) => void;
    onSuccess: (newEnv: any) => void;
}

export default function AddNewEnvironment({
    setIsCreatingEnvironment,
    onSuccess
}: AddNewEnvironmentProps) {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting }
    } = useForm<z.infer<typeof createEnvironmentSchema>>({
        resolver: zodResolver(createEnvironmentSchema),
        defaultValues: {
            name: ''
        }
    });

    const onSubmit = async (data: z.infer<typeof createEnvironmentSchema>) => {
        try {
            const newEnv = {
                id: `env-${Date.now()}`,
                name: data.name.trim(),
                variables: [
                    { key: "url", value: "http://localhost:3000", isEnabled: true, isSecret: false }
                ],
            };
            onSuccess(newEnv);
            setIsCreatingEnvironment(false);
            toast.success(`Environment "${newEnv.name}" created successfully`);
        } catch (err: any) {
            toast.error("Failed to create environment", {
                description: err.message
            });
        }
    };

    return (
        <motion.form
            onSubmit={handleSubmit(onSubmit)}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className='flex flex-col gap-2 bg-panel-charcoal p-3 rounded-sm border border-border-dark my-1 select-none'
        >
            <span className='text-[10px] text-text-muted font-mono w-full text-left uppercase'>New Environment</span>
            
            <input
                type="text"
                {...register("name")}
                className='px-2.5 py-1.5 bg-background border border-border-dark rounded-sm text-xs focus:border-border-active outline-none placeholder:text-text-disabled text-text-white'
                placeholder='Environment name...'
                disabled={isSubmitting}
                autoFocus
            />
            {errors.name && (
                <span className='text-[10px] text-danger text-left'>{errors.name.message}</span>
            )}

            <div className='flex flex-row gap-1 justify-end items-center'>
                <button
                    type="button"
                    className='text-[11px] font-medium text-text-white/70 px-2.5 rounded-sm py-1 hover:text-text-white transition duration-200 ease-in-out'
                    onClick={() => setIsCreatingEnvironment(false)}
                    disabled={isSubmitting}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className='text-[11px] font-medium text-text-white px-2.5 rounded-sm py-1 bg-panel-active hover:bg-text-muted transition duration-200 ease-in-out'
                >
                    Create
                </button>
            </div>
        </motion.form>
    );
}
