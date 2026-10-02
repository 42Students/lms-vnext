import { z } from "zod";
import { MEMBERSHIP_ROLES } from "@/modules/identity/constants";

export const personCollegeIdSchema = z.string().uuid();
export const personMembershipIdSchema = z.string().uuid();

export const phoneE164Schema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s().-]/g, ""))
  .refine(
    (value) => /^\+[1-9]\d{1,14}$/.test(value),
    "Phone must be a valid E.164 number including country code",
  );

export const personEmailSchema = z
  .string()
  .trim()
  .email()
  .max(320)
  .transform((value) => value.toLowerCase());

export const personDisplayNameSchema = z
  .string()
  .trim()
  .min(1, "Display name is required")
  .max(255, "Display name must be 255 characters or less");

export const membershipRoleInputSchema = z.enum(MEMBERSHIP_ROLES);

export const onboardPersonInputSchema = z.object({
  collegeId: personCollegeIdSchema,
  phoneE164: phoneE164Schema,
  email: personEmailSchema.optional(),
  displayName: personDisplayNameSchema,
  roles: z
    .array(membershipRoleInputSchema)
    .min(1, "At least one membership role is required")
    .transform((roles) => [...new Set(roles)]),
});

export const listCollegePeopleQuerySchema = z.object({
  collegeId: personCollegeIdSchema,
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type OnboardPersonInput = z.infer<typeof onboardPersonInputSchema>;
export type ListCollegePeopleQuery = z.infer<
  typeof listCollegePeopleQuerySchema
>;
