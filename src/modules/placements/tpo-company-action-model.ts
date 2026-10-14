import type { TpoCompanyRow } from "./tpo-companies-view-model";

/** Only an actual canonical college-linked relationship can open a prefilled draft. */
export function tpoCompanyDraftHref(company: Pick<TpoCompanyRow, "companyId" | "relationshipId" | "unlinkedLeadGroup">): string | null {
  if (company.unlinkedLeadGroup || !company.companyId || !company.relationshipId) return null;
  return "/tpo/placements/new/draft?companyId=" + encodeURIComponent(company.companyId);
}

/** Persisted offer IDs are scoped again in the destination's TPO detail loader. */
export function tpoCompanyOfferDetailHref(jobId: string, offerId: string) {
  return "/tpo/placements/jobs/" + encodeURIComponent(jobId)
    + "/offers/" + encodeURIComponent(offerId);
}
