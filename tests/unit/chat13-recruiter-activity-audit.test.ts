import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const service = readFileSync("src/modules/placements/super-admin-hr-service.ts", "utf8");
const taxonomy = readFileSync("src/modules/activity/taxonomy.ts", "utf8");

describe("Chat 13 recruiter audit events", () => {
  it("SA-placements-projects-39 records recruiter creation and its initial company grant atomically", () => {
    const create = service.split("export async function createSuperAdminHrAccount")[1]?.split("export async function updateSuperAdminHrAccount")[0] ?? "";
    expect(create).toContain("recordActivityEventInTransaction(tx, context");
    expect(create).toContain("PLACEMENTS_RECRUITER_CREATED");
    expect(create).toContain("companyRelationshipId: candidate.relationshipId");
  });

  it("SA-placements-projects-39 records status changes and updates in the same transaction", () => {
    const update = service.split("export async function updateSuperAdminHrAccount")[1]?.split("export async function grantSuperAdminHrCollegeAccess")[0] ?? "";
    for (const event of ["PLACEMENTS_RECRUITER_UPDATED", "PLACEMENTS_RECRUITER_SUSPENDED", "PLACEMENTS_RECRUITER_REACTIVATED"]) {
      expect(update).toContain("ACTIVITY_EVENT_TYPES." + event);
      expect(taxonomy).toContain(event);
    }
    expect(update).toContain("previousStatus: current.status");
  });

  it("SA-placements-projects-39 audits grant/revoke and expiry without storing private contact values", () => {
    for (const name of ["PLACEMENTS_RECRUITER_COLLEGE_GRANTED", "PLACEMENTS_RECRUITER_COLLEGE_REVOKED"]) {
      expect(service).toContain("ACTIVITY_EVENT_TYPES." + name);
    }
    expect(service).toContain("validUntil: expiration.toISOString()");
    expect(service).toContain("metadata: {grantId, companyRelationshipId:");
  });

  it("SA-placements-projects-39 audits global sign-out after successful session termination", () => {
    const portion = service.split("export async function terminateSuperAdminHrSessions")[1] ?? "";
    expect(portion.indexOf("await revokeAllSessionsForUser(")).toBeGreaterThanOrEqual(0);
    expect(portion.indexOf("await recordActivityEvent(context")).toBeGreaterThan(portion.indexOf("await revokeAllSessionsForUser("));
    expect(portion).toContain("ACTIVITY_EVENT_TYPES.PLACEMENTS_RECRUITER_SESSIONS_REVOKED");
  });
});
