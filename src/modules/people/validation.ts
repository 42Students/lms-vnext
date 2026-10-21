import { z } from "zod";
import { MEMBERSHIP_ROLES, MEMBERSHIP_ROLE_LABELS, resolveLegacyAccountRole,
 type MembershipRole } from "@/modules/identity/constants";

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
/** Legacy seed values admin/user are NOT active role claims. The old admin
 * maps to COLLEGE_ADMIN under its selected college; the old generic user is
 * ambiguous and must be mapped to a learner/faculty from real membership data.
 */
export const MEMBERSHIP_ROLE_LEGACY_HELP={
 admin:"Old Admin accounts map to College Admin within their college.",
 user:"Old User accounts need an explicit Learner or Faculty membership.",
} as const;
export const MEMBERSHIP_ROLE_PICKER_OPTIONS:ReadonlyArray<{
 value:MembershipRole;label:string;description:string;
 }>=MEMBERSHIP_ROLES.map(value=>({value,label:MEMBERSHIP_ROLE_LABELS[value],
  description:value==="COLLEGE_ADMIN"?"Manage college settings and people":
   value==="TPO"?"Manage placement operations":
   value==="MENTOR"?"Guide assigned project teams":
   value==="FACULTY"?"Teach and manage course delivery":
    "Learn through courses and activities",
 }));
export function legacyRolePickerResolution(role:string,facultyType?:string|null){
 return resolveLegacyAccountRole(role,facultyType);
}

export const identityProvisionInputSchema = z
  .object({
    phoneE164: phoneE164Schema.optional(),
    email: personEmailSchema.optional(),
    displayName: personDisplayNameSchema,
  })
  .refine(
    (value) => Boolean(value.phoneE164 || value.email),
    {
      message: "Email or phone is required",
      path: ["email"],
    },
  );

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
  q: z.string().trim().max(100).default(""),
  role: z.enum(["ALL", ...MEMBERSHIP_ROLES]).default("ALL"),
  status: z.enum(["ALL", "ACTIVE", "SUSPENDED", "ENDED"]).default("ALL"),
}).strict();

export const membershipRoleMutationInputSchema = z.object({
  role: membershipRoleInputSchema,
});

const suspensionReasonSchema = z
  .string()
  .trim()
  .min(1, "Suspension reason is required")
  .max(1000, "Suspension reason must be 1000 characters or less");

export const membershipLifecycleInputSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("SUSPEND"),
    reason: suspensionReasonSchema,
  }),
  z.object({
    action: z.literal("REACTIVATE"),
  }),
  z.object({
    action: z.literal("END"),
  }),
]);

export type IdentityProvisionInput = z.infer<
  typeof identityProvisionInputSchema
>;
export type OnboardPersonInput = z.infer<typeof onboardPersonInputSchema>;
export type ListCollegePeopleQuery = z.infer<
  typeof listCollegePeopleQuerySchema
>;
export type MembershipRoleMutationInput = z.infer<
  typeof membershipRoleMutationInputSchema
>;
export type MembershipLifecycleInput = z.infer<
  typeof membershipLifecycleInputSchema
>;
