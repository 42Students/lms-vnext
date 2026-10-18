import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import type { RequestContext } from "@/modules/identity/context";
import { mayRecordCollegeAdminDeliveryLock } from "@/modules/projects/admin-submission-lock-policy";
import { canAdminSettleDelivery } from "@/modules/projects/admin-submission-review-model";
import { safeProjectExternalHref } from "@/modules/projects/mentor-workspace-evidence-model";
import { templateAvailabilityCollegesInScope } from "@/modules/projects/template-college-availability-model";
import { readinessOverrideInputSchema, effectiveProjectSubmissionReady } from "@/modules/projects/readiness-override-model";

const read = (path: string) => readFileSync(path, "utf8");
const collegeA = "11111111-1111-4111-8111-111111111111";
const collegeB = "22222222-2222-4222-8222-222222222222";
const orgA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const orgB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

function collegeAdmin(): RequestContext {
  return {
    user: { id: "u1", identityUid: "identity1", platformStatus: "ACTIVE", systemRoles: ["SUPER_ADMIN"] },
    adminScope: { collegeId: collegeB, organizationId: orgB },
    membership: {
      id: "m1", collegeId: collegeA, organizationId: orgA,
      status: "ACTIVE", roles: ["COLLEGE_ADMIN"],
    },
  };
}

