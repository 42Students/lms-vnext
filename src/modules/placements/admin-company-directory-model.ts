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
  sort: z.enum(["NAME","NAME_DESC","RECENT","DRIVES","DRIVES_ASC","LAST_ACTIVE","LAST_ACTIVE_ASC"]).default("LAST_ACTIVE"),
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
  // Compatibility for old company-list bookmarks. Public page numbers in
  // vNext remain one-based; the explicit legacyPage alias is zero-based.
  const filters = Object.fromEntries(
    Object.entries(params).filter(([key]) =>
      key !== "view" && key !== "legacyPage" && key !== "unverified"),
  );
  if (filters.collegeId === "") delete filters.collegeId;
  const legacyPage=params.legacyPage;
  if (legacyPage !== undefined){
    if(typeof legacyPage!=="string" || !/^(0|[1-9][0-9]*)$/.test(legacyPage)
       || params.page !== undefined || Number(legacyPage)>9999){
      return adminCompaniesQuerySchema.safeParse({...filters,legacyPage});
    }
    filters.page=String(Number(legacyPage)+1);
  }
  const unverified=params.unverified;
  if(unverified!==undefined){
    if((unverified!=="true"&&unverified!=="false")||params.verified!==undefined)
      return adminCompaniesQuerySchema.safeParse({...filters,unverified});
    filters.verified=unverified==="true"?"NOT_VERIFIED":"VERIFIED";
  }
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
  // Optional because the company creator may be a different college from
  // the relationship shown in this scope. Never infer it from collegeName.
  addedByCollegeName?: string | null;
  addedByCollegeId?: string | null;
  domains?: readonly string[]; aliases?: readonly string[];
  primaryDomain?:string|null; companyCollegeCount?:number; driveCount?:number;
  lastActiveAt?:Date|null; createdAt?:Date;
};
export function projectAdminCompanies(rows: readonly AdminCompanyRow[]) {
  return {
    rows,
    // Preserve one relationship per college while also exposing unique
    // company identities for global curation views (first occurrence only).
    companies: [...new Map(rows.map(row=>[row.companyId,row])).values()],
    distinctCompanies: new Set(rows.map(row => row.companyId)).size,
    relationships: rows.length,
    trustedRelationships: rows.filter(row => row.trusted).length,
    archivedCompaniesOnPage:new Set(rows.filter(row=>row.companyStatus==="ARCHIVED").map(row=>row.companyId)).size,
    visibleCompaniesOnPage:new Set(rows.filter(row=>row.companyStatus==="ACTIVE"&&row.relationshipStatus==="ACTIVE").map(row=>row.companyId)).size,
    relationshipsWithDrivesOnPage:rows.filter(row=>(row.driveCount??0)>0).length,
  };
}
