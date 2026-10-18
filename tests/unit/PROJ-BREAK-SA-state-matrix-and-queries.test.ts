import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { canAdminSettleDelivery, type AdminDeliveryAction } from "@/modules/projects/admin-submission-review-model";
import { parseAdminProjectsQuery } from "@/modules/projects/admin-projects-query-model";
import { parseProjectAdminRiskQuery } from "@/modules/projects/admin-risk-query-model";
import { parseProjectAdminSubmissionsQuery } from "@/modules/projects/admin-submissions-query-model";
import { restoreProjectInstanceInputSchema, restoredProjectStatus } from "@/modules/projects/instance-restore-model";
import {
  canArchiveDriveWithImpact, sameArchiveImpact, superAdminArchiveCommandSchema,
} from "@/modules/placements/super-admin-drive-archive-model";

const read = (path: string) => readFileSync(path, "utf8");

describe("Super Admin Projects: hostile state, URL, and concurrency contracts", () => {
  it("PROJ-BREAK-SA-09 rejects every forbidden combination across 144 delivery state transitions", () => {
    const projects = ["ACTIVE", "PLANNED", "COMPLETED", "ARCHIVED"] as const;
    const submissions = ["DRAFT", "SUBMITTED", "APPROVED", "CHANGES_REQUESTED", "UNDER_REVIEW", "LOCKED"] as const;
    const actions: AdminDeliveryAction[] = ["LOCK", "APPROVED", "CHANGES_REQUESTED"];
    let checked = 0;
    for (const projectStatus of projects)
      for (const status of submissions)
        for (const locked of [false, true])
          for (const action of actions) {
            const allowed = projectStatus === "ACTIVE" && !locked &&
              (action === "LOCK" ? status === "SUBMITTED" || status === "APPROVED" : status === "SUBMITTED");
            expect(canAdminSettleDelivery(status, locked, projectStatus, action),
              `${projectStatus} / ${status} / locked=${locked} / ${action}`).toBe(allowed);
            checked++;
          }
    expect(checked).toBe(144);
  });

  it("PROJ-BREAK-SA-17 refuses hostile unknown delivery operations even when the submission is otherwise reviewable", () => {
    for(const input of ["DELETE", "REOPEN", "", "APPROVE", null, undefined, 0, {}, []]){
      expect(canAdminSettleDelivery("SUBMITTED", false, "ACTIVE",
        input as AdminDeliveryAction),String(input)).toBe(false);
    }
    expect(canAdminSettleDelivery("SUBMITTED", false, "ACTIVE", "APPROVED")).toBe(true);
  });

  it("PROJ-BREAK-SA-10 prevents forged query parameters and oversized Super Admin result pages", () => {
    const parsers = [
      parseAdminProjectsQuery, parseProjectAdminRiskQuery, parseProjectAdminSubmissionsQuery,
    ];
    for (const parse of parsers) {
      for (const query of [
        { page: "0" }, { page: "-1" }, { page: "100001" },
        { page: "not-a-number" }, { page: "1.5" },
        { pageSize: "101" }, { pageSize: "0" }, { pageSize: "1.2" },
        { q: "a".repeat(121) }, { status: "ANOTHER_COLLEGE" },
      ]) {
        expect(parse(query).success, JSON.stringify(query)).toBe(false);
      }
      expect(parse({ page: "1", pageSize: "25" }).success).toBe(true);
    }
    expect(parseAdminProjectsQuery({ view: "tiles" }).success).toBe(false);
    expect(parseProjectAdminRiskQuery({ riskBucket: "PRIVATE" }).success).toBe(false);
    expect(parseProjectAdminSubmissionsQuery({ submissionStatus: "SECRET" }).success).toBe(false);
  });

  it("PROJ-BREAK-SA-25 rejects contradictory legacy and new project search values",()=>{
    const legacy=parseAdminProjectsQuery({search:"Alpha",page:"1"});
    const modern=parseAdminProjectsQuery({q:"Alpha",page:"1"});
    expect(legacy.success).toBe(true);
    expect(modern.success).toBe(true);
    if(legacy.success&&modern.success)expect(legacy.data).toEqual(modern.data);
    const both=parseAdminProjectsQuery({search:" Alpha ",q:"Alpha"});
    expect(both.success).toBe(true);
    if(both.success)expect(both.data.q).toBe("Alpha");
    for(const hostile of [
      {search:"college-a",q:"college-b"},
      {search:"",q:"other"},
      {search:"ARCHIVED",q:"ACTIVE"},
      {search:"a",q:"b",page:"1"},
    ]) expect(parseAdminProjectsQuery(hostile).success,JSON.stringify(hostile)).toBe(false);
  });

  it("PROJ-BREAK-SA-19 refuses duplicate query keys instead of silently choosing an attacker-controlled first value",()=>{
    const parsers=[parseAdminProjectsQuery,parseProjectAdminRiskQuery,parseProjectAdminSubmissionsQuery];
    for(const parse of parsers){
      for(const ambiguous of [
        {page:["1","100000"]},{q:["own college","foreign college"]},
        {pageSize:["10"]},{status:["ACTIVE","ARCHIVED"]},
      ]){
        expect(parse(ambiguous).success,JSON.stringify(ambiguous)).toBe(false);
      }
      expect(parse({q:"normal",page:"1",pageSize:"25"}).success).toBe(true);
    }
  });

  it("PROJ-BREAK-SA-11 requires a version token on restore and fails closed on unknown archived metadata", () => {
    const expectedUpdatedAt = "2026-10-18T09:30:00.123+05:30";
    expect(restoreProjectInstanceInputSchema.safeParse({ expectedUpdatedAt }).success).toBe(true);
    for (const raw of [
      {}, { expectedUpdatedAt: "yesterday" }, { expectedUpdatedAt: "2026-10-18" },
      { expectedUpdatedAt, status: "ACTIVE" }, { expectedUpdatedAt, bypassAudit: true },
    ]) expect(restoreProjectInstanceInputSchema.safeParse(raw).success).toBe(false);
    for (const historic of [undefined, null, "", "ARCHIVED", "DELETED", "BLOCKED", {}])
      expect(restoredProjectStatus(historic)).toBe("PLANNED");
    expect(restoredProjectStatus("ACTIVE")).toBe("ACTIVE");
    expect(restoredProjectStatus("COMPLETED")).toBe("COMPLETED");
    const service = read("src/modules/projects/instance-restore-service.ts");
    expect(service).toContain('.for("update")');
    expect(service).toContain('project.status!=="ARCHIVED"');
    expect(service).toContain('eq(projectInstances.collegeId,scope.collegeId)');
    expect(service).toContain("date_trunc('milliseconds'");
    expect(service).toContain('eq(collegeMemberships.status,"ACTIVE")');
    expect(service).toContain('eq(users.platformStatus,"ACTIVE")');
    expect(service.indexOf("recordActivityEventInTransaction")).toBeLessThan(service.lastIndexOf("return restored;"));
  });

  it("PROJ-BREAK-SA-12 enforces transactional delivery locks with persisted tenant pairing and audit", () => {
    const service = read("src/modules/projects/admin-submission-review-service.ts");
    const beforeTransaction = service.slice(0, service.indexOf("return getDb().transaction("));
    expect(beforeTransaction).toContain("requireProjectManageAccess(");
    expect(beforeTransaction).toContain("mayRecordCollegeAdminDeliveryLock(ctx,scope.collegeId,scope.organizationId)");
    expect(service).toContain('eq(projectInstances.collegeId,scope.collegeId)');
    expect(service).toContain('eq(projectSubmissions.projectId,scope.project.id)');
    expect(service).toContain('.for("update")');
    expect(service).toContain('isNull(projectSubmissions.lockedAt)');
    expect(service).toContain('PROJECT_SUBMISSION_CONFLICT');
    expect(service).toContain('tx.insert(projectDeliveryEvents)');
    expect(service).toContain('recordActivityEventInTransaction(tx,ctx');
    const route = read("src/app/api/projects/[projectId]/submissions/[submissionId]/lock/route.ts");
    expect(route).toContain("isSameOriginRequest(request)");
    expect(route).toContain("apiErrorResponse(error)");
  });

  it("PROJ-BREAK-SA-13 denies stale/forged drive-archive previews, accepted offers and unknown impact keys", () => {
    const impact = { activeApplications: 3, affectedLearners: 2, openRounds: 1, issuedOffers: 1, acceptedOffers: 0 };
    expect(canArchiveDriveWithImpact("PUBLISHED", impact)).toBe(true);
    expect(canArchiveDriveWithImpact("ARCHIVED", impact)).toBe(false);
    expect(canArchiveDriveWithImpact("PUBLISHED", { ...impact, acceptedOffers: 1 })).toBe(false);
    expect(sameArchiveImpact(impact, { ...impact })).toBe(true);
    expect(sameArchiveImpact(impact, { ...impact, issuedOffers: 2 })).toBe(false);
    const valid = { confirmed: true, expectedUpdatedAt: "2026-10-18T09:30:00.123Z",
      reason: "Operator acknowledged irreversible archive", expectedImpact: impact };
    expect(superAdminArchiveCommandSchema.safeParse(valid).success).toBe(true);
    for (const bad of [
      { ...valid, confirmed: false },
      { ...valid, expectedUpdatedAt: "not-a-date" },
      { ...valid, expectedImpact: { ...impact, acceptedOffers: -1 } },
      { ...valid, expectedImpact: { ...impact, ghost: 1 } },
      { ...valid, reason: " " },
    ]) expect(superAdminArchiveCommandSchema.safeParse(bad).success).toBe(false);
    const archive = read("src/modules/placements/super-admin-drive-archive-service.ts");
    const lockOffers = archive.indexOf('.for("update",{of:placementOffers})');
    const impactCheck = archive.indexOf("const current=await getImpact(tx,jobId)");
    expect(lockOffers).toBeGreaterThan(0);
    expect(lockOffers).toBeLessThan(impactCheck);
    expect(archive).toContain("assertPersistedPlatformPermission");
    expect(archive).toContain("recordActivityEventInTransaction");
  });
});
