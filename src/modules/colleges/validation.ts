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
  .min(1, "College code is required")
  .max(64, "College code must be 64 characters or less");

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
