import { z } from "zod";
import {
  personDisplayNameSchema,
  personEmailSchema,
  phoneE164Schema,
} from "@/modules/people/validation";

export const superAdminHrUserIdSchema =
  z.string().uuid();

export const superAdminHrGrantIdSchema =
  z.string().uuid();

export const superAdminHrRelationshipIdSchema =
  z.string().uuid();

const hrTitleSchema = z
  .string()
  .trim()
  .min(1)
  .max(160);

export const superAdminHrListQuerySchema = z
  .object({
    q: z.string().trim().max(120).optional(),
    status: z
      .enum(["ACTIVE", "ARCHIVED", "DISABLED"])
      .optional(),
    page: z.coerce.number().int().min(1).max(10000).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(25),
  })
  .strict();

export const createSuperAdminHrInputSchema = z
  .object({
    companyRelationshipId:
      superAdminHrRelationshipIdSchema,
    companyRelationshipIds:z.array(superAdminHrRelationshipIdSchema).max(20).optional(),
    displayName: personDisplayNameSchema,
    phoneE164: phoneE164Schema,
    email: personEmailSchema.optional(),
    title: hrTitleSchema.nullable().optional(),
  })
  .strict();

export const updateSuperAdminHrInputSchema = z
  .object({
    displayName: personDisplayNameSchema.optional(),
    phoneE164: phoneE164Schema.optional(),
    email: personEmailSchema.optional(),
    title: hrTitleSchema.nullable().optional(),
    status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
  })
  .strict()
  .refine(
    (value) =>
      Object.values(value).some(
        (field) => field !== undefined,
      ),
    "Provide at least one account field",
  );

export const grantSuperAdminHrCollegeInputSchema = z
  .object({
    companyRelationshipId:
      superAdminHrRelationshipIdSchema,
    validUntil: z.iso.datetime({offset:true}).optional(),
  })
  .strict();

export type SuperAdminHrListQuery = z.input<
  typeof superAdminHrListQuerySchema
>;

export type CreateSuperAdminHrInput = z.input<
  typeof createSuperAdminHrInputSchema
>;

export type UpdateSuperAdminHrInput = z.input<
  typeof updateSuperAdminHrInputSchema
>;

export type GrantSuperAdminHrCollegeInput = z.input<
  typeof grantSuperAdminHrCollegeInputSchema
>;

export type SuperAdminHrStatus =
  | "ACTIVE"
  | "ARCHIVED"
  | "DISABLED";

export function effectiveSuperAdminHrStatus(
  platformStatus: "ACTIVE" | "DISABLED",
  recruiterStatus: string,
): SuperAdminHrStatus {
  if (platformStatus === "DISABLED") {
    return "DISABLED";
  }

  return recruiterStatus === "ARCHIVED"
    ? "ARCHIVED"
    : "ACTIVE";
}

export function assertSuperAdminHrCompanyMatch(
  profileCompanyId: string,
  relationshipCompanyId: string,
) {
  if (profileCompanyId !== relationshipCompanyId) {
    return false;
  }

  return true;
}

/** Reject duplicated/unknown URL keys rather than silently choosing one recruiter filter. */
export function parseSuperAdminHrPageParams(raw:Record<string,string|string[]|undefined>){
 if(Object.keys(raw).some(key=>!["q","status","page","pageSize"].includes(key)))return null;
 if(Object.values(raw).some(Array.isArray))return null;
 const normalized={
  q:typeof raw.q==="string"&&raw.q.trim()?raw.q:undefined,
  status:raw.status===""?undefined:raw.status,
  page:raw.page===""?undefined:raw.page,
  pageSize:raw.pageSize===""?undefined:raw.pageSize,
 };
 const result=superAdminHrListQuerySchema.safeParse(normalized);
 return result.success?result.data:null;
}
