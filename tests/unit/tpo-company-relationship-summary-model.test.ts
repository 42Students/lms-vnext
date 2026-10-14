import { describe, expect, it } from "vitest";
import { projectTpoCompanyRelationshipSummary } from "@/modules/placements/tpo-company-relationship-summary-model";
describe("TPO persisted company relationship display", () => {
  it("differentiates college-local trust from identity and exposes an ISO date", () => {
    expect(projectTpoCompanyRelationshipSummary({
      status: "ACTIVE", isTrusted: true, updatedAt: "2026-10-14T13:01:23.123Z",
    })).toEqual({
      relationshipStatus: "ACTIVE", trustLabel: "Trusted", isTrusted: true,
      updatedAt: "2026-10-14T13:01:23.123Z",
    });
    expect(projectTpoCompanyRelationshipSummary({
      status: "ARCHIVED", isTrusted: false, updatedAt: "2026-10-14T13:01:23.123Z",
    })?.trustLabel).toBe("Not verified");
  });
  it("keeps missing relationship unavailable", () => {
    expect(projectTpoCompanyRelationshipSummary(null)).toBeNull();
  });
});
