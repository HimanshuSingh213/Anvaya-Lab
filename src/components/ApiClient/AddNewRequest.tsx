"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { toast } from 'sonner';
import { ApiResponse } from '@/types/ApiResponse';
import { Loader2 } from 'lucide-react';

const createRequestFormSchema = z.object({
    name: z.string().min(1, "Request name is required").max(100),
});

type RequestFormValues = z.infer<typeof createRequestFormSchema>;

interface AddNewRequestProps {
    collectionId: string;
    setIsCreatingRequest: (show: boolean) => void;
    onSuccess: (newRequest: any) => void;
}

export default function AddNewRequest({
    collectionId,
    setIsCreatingRequest,
    onSuccess
}: AddNewRequestProps) {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting }
    } = useForm<RequestFormValues>({
        resolver: zodResolver(createRequestFormSchema),
        defaultValues: {
            name: ''
        }
    });

    const onSubmit = async (data: RequestFormValues) => {
        try {
            const res = await axios.post<ApiResponse>("/api/requests", {
                collectionId,
                name: data.name.trim(),
                method: "GET",
                url: "https://api.github.com/users/HimanshuSingh213",
                queryParams: [],
                headers: [],
                authentication: { type: "none" },
                body: { type: "none", content: "" }
            });

            if (res.data.success) {
                toast.success("Request created successfully");
                onSuccess(res.data.data);
                setIsCreatingRequest(false);
            }
        } catch (err: any) {
            toast.error("Failed to create request", {
                description: err.response?.data?.error || err.message
            });
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-2 bg-panel-hover p-2.5 rounded-sm border border-border-dark my-1 select-none'>
            <span className='text-[9px] text-text-muted font-mono w-full text-left uppercase tracking-wider'>New Request</span>
            
            <input
                type="text"
                {...register("name")}
                className='px-2 py-1 bg-background border border-border-dark rounded-sm text-[11px] focus:border-border-active outline-none placeholder:text-text-disabled text-text-white'
                placeholder='Request name...'
                disabled={isSubmitting}
                autoFocus
            />
            {errors.name && (
                <span className='text-[10px] text-danger text-left'>{errors.name.message}</span>
            )}

            <div className='flex flex-row gap-1 justify-end items-center'>
                <button
                    type="button"
                    className='text-[10px] font-medium text-text-white/70 px-2 rounded py-0.5 hover:text-text-white transition duration-150 ease-in-out'
                    onClick={() => setIsCreatingRequest(false)}
                    disabled={isSubmitting}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className='text-[10px] font-medium text-text-white px-2 rounded py-0.5 bg-panel-active hover:bg-text-muted transition duration-150 ease-in-out flex items-center gap-1'
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="size-2.5 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        "Save"
                    )}
                </button>
            </div>
        </form>
    );
}
