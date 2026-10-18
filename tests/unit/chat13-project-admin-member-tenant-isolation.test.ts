import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { can } from "@/modules/permissions/policy";
import { projectAdminCsv } from "@/modules/projects/project-admin-csv-model";
import type { RequestContext } from "@/modules/identity/context";

const source = () => readFileSync(
  "src/modules/projects/admin-insights-service.ts", "utf8",
);
const context: RequestContext = {
  user: {
    id: "admin-a",
    identityUid: "identity-a",
    platformStatus: "ACTIVE",
    systemRoles: ["SUPER_ADMIN"],
  },
  adminScope: { organizationId: "organization-a", collegeId: "college-a" },
  membership: null,
};

describe("IIT Dharwad Super Admin Projects: tenant-safe mentor projections", () => {
  it("PROJ-BREAK-SA-30 enforces college and active membership in both visible mentor queries", () => {
    // The project itself is already scoped; its relationship to the
    // mentor must ALSO be scoped, otherwise a malformed imported member
    // row can leak a foreign-college user name into admin cards/risk queue.
    const code = source();
    const scopedJoins = code.match(
      /\.innerJoin\(\s*collegeMemberships,\s*and\(\s*eq\(collegeMemberships\.id,\s*projectMembers\.membershipId\),\s*eq\(collegeMemberships\.collegeId,\s*college\.id\),\s*eq\(collegeMemberships\.status,\s*"ACTIVE"\)/g,
    );
    expect(scopedJoins).toHaveLength(2);
    expect(code).not.toMatch(
      /\.innerJoin\(\s*collegeMemberships,\s*eq\(\s*collegeMemberships\.id,\s*projectMembers\.membershipId/,
    );
    expect(can(context, "projects.manage", {
      organizationId: "organization-a", collegeId: "college-a",
    })).toBe(true);
    expect(can(context, "projects.manage", {
      organizationId: "organization-b", collegeId: "college-b",
    })).toBe(false);
  });

  it("PROJ-BREAK-SA-31 does not expose foreign or suspended primary mentor IDs in submissions", () => {
    const code = source();
    const subquery = code.slice(code.indexOf("mentorMembershipId:"));
    expect(subquery).toContain("select 1 from college_memberships cm");
    expect(subquery).toContain("cm.id=pm.membership_id");
    expect(subquery).toContain("cm.college_id=${college.id}");
    expect(subquery).toContain("cm.status='ACTIVE'");
    expect(subquery).toContain("pm.ended_at is null");
    expect(subquery).toContain("pm.is_primary=true");
  });

  it("PROJ-BREAK-SA-36 hides disabled users from every active Super Admin mentor join",()=>{
    const code=source();
    const joins=code.match(/\.innerJoin\(\s*users,\s*and\(eq\(users\.id,\s*collegeMemberships\.userId\),\s*eq\(users\.platformStatus,\s*"ACTIVE"\)\)/g);
    expect(joins).toHaveLength(2);
    expect(code).toContain('eq(collegeMemberships.status, "ACTIVE")');
    expect(code).toContain('isNull(projectMembers.endedAt)');
    expect(code).not.toContain('eq(users.id, collegeMemberships.userId),\n      )');
  });

  it("PROJ-BREAK-SA-37 includes ended mentor transitions in staleness without showing their names",()=>{
    const code=source();
    const history=code.slice(code.indexOf("// UI labels include only active mentors"),
      code.indexOf("// Index each result set once:"));
    expect(history).toContain("projectId: projectMembers.projectId");
    expect(history).toContain("max(${projectMembers.updatedAt})");
    expect(history).toContain(".where(inArray(projectMembers.projectId, ids))");
    expect(history).toContain(".groupBy(projectMembers.projectId)");
    expect(history).not.toContain("isNull(projectMembers.endedAt)");
    expect(history).not.toContain("users.displayName");
    expect(code).toContain("const memberMutationByProject = new Map(memberMutations.map");
    expect(code).toContain("memberMutationByProject.get(project.id)");
    // Display labels still exclusively come from active-user/active-membership
    // tenant-safe joins. Removing the mentor cannot expose the old name.
    expect(code.match(/eq\(users\.platformStatus, "ACTIVE"\)/g)).toHaveLength(2);
  });

  it("PROJ-BREAK-SA-32 does not turn adversarial mentor labels into formulas in Projects CSV", () => {
    const csv = projectAdminCsv([
      ["Project", "Mentor"],
      ["Capstone", "\u200B=HYPERLINK(\"https://bad.example\",\"open\")"],
      ["Team Alpha", "\t+1+2"],
    ]);
    expect(csv).toContain("'\u200B=HYPERLINK");
    expect(csv).toContain("'\t+1+2");
    expect(csv).toContain('""https://bad.example""');
    expect(csv).toContain("\r\n");
  });
});
