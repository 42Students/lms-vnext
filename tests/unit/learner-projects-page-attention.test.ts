import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const page = readFileSync(
  "src/app/(authenticated)/learn/projects/page.tsx", "utf8",
);
const service = readFileSync(
  "src/modules/projects/learner-attention-service.ts", "utf8",
);

describe("Learner projects page-scoped attention", () => {
  it("reads badges for only the paged learner project IDs", () => {
    expect(page).toContain("const directory = await listMyLearnerProjectPage(context,query)");
    expect(page).toContain("const pageProjectIds=rows.map(row=>row.project.id)");
    expect(page).toContain("listMyLearnerProjectPageAttention(context,pageProjectIds)");
    expect(page).not.toContain("listMyLearnerProjectAttention(context)");
    expect(page).toContain("const attentionByProject=new Map");
  });

  it("requires the persisted membership, college, and learner role for each page badge", () => {
    const scoped = service.slice(
      service.indexOf("export async function listMyLearnerProjectPageAttention"),
    );
    expect(scoped).toContain('context.user.platformStatus !== "ACTIVE"');
    expect(scoped).toContain('hasMembershipRole(context, "LEARNER")');
    expect(scoped).toContain("inArray(projectSubmissions.projectId, scopedIds)");
    expect(scoped).toContain('eq(projectMembers.role, "LEARNER")');
    expect(scoped).toContain("isNull(projectMembers.endedAt)");
    expect(scoped).toContain("isNull(projectMembers.deletedAt)");
    expect(scoped).toContain("eq(projectInstances.collegeId, membership.collegeId)");
    expect(scoped).toContain("eq(collegeMemberships.userId, context.user.id)");
    expect(scoped).toContain('eq(membershipRoles.role, "LEARNER")');
    expect(scoped).toContain("isNull(projectInstances.deletedAt)");
  });

  it("selects only the latest status per project without resurrecting old drafts", () => {
    const scoped = service.slice(
      service.indexOf("export async function listMyLearnerProjectPageAttention"),
    );
    expect(scoped).toContain("if (projectIds.length === 0) return []");
    expect(scoped).toContain("if (scopedIds.length > 50)");
    expect(scoped).toContain("selectDistinctOn([projectSubmissions.projectId]");
    expect(scoped).toContain("desc(projectSubmissions.version)");
    expect(scoped).toContain('row.status === "CHANGES_REQUESTED" || row.status === "DRAFT"');
  });

  it("keeps the legacy unrestricted attention service intact for existing consumers", () => {
    expect(service).toContain("export async function listMyLearnerProjectAttention(");
    expect(service).toContain("await listMyProjectInstances(");
  });
});
