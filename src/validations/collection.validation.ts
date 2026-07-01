import z from "zod";

export const createCollectionSchema = z.object({
    name: z.string().min(1, "Collection name is required").max(100),
    workspaceId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Workspace ID"),
  });