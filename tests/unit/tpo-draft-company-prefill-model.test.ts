import { describe, expect, it } from "vitest";
import {
  resolveTpoDraftCompanyRelationshipId,
  tpoDraftCompanyPrefillSchema,
} from "@/modules/placements/tpo-draft-company-prefill-model";

const id = "00000000-0000-4000-8000-000000000001";
const relationshipId = "00000000-0000-4000-8000-000000000002";
const foreign = "00000000-0000-4000-8000-000000000003";

describe("TPO draft company prefill", () => {
  it("selects only a company from the authorized relationship list", () => {
    expect(resolveTpoDraftCompanyRelationshipId(id, [{ companyId: id, relationshipId }]))
      .toBe(relationshipId);
    expect(resolveTpoDraftCompanyRelationshipId(foreign, [{ companyId: id, relationshipId }]))
      .toBeNull();
    expect(resolveTpoDraftCompanyRelationshipId(id, []))
      .toBeNull();
  });

  it("rejects relationship IDs, tenant injection and invalid URL hints", () => {
    expect(tpoDraftCompanyPrefillSchema.parse({ companyId: id }).companyId).toBe(id);
    expect(tpoDraftCompanyPrefillSchema.safeParse({ companyId: "not-a-uuid" }).success).toBe(false);
    expect(tpoDraftCompanyPrefillSchema.safeParse({ companyId: id, collegeId: foreign }).success)
      .toBe(false);
  });
});
