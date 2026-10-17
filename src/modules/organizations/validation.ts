import { z } from "zod";

export const organizationIdSchema = z.string().uuid();

export const organizationNameSchema = z
  .string()
  .trim()
  .min(1, "Please enter organization name")
  .max(255, "Organization name must be 255 characters or less")
  .transform(name=>name.replace(/\\s+/g," "));

export const createOrganizationInputSchema = z.object({
  name: organizationNameSchema,
});

export const renameOrganizationInputSchema = z.object({
  name: organizationNameSchema,
});

export type CreateOrganizationInput = z.infer<
  typeof createOrganizationInputSchema
>;
export type RenameOrganizationInput = z.infer<
  typeof renameOrganizationInputSchema
>;
