import { z } from "zod";

export const collegeIdSchema = z.string().uuid();
export const collegeOrganizationIdSchema = z.string().uuid();

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().nullable();

export const collegeNameSchema = z
  .string()
  .trim()
  .min(1, "College name is required")
  .max(255, "College name must be 255 characters or less");

export const collegeCodeSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9-]{3,63}$/, "Unique ID must be 3-63 chars, lowercase letters/numbers/hyphen only.");

export const createCollegeInputSchema = z.object({
  organizationId: collegeOrganizationIdSchema,
  name: collegeNameSchema,
  code: collegeCodeSchema,
  logoObjectPath: optionalText(2048),
  addressLine1: optionalText(255),
  addressLine2: optionalText(255),
  landmark: optionalText(255),
  city: optionalText(128),
  state: optionalText(128),
  country: optionalText(128),
  postalCode: optionalText(32),
});

export const updateCollegeInputSchema = z
  .object({
    name: collegeNameSchema.optional(),
    logoObjectPath: optionalText(2048),
    addressLine1: optionalText(255),
    addressLine2: optionalText(255),
    landmark: optionalText(255),
    city: optionalText(128),
    state: optionalText(128),
    country: optionalText(128),
    postalCode: optionalText(32),
    // Post-creation appointments: both IDs must be current membership UUIDs
    // of this college (the DB enforces composite college scope).
    chairMembershipId: z.string().uuid().nullable().optional(),
    viceChairMembershipId: z.string().uuid().nullable().optional(),
  })
  .refine(
    (value) => Object.values(value).some((item) => item !== undefined),
    "At least one field must be provided",
  );

export type CreateCollegeInput = z.infer<
  typeof createCollegeInputSchema
>;
export type UpdateCollegeInput = z.infer<
  typeof updateCollegeInputSchema
>;
