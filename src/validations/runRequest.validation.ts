import z from "zod";
import { AuthenticationSchema, HeaderSchema, QueryParamSchema, RequestBodySchema } from "./request.validation";

export const runRequestSchema = z.object({
    workspaceId: z.string().optional(),
    url: z.string().trim().url("Invalid target URL format").max(2000),
    method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
    queryParams: z.array(QueryParamSchema).default([]),
    headers: z.array(HeaderSchema).default([]),
    authentication: AuthenticationSchema.default({ type: "none" }),
    body: RequestBodySchema.default({ type: "none", content: "" })
});