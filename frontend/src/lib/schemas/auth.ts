import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email({ message: "Email invalide" }),
  password: z.string().min(1, { message: "Mot de passe requis" }),
});

export const registerSchema = z
  .object({
    lastname: z
      .string()
      .min(2, { message: "Nom requis (2 caractères minimum)" })
      .max(255, { message: "Nom trop long" }),
    firstname: z
      .string()
      .min(2, { message: "Prénom requis (2 caractères minimum)" })
      .max(255, { message: "Prénom trop long" }),
    email: z.string().email({ message: "Email invalide" }),
    password: z
      .string()
      .min(8, { message: "Mot de passe trop court (8 caractères)" }),
    confirm: z.string().min(8, { message: "Confirmation requise" }),
    dateOfBirth: z
      .string()
      .min(1, { message: "Date de naissance requise" })
      .refine((value) => !Number.isNaN(Date.parse(value)), {
        message: "Date de naissance invalide",
      })
      .refine((value) => new Date(value).getTime() <= Date.now(), {
        message: "La date de naissance ne peut pas être dans le futur",
      }),
    pseudo: z.string().max(100, { message: "Pseudo trop long" }).optional(),
    phone: z.string().max(20, { message: "Téléphone trop long" }).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.password !== val.confirm) {
      ctx.addIssue({
        path: ["confirm"],
        code: z.ZodIssueCode.custom,
        message: "Les mots de passe ne correspondent pas",
      });
    }
  });

export const guardianSchema = z.object({
  guardianName: z.string().min(1, { message: "Nom du responsable requis" }),
  guardianEmail: z.string().email({ message: "Email du responsable invalide" }),
  guardianPhone: z.string().min(4, { message: "Téléphone requis" }),
  guardianConsent: z
    .boolean()
    .refine((value) => value, "Le responsable doit accepter"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type GuardianInput = z.infer<typeof guardianSchema>;
