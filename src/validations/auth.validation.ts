import z from "zod";

export const signUpSchema = z.object({
    name: z.string().min(3, { message: "Name must contain at least 3 letters" })
        .max(60, { message: "Name must contain at most 60 letters" })
        .regex(/^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[ '-][A-Za-zÀ-ÖØ-öø-ÿ]+)*$/, { message: "Name contains invalid characters" }),
    email: z.email({ message: "Invalid email address" }),
    password: z.string().min(8, { message: "password must contain atleast 8 characters" }),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

export const signInSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string()
});

export const verifySchema = z.object({
    code: z.string().length(6, "Verification code must contain only 6 digits")
});
