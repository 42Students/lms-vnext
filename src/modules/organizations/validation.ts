import { z } from "zod";

export const organizationIdSchema = z.string().uuid();

export const organizationNameSchema = z
  .string()
  .trim()
  .min(1, "Organization name is required")
  .max(255, "Organization name must be 255 characters or less")
  .transform(name=>name.replace(/\s+/g," "));

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

/** Never send a raw database uniqueness violation to a user. */
export function organizationNameErrorMessage(code:string):string|null {
  return code==="ORGANIZATION_NAME_CONFLICT"
    ? "Organization name already exists" : null;
}
