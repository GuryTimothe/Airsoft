import { z } from "zod";
import { getPasswordPolicyErrors } from "@/lib/password-policy";
import { FRENCH_PHONE_REGEX, NAME_REGEX } from "@/lib/validators";

const PHONE_INVALID_MESSAGE = "Numéro de téléphone invalide.";
const nameInvalidMessage = (field: string) =>
  `${field} ne peut contenir que des lettres, espaces et tirets.`;

export const loginSchema = z.object({
  email: z.string().email({ message: "Email invalide" }),
  password: z.string().min(1, { message: "Mot de passe requis" }),
});

export const registerSchema = z
  .object({
    lastname: z
      .string()
      .min(2, { message: "Nom requis (2 caractères minimum)" })
      .max(255, { message: "Nom trop long" })
      .regex(NAME_REGEX, { message: nameInvalidMessage("Le nom") }),
    firstname: z
      .string()
      .min(2, { message: "Prénom requis (2 caractères minimum)" })
      .max(255, { message: "Prénom trop long" })
      .regex(NAME_REGEX, { message: nameInvalidMessage("Le prénom") }),
    email: z.string().email({ message: "Email invalide" }),
    password: z.string(),
    confirm: z.string().min(12, { message: "Confirmation requise" }),
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
    phone: z
      .string()
      .max(20, { message: "Téléphone trop long" })
      .optional()
      .refine(
        (value) => !value?.trim() || FRENCH_PHONE_REGEX.test(value.trim()),
        {
          message: PHONE_INVALID_MESSAGE,
        },
      ),
    guardianLastname: z.string().optional(),
    guardianFirstname: z.string().optional(),
    guardianEmail: z.string().optional(),
    guardianPhone: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    const passwordErrors = getPasswordPolicyErrors(val.password);
    if (passwordErrors.length > 0) {
      ctx.addIssue({
        path: ["password"],
        code: z.ZodIssueCode.custom,
        message: passwordErrors.join(" | "),
      });
    }

    if (val.password !== val.confirm) {
      ctx.addIssue({
        path: ["confirm"],
        code: z.ZodIssueCode.custom,
        message: "Les mots de passe ne correspondent pas",
      });
    }

    // Check if any guardian field is filled
    const guardianFields = {
      lastname: val.guardianLastname?.trim() ?? "",
      firstname: val.guardianFirstname?.trim() ?? "",
      email: val.guardianEmail?.trim() ?? "",
      phone: val.guardianPhone?.trim() ?? "",
    };

    const hasAnyGuardianField = Object.values(guardianFields).some(
      (field) => field !== "",
    );
    const allGuardianFieldsFilled = Object.values(guardianFields).every(
      (field) => field !== "",
    );

    // If any guardian field is filled, all must be filled (all-or-nothing)
    if (hasAnyGuardianField && !allGuardianFieldsFilled) {
      if (!guardianFields.lastname) {
        ctx.addIssue({
          path: ["guardianLastname"],
          code: z.ZodIssueCode.custom,
          message: "Nom du responsable requis",
        });
      }
      if (!guardianFields.firstname) {
        ctx.addIssue({
          path: ["guardianFirstname"],
          code: z.ZodIssueCode.custom,
          message: "Prénom du responsable requis",
        });
      }
      if (!guardianFields.email) {
        ctx.addIssue({
          path: ["guardianEmail"],
          code: z.ZodIssueCode.custom,
          message: "Email du responsable requis",
        });
      }
      if (!guardianFields.phone) {
        ctx.addIssue({
          path: ["guardianPhone"],
          code: z.ZodIssueCode.custom,
          message: "Téléphone du responsable requis",
        });
      }
    }

    // Any filled field must respect the same format rules, even if others are still missing
    if (guardianFields.lastname && !NAME_REGEX.test(guardianFields.lastname)) {
      ctx.addIssue({
        path: ["guardianLastname"],
        code: z.ZodIssueCode.custom,
        message: nameInvalidMessage("Le nom du responsable"),
      });
    }

    if (
      guardianFields.firstname &&
      !NAME_REGEX.test(guardianFields.firstname)
    ) {
      ctx.addIssue({
        path: ["guardianFirstname"],
        code: z.ZodIssueCode.custom,
        message: nameInvalidMessage("Le prénom du responsable"),
      });
    }

    if (
      guardianFields.email &&
      !z.string().email().safeParse(guardianFields.email).success
    ) {
      ctx.addIssue({
        path: ["guardianEmail"],
        code: z.ZodIssueCode.custom,
        message: "Email du responsable invalide",
      });
    }

    if (
      guardianFields.phone &&
      !FRENCH_PHONE_REGEX.test(guardianFields.phone)
    ) {
      ctx.addIssue({
        path: ["guardianPhone"],
        code: z.ZodIssueCode.custom,
        message: "Numéro de téléphone du responsable invalide.",
      });
    }

    // Guardian info is required for minors, which needs a valid date of birth to determine
    const birthDate = new Date(val.dateOfBirth);
    if (Number.isNaN(birthDate.getTime())) {
      return;
    }

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();

    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age -= 1;
    }

    // For minors, guardian info is required
    if (age < 18) {
      if (!allGuardianFieldsFilled) {
        if (!guardianFields.lastname) {
          ctx.addIssue({
            path: ["guardianLastname"],
            code: z.ZodIssueCode.custom,
            message: "Nom du responsable requis",
          });
        }
        if (!guardianFields.firstname) {
          ctx.addIssue({
            path: ["guardianFirstname"],
            code: z.ZodIssueCode.custom,
            message: "Prénom du responsable requis",
          });
        }
        if (!guardianFields.email) {
          ctx.addIssue({
            path: ["guardianEmail"],
            code: z.ZodIssueCode.custom,
            message: "Email du responsable requis",
          });
        }
        if (!guardianFields.phone) {
          ctx.addIssue({
            path: ["guardianPhone"],
            code: z.ZodIssueCode.custom,
            message: "Téléphone du responsable requis",
          });
        }
      }
    }
  });

export const guardianSchema = z.object({
  guardianLastname: z
    .string()
    .min(1, { message: "Nom du responsable requis" })
    .regex(NAME_REGEX, {
      message: nameInvalidMessage("Le nom du responsable"),
    }),
  guardianFirstname: z
    .string()
    .min(1, { message: "Prénom du responsable requis" })
    .regex(NAME_REGEX, {
      message: nameInvalidMessage("Le prénom du responsable"),
    }),
  guardianEmail: z.string().email({ message: "Email du responsable invalide" }),
  guardianPhone: z
    .string()
    .min(1, { message: "Téléphone requis" })
    .regex(FRENCH_PHONE_REGEX, { message: PHONE_INVALID_MESSAGE }),
  guardianConsent: z
    .boolean()
    .refine((value) => value, "Le responsable doit accepter"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type GuardianInput = z.infer<typeof guardianSchema>;
