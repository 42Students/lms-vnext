import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("SA-DRIVE-ARCHIVE-NOTIFY-05 corrupted imported applications cannot notify outsiders", () => {
  it("requires college-membership pairing when selecting archive recipients", () => {
    const code=readFileSync("src/modules/placements/super-admin-drive-archive-service.ts","utf8");
    const begin=code.indexOf("const recipients=await tx.select(");
    const end=code.indexOf("const distinct=",begin);
    expect(begin).toBeGreaterThan(0);
    expect(end).toBeGreaterThan(begin);
    const recipientQuery=code.slice(begin,end);
    expect(recipientQuery).toContain(".from(placementApplications)");
    expect(recipientQuery).toContain("eq(collegeMemberships.id,placementApplications.membershipId)");
    expect(recipientQuery).toContain("eq(collegeMemberships.collegeId,acting.collegeId)");
    expect(recipientQuery).toContain("eq(placementApplications.jobId,jobId)");
    expect(recipientQuery).not.toContain(".innerJoin(collegeMemberships,eq(collegeMemberships.id,placementApplications.membershipId))");
    expect(code).toContain("assertPersistedPlatformPermission(tx,context");
    expect(code).toContain("tx.insert(inAppNotifications)");
    expect(code).toContain("onConflictDoNothing()");
  });

  it("requires a registered member FK but never assumes it is a tenant-composite FK", () => {
    const schema=readFileSync("src/db/schema/placements.ts","utf8");
    const application=schema.slice(schema.indexOf("export const placementApplications = pgTable("),
      schema.indexOf("export const placementApplicationStatusHistory = pgTable("));
    expect(application).toContain("membershipId: uuid(\"membership_id\")");
    expect(application).toContain(".references(() => collegeMemberships.id");
    expect(application).toContain("jobId: uuid(\"job_id\")");
  });
});
