import { z } from 'zod'


export const emailValidation = z.object({
    email: z
        .string()
        .trim()
        .email({
            message: "Invalid Email"
        }),
})

export const validateUserLogin = emailValidation.extend({
    password: z
        .string()
        .trim()
        .min(6, { message: "Password must be atleast 6 characters long." })
        .max(10, { message: "Password must not be more than 10 characters." })
})

export const validateUserRegisteration = validateUserLogin.extend({
    fullname: z
        .string()
        .trim()
        .min(1, { message: "Fullname is required" })
})
