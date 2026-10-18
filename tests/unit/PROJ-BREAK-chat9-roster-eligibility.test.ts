import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { replaceCollegeProjectRosterSchema } from "@/modules/projects/college-project-roster-model";

const source = () => readFileSync(join(process.cwd(),
  "src/modules/projects/college-project-roster-service.ts"), "utf8");
const valid = "11111111-1111-4111-8111-111111111111";
const updatedAt = "2099-01-02T12:30:00.000Z";

describe("IIT Dharwad Projects: College Admin roster security", () => {
  it("PROJ-BREAK-idor-15 requires an active academic program and selected section for each new learner", () => {
    const code = source();
    expect(code).toContain("learnerProgramEnrollments.membershipId,collegeMemberships.id");
    expect(code).toContain('eq(learnerProgramEnrollments.status,"ACTIVE")');
    expect(code).toContain("project.sectionId?exists(");
    expect(code).toContain(`eq(sectionEnrollments.learnerEnrollmentId,sql.raw('"learner_program_enrollments"."id"'))`);
    expect(code).toContain("eq(sectionEnrollments.sectionId,project.sectionId)");
    expect(code).toContain('eq(sectionEnrollments.status,"ACTIVE")');
    expect(code).toContain('eq(collegeMemberships.status,"ACTIVE")');
    expect(code).toContain('eq(users.platformStatus,"ACTIVE")');
    expect(code).toContain('eq(membershipRoles.role,"LEARNER")');
  });
  it("PROJ-BREAK-idor-16 locks the tenant-owned project and rechecks actor before any roster changes", () => {
    const code = source();
    const lock = code.indexOf('.for("update").limit(1)');
    const guard = code.indexOf("await assertPersistedPlatformPermission(tx,context");
    const inserts = code.indexOf("tx.insert(projectMembers)");
    expect(code).toContain("eq(projectInstances.collegeId,scope.collegeId)");
    expect(lock).toBeGreaterThan(0);
    expect(guard).toBeGreaterThan(lock);
    expect(guard).toBeLessThan(inserts);
    expect(code).toContain('project.status==="ARCHIVED"');
    expect(code).toContain("project.teamGroupId");
  });
  it("PROJ-BREAK-idor-17 rejects cross-college and duplicate roster parameters before service access", () => {
    const base = { learnerMembershipIds: [valid], expectedUpdatedAt: updatedAt };
    expect(replaceCollegeProjectRosterSchema.safeParse(base).success).toBe(true);
    expect(replaceCollegeProjectRosterSchema.safeParse({ ...base, learnerMembershipIds: [valid, valid] }).success).toBe(false);
    expect(replaceCollegeProjectRosterSchema.safeParse({ ...base, collegeId: valid }).success).toBe(false);
    expect(replaceCollegeProjectRosterSchema.safeParse({ ...base, expectedUpdatedAt: "invalid" }).success).toBe(false);
    expect(replaceCollegeProjectRosterSchema.safeParse({ ...base, learnerMembershipIds: [valid, "not-a-uuid"] }).success).toBe(false);
  });
});
