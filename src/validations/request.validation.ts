import z from "zod";

const ObjectId = z
    .string()
    .refine((id) => /^[0-9a-fA-F]{24}$/.test(id), {
        message: "Invalid collection id",
    });

export const QueryParamSchema = z.object({
    key: z.string().trim().max(200),
    value: z.string(),
    isEnabled: z.boolean().default(true)
});

export const HeaderSchema = z.object({
    key: z.string().trim().max(200),
    value: z.string(),
    isEnabled: z.boolean().default(true),
});

export const AuthenticationSchema = z.object({
    type: z.enum(["none", "bearer", "basic", "apikey"]),

    key: z.string().optional(),
    value: z.string().optional(),

    username: z.string().optional(),
    password: z.string().optional(),

})

export const RequestBodySchema = z.object({
    type: z.enum([
        "none", "json", "raw", "form-data", "x-www-form-urlencoded",
    ]),
    content: z.string().default(""),
});


export const requestSchema = z.object({

    collectionId: ObjectId,

    name: z.string().trim().min(1, "Request name is required").max(100),

    method: z.enum([
        "GET", "POST", "PUT", "PATCH", "DELETE",
    ]),

    url: z.string().trim().url("Invalid URL").max(2000),

    description: z
        .string()
        .trim()
        .max(1000)
        .optional()
        .default(""),

    queryParams: z.array(QueryParamSchema).default([]),

    headers: z.array(HeaderSchema).default([]),

    authentication: AuthenticationSchema.default({
        type: "none",
    }),

    body: RequestBodySchema.default({
        type: "none",
        content: "",
    }),
})