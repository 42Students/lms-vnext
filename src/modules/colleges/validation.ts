import { z } from "zod";

export const collegeIdSchema = z.string().uuid();
export const collegeOrganizationIdSchema = z.string().uuid();

/** Legacy CollegeDTO accepted up to 255 characters for location and
 * postal fields. PostgreSQL stores city/state/country at 128 and postal code
 * at 32; reject overlength legacy values with actionable field errors rather
 * than truncate or let a database exception lose the entire edit. */
const optionalText = (max: number, field = "Field") =>
  z.string().trim().max(max,`${field} must be ${max} characters or less; review the legacy value before importing.`).optional().nullable();

/** A legacy uniqueId may be 255 arbitrary characters. Never silently
 * reinterpret it as a vNext routing code, especially where collisions would
 * merge two different colleges. The migration needs a verified ID crosswalk. */
export const legacyCollegeIdentitySchema = z.strictObject({
  legacyOrganizationId:z.union([z.number().int().nonnegative(),z.string().trim().min(1)]),
  legacyUniqueId:z.string().trim().min(1).max(255),
  organizationId:collegeOrganizationIdSchema,
  mappedCode:z.string().trim().toLowerCase().regex(/^[a-z0-9-]{3,63}$/,
   "Map the legacy Unique ID to a distinct 3–63-character lowercase routing code."),
});

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

/** Organization UUID replaces legacy numeric orgId. A college's managed
 * hostname is allocated only through the verified tenant-domain service;
 * creation/editing must not upsert arbitrary legacy domain names. */
export const createCollegeInputSchema = z.object({
  organizationId: collegeOrganizationIdSchema,
  name: collegeNameSchema,
  code: collegeCodeSchema,
  logoObjectPath: optionalText(2048),
  addressLine1: optionalText(255),
  addressLine2: optionalText(255),
  landmark: optionalText(255),
  city: optionalText(128,"City"),
  state: optionalText(128,"State"),
  country: optionalText(128,"Country"),
  postalCode: optionalText(32,"Pin Code"),
});

export const updateCollegeInputSchema = z
  .object({
    name: collegeNameSchema.optional(),
    logoObjectPath: optionalText(2048),
    addressLine1: optionalText(255),
    addressLine2: optionalText(255),
    landmark: optionalText(255),
    city: optionalText(128,"City"),
    state: optionalText(128,"State"),
    country: optionalText(128,"Country"),
    postalCode: optionalText(32,"Pin Code"),
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
