import { z } from "zod";

export const adminCompaniesQuerySchema = z.strictObject({
  q: z.string().trim().max(100).default(""),
  status: z.enum(["ALL", "ACTIVE", "ARCHIVED"]).default("ACTIVE"),
  companyStatus: z.enum(["MATCH","ALL","ACTIVE","ARCHIVED"]).default("MATCH"),
  trust: z.enum(["ALL", "TRUSTED", "UNTRUSTED"]).default("ALL"),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  collegeId: z.uuid().optional(),
  companyId: z.uuid().optional(),
  sort: z.enum(["NAME","RECENT"]).default("NAME"),
  searchField: z.enum(["NAME","DOMAIN"]).default("NAME"),
});
export type AdminCompanyRow = {
  relationshipId: string; companyId: string; name: string; collegeId: string;
  collegeName: string; organizationId: string; relationshipStatus: string;
  companyStatus: string; trusted: boolean; website: string | null;
};
export function projectAdminCompanies(rows: readonly AdminCompanyRow[]) {
  return {
    rows,
    distinctCompanies: new Set(rows.map(row => row.companyId)).size,
    relationships: rows.length,
    trustedRelationships: rows.filter(row => row.trusted).length,
  };
}