describe("Super Admin Projects adversarial controls", () => {
  it("PROJ-BREAK-SA-01 rejects a Super Admin locking college B with college A's membership audit identity", () => {
    const actor = collegeAdmin();
    expect(mayRecordCollegeAdminDeliveryLock(actor, collegeB, orgB)).toBe(false);
    expect(mayRecordCollegeAdminDeliveryLock(actor, collegeA, orgB)).toBe(false);
    expect(mayRecordCollegeAdminDeliveryLock(actor, collegeB, orgA)).toBe(false);
    const service = read("src/modules/projects/admin-submission-review-service.ts");
    expect(service).toContain("mayRecordCollegeAdminDeliveryLock(ctx,scope.collegeId,scope.organizationId)");
    expect(service.indexOf("mayRecordCollegeAdminDeliveryLock(")).toBeLessThan(service.indexOf("getDb().transaction("));
    expect(service).toContain("eq(projectInstances.collegeId,scope.collegeId)");
    expect(service).toContain("eq(projectSubmissions.projectId,scope.project.id)");
  });

  it("PROJ-BREAK-SA-02 denies removed memberships, inactive actors and non-admin roles without exposing a lock button", () => {
    const actor = collegeAdmin();
    actor.membership = { ...actor.membership!, collegeId: collegeB, organizationId: orgB };
    expect(mayRecordCollegeAdminDeliveryLock(actor, collegeB, orgB)).toBe(true);
    actor.membership = { ...actor.membership!, status: "SUSPENDED" };
    expect(mayRecordCollegeAdminDeliveryLock(actor, collegeB, orgB)).toBe(false);
    actor.membership = { ...actor.membership!, status: "ACTIVE", roles: ["MENTOR"] };
    expect(mayRecordCollegeAdminDeliveryLock(actor, collegeB, orgB)).toBe(false);
    actor.membership = { ...actor.membership!, roles: ["COLLEGE_ADMIN"] };
    actor.user = { ...actor.user, platformStatus: "DISABLED" };
    expect(mayRecordCollegeAdminDeliveryLock(actor, collegeB, orgB)).toBe(false);
    actor.membership = null;
    expect(mayRecordCollegeAdminDeliveryLock(actor, collegeB, orgB)).toBe(false);
    const server = read("src/components/projects/project-admin-submissions-page.tsx");
    const client = read("src/components/projects/project-admin-submission-review.tsx");
    expect(server).toContain("allowLock={allowLock}");
    expect(client).toContain('action==="LOCK"&&!allowLock');
    expect(client).toContain('allowLock&&canAdminSettleDelivery(status,locked,projectStatus,"LOCK")');
    expect(client).toContain('(status==="APPROVED"&&!allowLock)');
    expect(client).not.toContain("min-h-10");
  });

  it("PROJ-BREAK-SA-03 denies lock/review transitions for archived or locked projects and stale submission states", () => {
    for (const status of ["DRAFT", "CHANGES_REQUESTED", "CANCELLED", "UNKNOWN"]) {
      expect(canAdminSettleDelivery(status, false, "ACTIVE", "LOCK")).toBe(false);
      expect(canAdminSettleDelivery(status, false, "ACTIVE", "APPROVED")).toBe(false);
    }
    for (const status of ["SUBMITTED", "APPROVED"]) {
      expect(canAdminSettleDelivery(status, true, "ACTIVE", "LOCK")).toBe(false);
      expect(canAdminSettleDelivery(status, false, "ARCHIVED", "LOCK")).toBe(false);
    }
    expect(canAdminSettleDelivery("SUBMITTED", false, "ACTIVE", "LOCK")).toBe(true);
    expect(canAdminSettleDelivery("APPROVED", false, "ACTIVE", "LOCK")).toBe(true);
    expect(canAdminSettleDelivery("APPROVED", false, "ACTIVE", "CHANGES_REQUESTED")).toBe(false);
    const service = read("src/modules/projects/admin-submission-review-service.ts");
    expect(service).toContain('.for("update")');
    expect(service).toContain('isNull(projectSubmissions.lockedAt)');
  });

  it("PROJ-BREAK-SA-18 denies role revocation, identity suspension, mismatched scope and forged actor during delivery lock", () => {
    const ctx=collegeAdmin();
    ctx.membership={...ctx.membership!,collegeId:collegeB,organizationId:orgB};
    expect(mayRecordCollegeAdminDeliveryLock(ctx,collegeB,orgB)).toBe(true);
    const revoked={...ctx,membership:{...ctx.membership!,roles:["LEARNER"] as const}};
    const suspended={...ctx,membership:{...ctx.membership!,status:"SUSPENDED" as const}};
    const disabled={...ctx,user:{...ctx.user,platformStatus:"DISABLED" as const}};
    for(const invalid of [revoked,suspended,disabled]){
      expect(mayRecordCollegeAdminDeliveryLock(invalid,collegeB,orgB)).toBe(false);
    }
    const service=read("src/modules/projects/admin-submission-review-service.ts");
    const txStart=service.indexOf("return getDb().transaction(async tx=>{");
    const rowLock=service.indexOf('.for("update").limit(1)',txStart);
    const persisted=service.indexOf('assertPersistedPlatformPermission(tx,ctx,"projects.manage"',txStart);
    const validation=service.indexOf("mayRecordCollegeAdminDeliveryLock(persisted,scope.collegeId,scope.organizationId)",txStart);
    const event=service.indexOf("tx.insert(projectDeliveryEvents)",txStart);
    expect(txStart).toBeGreaterThanOrEqual(0);
    expect(rowLock).toBeGreaterThan(txStart);
    expect(persisted).toBeGreaterThan(rowLock);
    expect(validation).toBeGreaterThan(persisted);
    expect(event).toBeGreaterThan(validation);
    expect(service).toContain("persisted.membership?.id!==actorMembershipId");
  });

  it("PROJ-BREAK-SA-04 keeps same-origin enforcement on Super Admin delivery mutations", () => {
    const route = read("src/app/api/projects/[projectId]/submissions/[submissionId]/lock/route.ts");
    expect(route).toContain("isSameOriginRequest(request)");
    expect(route.indexOf("isSameOriginRequest(request)")).toBeLessThan(route.indexOf("request.json()"));
    expect(route).toContain("apiErrorResponse(error)");
    const service = read("src/modules/projects/admin-submission-review-service.ts");
    expect(service).toContain('z.strictObject({reason:z.string().trim().min(1).max(4000)})');
  });

  it("PROJ-BREAK-SA-05 never opens javascript, data, credential-bearing or malformed submission evidence links", () => {
    for (const href of [
      "javascript:alert(1)", "data:text/html,hi", "file:///etc/passwd",
      "https://user:password@example.com/private", "//somewhere.example", "not a URL",
      "https://example.com/" + "a".repeat(2050),
    ]) expect(safeProjectExternalHref(href)).toBeNull();
    expect(safeProjectExternalHref("https://example.com/portfolio")).toBe("https://example.com/portfolio");
    const page = read("src/components/projects/project-admin-submissions-page.tsx");
    expect(page).toContain("safeProjectExternalHref(submission.sourceUrl)");
    expect(page).toContain("safeProjectExternalHref(submission.demoUrl)");
  });

  it("PROJ-BREAK-SA-06 prevents a selected organization or college reading foreign template availability", () => {
    const colleges = [
      { id: collegeA, organizationId: orgA, name: "A" },
      { id: collegeB, organizationId: orgB, name: "B" },
    ];
    expect(templateAvailabilityCollegesInScope(colleges, { collegeId: collegeB, organizationId: orgB }))
      .toEqual([colleges[1]]);
    expect(templateAvailabilityCollegesInScope(colleges, { organizationId: orgA }))
      .toEqual([colleges[0]]);
    expect(templateAvailabilityCollegesInScope(colleges, { collegeId: collegeA, organizationId: orgB }))
      .toEqual([]);
    const service = read("src/modules/projects/template-college-availability-service.ts");
    expect(service).toContain("templateAvailabilityCollegesInScope(colleges, context.adminScope ?? null)");
  });

  it("PROJ-BREAK-SA-07 rejects malformed, overlong, or unreasoned readiness overrides", () => {
    for (const raw of [
      { state: "FORCE_BLOCK" },
      { state: "FORCE_UNLOCK", note: "  " },
      { state: "FORCE_BLOCK", note: "x".repeat(2001) },
      { state: "CLEAR", note: "unexpected" },
      { state: "UNRECOGNIZED", note: "reason" },
    ]) expect(readinessOverrideInputSchema.safeParse(raw).success).toBe(false);
    expect(readinessOverrideInputSchema.safeParse({state:"CLEAR"}).success).toBe(true);
    expect(effectiveProjectSubmissionReady(false, "FORCE_UNLOCK")).toBe(true);
    expect(effectiveProjectSubmissionReady(true, "FORCE_BLOCK")).toBe(false);
    expect(effectiveProjectSubmissionReady(false, "CLEAR")).toBe(false);
  });

  it("PROJ-BREAK-SA-08 keeps Super Admin project lists scoped, paginated, and permission gated", () => {
    const service = read("src/modules/projects/admin-insights-service.ts");
    expect(service).toContain('requirePermission(context, "projects.manage", {');
    expect(service).toContain('eq(projectInstances.collegeId, college.id)');
    expect(service).toContain('.limit(query.pageSize)');
    expect(service).toContain('.offset(');
    const page = read("src/app/(authenticated)/admin/projects/page.tsx");
    expect(page).toContain('if (!collegeId)');
    expect(page).toContain('title="No college selected"');
  });
});
