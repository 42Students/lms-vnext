import { z } from "zod";

/** Accept only canonical company IDs as hints, never relationship/tenant IDs from URLs. */
export const tpoDraftCompanyPrefillSchema = z.object({
  companyId: z.string().uuid().optional(),
}).strict();

export function resolveTpoDraftCompanyRelationshipId(
  companyId: string | undefined,
  authorizedCompanies: readonly { companyId: string; relationshipId: string }[],
): string | null {
  if (!companyId) return null;
  return authorizedCompanies.find((company) => company.companyId === companyId)?.relationshipId ?? null;
}
