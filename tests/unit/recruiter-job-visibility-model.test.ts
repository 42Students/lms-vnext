import { describe, expect, it } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import { isRecruiterJobVisible } from "@/modules/placements/recruiter-job-visibility-model";
const uid = "00000000-0000-4000-8000-000000000001";
const college = "00000000-0000-4000-8000-000000000002";
const relationship = "00000000-0000-4000-8000-000000000003";
const ctx: RequestContext = {
  user: { id: uid, identityUid: "test", platformStatus: "ACTIVE", systemRoles: [] },
  membership: null,
  recruiter: { userId: uid, companyId: uid, companyName: "Own Co", status: "ACTIVE", title: null,
    grants: [{ id: uid, organizationId: uid, collegeId: college, collegeName: "A",
      companyRelationshipId: relationship }] },
};
describe("recruiter job visibility", () => {
  it("allows exact granted relationship and college only", () => {
    expect(isRecruiterJobVisible(ctx, college, relationship)).toBe(true);
    expect(isRecruiterJobVisible(ctx, uid, relationship)).toBe(false);
    expect(isRecruiterJobVisible(ctx, college, uid)).toBe(false);
  });
  it("rejects wrong-role, disabled and stale grants", () => {
    expect(isRecruiterJobVisible({ ...ctx, recruiter: null, membership: { id: uid, collegeId: college, organizationId: uid, status: "ACTIVE", roles: ["TPO"] } },
      college, relationship)).toBe(false);
    expect(isRecruiterJobVisible({ ...ctx, user: { ...ctx.user, platformStatus: "DISABLED" } }, college, relationship)).toBe(false);
    expect(isRecruiterJobVisible({ ...ctx, recruiter: { ...ctx.recruiter!, grants: [] } }, college, relationship)).toBe(false);
  });
});
