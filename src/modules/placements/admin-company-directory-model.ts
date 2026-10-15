import { z } from "zod";

export const adminCompaniesQuerySchema = z.strictObject({
  q: z.string().trim().max(100).default(""),
  status: z.enum(["ALL", "ACTIVE", "ARCHIVED"]).default("ACTIVE"),
  trust: z.enum(["ALL", "TRUSTED", "UNTRUSTED"]).default("ALL"),
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
