import { z } from "zod";

export const placementCompanyIdSchema = z.string().uuid();
export const placementCompanyRelationshipIdSchema = z.string().uuid();

const httpUrlSchema = z
  .string()
  .trim()
  .url()
  .refine((value) => {
    const protocol = new URL(value).protocol;
    return protocol === "https:" || protocol === "http:";
  }, "Use an http or https URL");

export const placementCompanyDomainSchema = z
  .string()
  .trim()
  .toLowerCase()
  .transform((value) => value.replace(/^www\./, ""))
  .pipe(
    z
      .string()
      .min(3)
      .max(255)
      .regex(
        /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/,
        "Enter a domain without protocol, path or email prefix",
      )
      .refine((value) => value.includes("."), "Enter a complete domain"),
  );

export const createPlacementCompanyInputSchema = z
  .object({
    collegeId: z.string().uuid(),
    name: z.string().trim().min(2).max(200),
    websiteUrl: httpUrlSchema.optional(),
    primaryDomain: placementCompanyDomainSchema.optional(),
    isTrusted: z.boolean().optional().default(false),
  })
  .strict();

export const updatePlacementCompanyRelationshipInputSchema = z
  .object({
    isTrusted: z.boolean().optional(),
    ownerMembershipId: z.string().uuid().nullable().optional(),
  })
  .strict()
  .refine(
    (value) =>
      value.isTrusted !== undefined ||
      value.ownerMembershipId !== undefined,
    "Provide at least one relationship field",
  );

export type CreatePlacementCompanyInput = z.infer<
  typeof createPlacementCompanyInputSchema
>;
export type UpdatePlacementCompanyRelationshipInput = z.infer<
  typeof updatePlacementCompanyRelationshipInputSchema
>;
