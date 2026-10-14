import { z } from "zod";

/** Accept only canonical company IDs as hints, never relationship/tenant IDs from URLs. */
export const tpoDraftCompanyPrefillSchema = z.object({
  companyId: z.string().uuid().optional(),
  company: z.string().trim().min(1).max(200).optional(),
}).strict();

export function resolveTpoDraftCompanyRelationshipId(
  companyId: string | undefined,
  authorizedCompanies: readonly { companyId: string; relationshipId: string }[],
): string | null {
  if (!companyId) return null;
  return authorizedCompanies.find((company) => company.companyId === companyId)?.relationshipId ?? null;
}

/** Company names from recruiter leads are hints, not identity evidence.
 * Only unambiguous active relationships owned by this college may be preselected.
 */
export function resolveTpoDraftCompanyByName(
  companyName: string | undefined,
  authorizedCompanies: readonly { name: string; relationshipId: string }[],
): string | null {
  const normalized = companyName?.trim().toLocaleLowerCase("en-IN");
  if (!normalized) return null;
  const matches = authorizedCompanies.filter(
    (company) => company.name.trim().toLocaleLowerCase("en-IN") === normalized,
  );
  return matches.length === 1 ? matches[0].relationshipId : null;
}
