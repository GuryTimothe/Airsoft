import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email({ message: "Email invalide" }),
  password: z.string().min(1, { message: "Mot de passe requis" }),
})

export const registerSchema = z
  .object({
    name: z.string().min(1, { message: "Nom requis" }),
    email: z.string().email({ message: "Email invalide" }),
    password: z.string().min(6, { message: "Mot de passe trop court (6 caractères)" }),
    confirm: z.string().min(6, { message: "Confirmation requise" }),
    age: z.number().int().min(0, { message: "Âge invalide" }),
  })
  .superRefine((val, ctx) => {
    if (val.password !== val.confirm) {
      ctx.addIssue({ path: ["confirm"], code: z.ZodIssueCode.custom, message: "Les mots de passe ne correspondent pas" })
    }
  })

export const guardianSchema = z.object({
  guardianName: z.string().min(1, { message: "Nom du responsable requis" }),
  guardianEmail: z.string().email({ message: "Email du responsable invalide" }),
  guardianPhone: z.string().min(4, { message: "Téléphone requis" }),
  guardianConsent: z.literal(true, { errorMap: () => ({ message: "Le responsable doit accepter" }) }),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type GuardianInput = z.infer<typeof guardianSchema>
