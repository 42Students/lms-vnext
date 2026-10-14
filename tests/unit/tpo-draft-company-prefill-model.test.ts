import { describe, expect, it } from "vitest";
import {
  resolveTpoDraftCompanyRelationshipId,
  resolveTpoDraftCompanyByName,
  tpoDraftCompanyNameHref,
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

  it("makes a safe recruiter-company draft link without asserting a relationship", () => {
    expect(tpoDraftCompanyNameHref(" ACME & Co "))
      .toBe("/tpo/placements/new/draft?company=ACME%20%26%20Co");
    expect(tpoDraftCompanyNameHref("  ")).toBeNull();
    expect(tpoDraftCompanyNameHref("x".repeat(201))).toBeNull();
  });

  it("requires one exact active college relationship for recruiter name prefill", () => {
    const companies = [{ name: "Acme India", relationshipId }];
    expect(resolveTpoDraftCompanyByName("  acme india  ", companies)).toBe(relationshipId);
    expect(resolveTpoDraftCompanyByName("Not in college", companies)).toBeNull();
    expect(resolveTpoDraftCompanyByName("Acme", companies)).toBeNull();
    expect(resolveTpoDraftCompanyByName("Acme India", [
      ...companies, { name: "ACME INDIA", relationshipId: foreign },
    ])).toBeNull();
    expect(tpoDraftCompanyPrefillSchema.parse({ company: "  Acme India " }).company)
      .toBe("Acme India");
  });

  it("rejects relationship IDs, tenant injection and invalid URL hints", () => {
    expect(tpoDraftCompanyPrefillSchema.parse({ companyId: id }).companyId).toBe(id);
    expect(tpoDraftCompanyPrefillSchema.safeParse({ companyId: "not-a-uuid" }).success).toBe(false);
    expect(tpoDraftCompanyPrefillSchema.safeParse({ companyId: id, collegeId: foreign }).success)
      .toBe(false);
  });
});
