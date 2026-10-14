import { describe, expect, it } from "vitest";
import {
  tpoCompanyDraftHref,
  tpoCompanyOfferDetailHref,
} from "@/modules/placements/tpo-company-action-model";

const companyId = "00000000-0000-4000-8000-000000000001";
const relationshipId = "00000000-0000-4000-8000-000000000002";
describe("TPO company hiring records", () => {
  it("links to the exact persisted offer, not just its drive", () => {
    expect(tpoCompanyOfferDetailHref(companyId, relationshipId))
      .toBe("/tpo/placements/jobs/" + companyId + "/offers/" + relationshipId);
  });
});

describe("TPO company directory draft link", () => {
  it("deep links only canonical college-linked employers", () => {
    expect(tpoCompanyDraftHref({ companyId, relationshipId, unlinkedLeadGroup: false }))
      .toBe("/tpo/placements/new/draft?companyId=" + companyId);
    expect(tpoCompanyDraftHref({ companyId: null, relationshipId: null, unlinkedLeadGroup: true }))
      .toBeNull();
    expect(tpoCompanyDraftHref({ companyId, relationshipId: null, unlinkedLeadGroup: false }))
      .toBeNull();
  });
});
