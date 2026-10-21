import { z } from "zod";

/** Do not interpret hexadecimal, exponent or array URL values as page numbers. */
const strictCompanyPage = z.union([
  z.number().int().min(1).max(10000),
  z.string().regex(/^[1-9][0-9]*$/).transform(Number).pipe(z.number().int().min(1).max(10000)),
]);

export const adminCompaniesQuerySchema = z.strictObject({
  q: z.string().trim().max(100).default(""),
  status: z.enum(["ALL", "ACTIVE", "ARCHIVED"]).default("ACTIVE"),
  companyStatus: z.enum(["MATCH","ALL","ACTIVE","ARCHIVED"]).default("MATCH"),
  trust: z.enum(["ALL", "TRUSTED", "UNTRUSTED"]).default("ALL"),
  verified: z.enum(["ALL", "VERIFIED", "NOT_VERIFIED"]).default("ALL"),
  page: strictCompanyPage.default(1),
  collegeId: z.uuid().optional(),
  companyId: z.uuid().optional(),
  sort: z.enum(["NAME","RECENT","DRIVES","LAST_ACTIVE"]).default("LAST_ACTIVE"),
  searchField: z.enum(["ALL","NAME","DOMAIN"]).default("ALL"),
  owner: z.enum(["ALL","ASSIGNED","UNASSIGNED"]).default("ALL"),
  website: z.enum(["ALL","HAS_WEBSITE","MISSING_WEBSITE"]).default("ALL"),
  changedWithin: z.enum(["ALL","7","30","90"]).default("ALL"),
});
/** Parse the entire external company search URL, preserving only the legacy
 * view tab outside the strict relationship filters. This rejects unrecognized
 * tenant selectors, array/duplicate values and malformed view aliases.
 */
export function parseAdminCompanyDirectoryParams(
  params: Record<string, string | string[] | undefined>,
) {
  const validView = params.view === undefined || params.view === "GLOBAL" ||
    params.view === "COLLEGE";
  const filters = Object.fromEntries(
    Object.entries(params).filter(([key]) => key !== "view"),
  );
  if (filters.collegeId === "") delete filters.collegeId;
  return adminCompaniesQuerySchema.safeParse(
    validView ? filters : { ...filters, view: params.view },
  );
}

export type AdminCompanyRow = {
  relationshipId: string; companyId: string; name: string; collegeId: string;
  collegeName: string; organizationId: string; relationshipStatus: string;
  companyStatus: string; trusted: boolean; verifiedAt?: Date | null; website: string | null;
  industry?: string | null; about?: string | null; logoPublicUrl?: string | null;
  updatedAt?: Date;
  addedByType?: string;
  domains?: readonly string[]; aliases?: readonly string[];
  primaryDomain?:string|null; companyCollegeCount?:number; driveCount?:number;
  lastActiveAt?:Date|null; createdAt?:Date;
};
export function projectAdminCompanies(rows: readonly AdminCompanyRow[]) {
  return {
    rows,
    distinctCompanies: new Set(rows.map(row => row.companyId)).size,
    relationships: rows.length,
    trustedRelationships: rows.filter(row => row.trusted).length,
    archivedCompaniesOnPage:new Set(rows.filter(row=>row.companyStatus==="ARCHIVED").map(row=>row.companyId)).size,
    visibleCompaniesOnPage:new Set(rows.filter(row=>row.companyStatus==="ACTIVE"&&row.relationshipStatus==="ACTIVE").map(row=>row.companyId)).size,
    relationshipsWithDrivesOnPage:rows.filter(row=>(row.driveCount??0)>0).length,
  };
}
