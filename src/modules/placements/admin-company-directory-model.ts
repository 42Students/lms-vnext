import { z } from "zod";

export const adminCompaniesQuerySchema = z.strictObject({
  q: z.string().trim().max(100).default(""),
  status: z.enum(["ALL", "ACTIVE", "ARCHIVED"]).default("ACTIVE"),
  companyStatus: z.enum(["MATCH","ALL","ACTIVE","ARCHIVED"]).default("MATCH"),
  trust: z.enum(["ALL", "TRUSTED", "UNTRUSTED"]).default("ALL"),
  verified: z.enum(["ALL", "VERIFIED", "NOT_VERIFIED"]).default("ALL"),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  collegeId: z.uuid().optional(),
  companyId: z.uuid().optional(),
  sort: z.enum(["NAME","RECENT"]).default("NAME"),
  searchField: z.enum(["ALL","NAME","DOMAIN"]).default("ALL"),
  owner: z.enum(["ALL","ASSIGNED","UNASSIGNED"]).default("ALL"),
  website: z.enum(["ALL","HAS_WEBSITE","MISSING_WEBSITE"]).default("ALL"),
  changedWithin: z.enum(["ALL","7","30","90"]).default("ALL"),
});
export type AdminCompanyRow = {
  relationshipId: string; companyId: string; name: string; collegeId: string;
  collegeName: string; organizationId: string; relationshipStatus: string;
  companyStatus: string; trusted: boolean; verifiedAt?: Date | null; website: string | null;
  industry?: string | null; about?: string | null; logoPublicUrl?: string | null;
  updatedAt?: Date;
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
