import { z } from "zod";

export const baseGameSchema = z.object({
  title: z
    .string()
    .min(3, "Le titre doit contenir au moins 3 caractères")
    .max(100, "Le titre ne peut pas dépasser 100 caractères"),
  description: z
    .string()
    .max(2000, "La description ne peut pas dépasser 2000 caractères")
    .optional(),
  startDateTime: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Date de début invalide",
    })
    .refine((val) => new Date(val).getTime() > Date.now(), {
      message: "La date de début doit être dans le futur",
    }),
  address: z.string().min(5, "L'adresse est requise"),
  price: z.coerce
    .number({ invalid_type_error: "Le prix doit être un nombre" })
    .min(0, "Le prix doit être positif"),
  maxPlaces: z.coerce
    .number({ invalid_type_error: "Le nombre de places doit être un nombre" })
    .int("Le nombre de places doit être un entier")
    .min(1, "Il faut au moins 1 place")
    .max(200, "Maximum 200 places"),
  isPublic: z.boolean().default(true),
});

export const createGameSchema = baseGameSchema;
export type CreateGameInput = z.infer<typeof createGameSchema>;

export const updateGameSchema = baseGameSchema.partial();
export type UpdateGameInput = z.infer<typeof updateGameSchema>;
