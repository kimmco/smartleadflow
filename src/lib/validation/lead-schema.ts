import { z } from "zod";

export const leadSchema = z.object({
  firstName: z
    .string()
    .min(2)
    .max(100),

  lastName: z
    .string()
    .max(100)
    .optional(),

  email: z
    .email(),

  phone: z
    .string()
    .min(9)
    .max(20),

  location: z
    .string()
    .min(2)
    .max(100),

  propertyType: z.enum([
    "RESIDENTIAL",
    "COMMERCIAL",
  ]),

  monthlyElectricityBill: z
    .number()
    .positive(),

  backupRequired: z
    .boolean(),

  preferredInstallationDate: z
    .string()
    .optional(),

  source: z
    .string()
    .optional(),

  consent: z
    .boolean()
    .refine(
      value => value === true,
      {
        message: "Consent is required",
      }
    ),
});

export type LeadInput =
  z.infer<typeof leadSchema>;