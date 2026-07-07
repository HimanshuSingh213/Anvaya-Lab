import z from "zod";

export const createEnvironmentSchema = z.object({
    name: z.string().min(1, "Environment name is required").max(100),
});
