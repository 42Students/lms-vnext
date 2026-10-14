import { describe, expect, it } from "vitest";
import { tpoRecruiterGrantChangeSchema, isRecruiterGrantStale } from "@/modules/placements/tpo-recruiter-grant-write-model";
const id = "10000000-0000-4000-8000-000000000001";
describe("TPO recruiter grants Zod and stale-state policy", () => {
  it("requires confirmation, active company relationship, normalized email and no forged tenant", () => {
    const input = { action: "GRANT", confirmed: true, companyRelationshipId: id, email: "  NEW@EXAMPLE.COM " };
    expect(tpoRecruiterGrantChangeSchema.parse(input)).toMatchObject({ email: "new@example.com" });
    expect(tpoRecruiterGrantChangeSchema.safeParse({ ...input, confirmed: false }).success).toBe(false);
    expect(tpoRecruiterGrantChangeSchema.safeParse({ ...input, collegeId: id }).success).toBe(false);
    expect(tpoRecruiterGrantChangeSchema.safeParse({ ...input, email: "invalid" }).success).toBe(false);
  });
  it("rejects stale revoke snapshots", () => {
    const changed = new Date("2026-10-14T12:00:00.000Z");
    expect(isRecruiterGrantStale(changed, changed.toISOString())).toBe(false);
    expect(isRecruiterGrantStale(changed, "2026-10-14T11:00:00.000Z")).toBe(true);
    expect(tpoRecruiterGrantChangeSchema.safeParse({
      action: "REVOKE", confirmed: true, grantId: id, expectedUpdatedAt: changed.toISOString(),
    }).success).toBe(true);
    expect(tpoRecruiterGrantChangeSchema.safeParse({
      action: "REVOKE", confirmed: true, grantId: id, expectedUpdatedAt: "yesterday",
    }).success).toBe(false);
  });
});
