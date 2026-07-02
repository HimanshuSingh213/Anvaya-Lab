"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createCollectionSchema } from '@/validations/collection.validation';
import axios from 'axios';
import { toast } from 'sonner';
import { ApiResponse } from '@/types/ApiResponse';
import { Loader2 } from 'lucide-react';

interface AddNewCollectionProps {
    workspaceId: string;
    setIsCreatingCollection: (show: boolean) => void;
    onSuccess: (newCollection: any) => void;
}

export default function AddNewCollection({
    workspaceId,
    setIsCreatingCollection,
    onSuccess
}: AddNewCollectionProps) {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting }
    } = useForm<z.infer<typeof createCollectionSchema>>({
        resolver: zodResolver(createCollectionSchema),
        defaultValues: {
            name: '',
            workspaceId: workspaceId
        }
    });

    const onSubmit = async (data: z.infer<typeof createCollectionSchema>) => {
        try {
            const res = await axios.post<ApiResponse>("/api/collection", data);
            if (res.data.success) {
                toast.success("Collection created successfully");
                onSuccess(res.data.data);
                setIsCreatingCollection(false);
            }
        } catch (err: any) {
            toast.error("Failed to create collection", {
                description: err.response?.data?.error || err.message
            });
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-2 bg-panel-charcoal p-3 rounded-sm border border-border-dark my-1 select-none'>
            <span className='text-[10px] text-text-muted font-mono w-full text-left uppercase'>New Collection</span>
            
            <input
                type="text"
                {...register("name")}
                className='px-2.5 py-1.5 bg-background border border-border-dark rounded-sm text-xs focus:border-border-active outline-none placeholder:text-text-disabled text-text-white'
                placeholder='Folder name...'
                disabled={isSubmitting}
                autoFocus
            />
            {errors.name && (
                <span className='text-[10px] text-danger text-left'>{errors.name.message}</span>
            )}

            <input type="hidden" value={workspaceId} {...register("workspaceId")} />

            <div className='flex flex-row gap-1 justify-end items-center'>
                <button
                    type="button"
                    className='text-[11px] font-medium text-text-white/70 px-2.5 rounded-sm py-1 hover:text-text-white transition duration-200 ease-in-out'
                    onClick={() => setIsCreatingCollection(false)}
                    disabled={isSubmitting}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className='text-[11px] font-medium text-text-white px-2.5 rounded-sm py-1 bg-panel-active hover:bg-text-muted transition duration-200 ease-in-out flex items-center gap-1.5'
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="size-3 animate-spin" />
                            Creating...
                        </>
                    ) : (
                        "Create"
                    )}
                </button>
            </div>
        </form>
    );
}
