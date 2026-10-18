import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import { parseCollegeProjectsQuery } from "@/modules/projects/college-projects-query-model";
import { getProjectAdminCollegeId } from "@/modules/projects/admin-college-scope";
import { createProjectInstanceInputSchema } from "@/modules/projects/validation";
import { replaceCollegeProjectRosterSchema } from "@/modules/projects/college-project-roster-model";
import { mayBeginClassTeamCreation } from "@/modules/projects/class-team-create-once-model";
import { assertPreviewVersion, previewVersion } from "@/modules/projects/class-team-preview-token";
import { verifyClassTeamPreview } from "@/modules/projects/class-team-preview-validation";

const COLLEGE = "11111111-1111-4111-8111-111111111111";
const OTHER_COLLEGE = "22222222-2222-4222-8222-222222222222";
const ORGANIZATION = "33333333-3333-4333-8333-333333333333";
const STUDENT = "44444444-4444-4444-8444-444444444444";
const FOREIGN_STUDENT = "55555555-5555-4555-8555-555555555555";
const MENTOR = "66666666-6666-4666-8666-666666666666";
const TEMPLATE = "77777777-7777-4777-8777-777777777777";

function adminContext(): RequestContext {
  return {
    user: { id: "88888888-8888-4888-8888-888888888888", identityUid: "college-admin",
      platformStatus: "ACTIVE", systemRoles: [] },
    membership: { id: "99999999-9999-4999-8999-999999999999",
      collegeId: COLLEGE, organizationId: ORGANIZATION, status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
  };
}

describe("IIT Dharwad College Admin Projects role journeys", () => {
  it("PROJ-COL-QUERY-01 refuses hostile or stale filters through a recoverable page state", () => {
    const input = { page: "Infinity", pageSize: "-10", status: "DROP TABLE",
      q: "  abc  ", view: "evil" };
    expect(parseCollegeProjectsQuery(input).success).toBe(false);
    for (const page of ["NaN", "-1", "0", "1.5", "100001", "99999999999999999"]) {
      expect(parseCollegeProjectsQuery({ page }).success).toBe(false);
    }
    expect(parseCollegeProjectsQuery({ q: "x".repeat(1000) }).success).toBe(false);
    const page = readFileSync("src/app/(authenticated)/college/projects/page.tsx", "utf8");
    expect(page).toContain('title="Invalid project filters"');
    expect(page).toContain('href="/college/projects"');
    expect(page).toContain("if (!parsed.success)");
  });

  it("PROJ-COL-QUERY-03 refuses number-coercion bypasses and retains canonical decimal navigation", () => {
    for (const hostile of ["1e2", "0x10", "0b101", " 2", "2 ", "1.0", "+2", "-0", "Infinity", "NaN"]) {
      expect(parseCollegeProjectsQuery({page: hostile}).success, hostile).toBe(false);
      expect(parseCollegeProjectsQuery({pageSize: hostile}).success, hostile).toBe(false);
    }
    expect(parseCollegeProjectsQuery({page: "100001"}).success).toBe(false);
    expect(parseCollegeProjectsQuery({pageSize: "9"}).success).toBe(false);
    for (const valid of [{page:"1",pageSize:"10"},{page:"0002",pageSize:"025"},{page:"100000",pageSize:"100"}]) {
      const parsed=parseCollegeProjectsQuery(valid);
      expect(parsed.success,JSON.stringify(valid)).toBe(true);
      if(parsed.success) {
        expect(parsed.data.page).toBe(Number(valid.page));
        expect(parsed.data.pageSize).toBe(Number(valid.pageSize));
      }
    }
  });

  it("PROJ-COL-QUERY-02 retains valid filters and pagination across navigation", () => {
    const valid = parseCollegeProjectsQuery({
      view: "table", status: "ARCHIVED", page: "2", pageSize: "50", q: "  Sprint ",
    });
    expect(valid.success).toBe(true);
    if(valid.success)expect(valid.data).toMatchObject({
      view: "table", status: "ARCHIVED", page: 2, pageSize: 50, q: "Sprint",
    });
    // Repeated query values are ambiguous and must not select the first one.
    expect(parseCollegeProjectsQuery({view:["table","cards"]}).success).toBe(false);
    expect(parseCollegeProjectsQuery({page:["2","3"]}).success).toBe(false);
    const defaults = parseCollegeProjectsQuery({});
    expect(defaults.success).toBe(true);
    if(defaults.success)expect(defaults.data).toMatchObject({
      view: "cards", page: 1, pageSize: 25,
    });
  });

  it("PROJ-COL-SCOPE-01 never substitutes a foreign college from a forged URL", () => {
    const user = adminContext();
    expect(getProjectAdminCollegeId(user)).toBe(COLLEGE);
    const forged = parseCollegeProjectsQuery({ collegeId: OTHER_COLLEGE });
    // A forged tenant key is rejected before any college data is queried.
    expect(forged.success).toBe(false);
    const page = readFileSync("src/app/(authenticated)/college/projects/page.tsx", "utf8");
    expect(page).toContain("getProjectAdminCollegeId(context)");
    expect(page).toContain("listProjectAdminSnapshots(");
    expect(page).toContain("collegeId,");
    expect(page).not.toContain("membership.collegeId");
  });

  it("PROJ-COL-SCOPE-04/05 all College Admin Projects creation, templates, detail, audit and reassignment routes check selected college", () => {
    const routes = [
      "src/app/(authenticated)/college/projects/page.tsx",
      "src/app/(authenticated)/college/projects/create/page.tsx",
      "src/app/(authenticated)/college/projects/templates/page.tsx",
      "src/app/(authenticated)/college/projects/audit/page.tsx",
      "src/app/(authenticated)/college/projects/reassign-mentor/page.tsx",
      "src/app/(authenticated)/college/projects/templates/[templateId]/page.tsx",
      "src/app/(authenticated)/college/projects/workspaces/new/page.tsx",
    ];
    for (const route of routes) {
      const source = readFileSync(route, "utf8");
      expect(source, route).toContain("getProjectAdminCollegeId(context)");
      expect(source, route).not.toContain("context.membership.collegeId");
      expect(source, route).not.toContain("context.membership?.collegeId");
      expect(source, route).not.toContain('redirect("/dashboard")');
    }
  });

  it("PROJ-COL-SCOPE-02 declines expired, disabled and roleless sessions before loading projects", () => {
    const active = adminContext();
    expect(getProjectAdminCollegeId({ ...active, membership: null })).toBeNull();
    expect(getProjectAdminCollegeId({ ...active,
      user: { ...active.user, platformStatus: "DISABLED" },
    })).toBeNull();
    expect(getProjectAdminCollegeId({ ...active,
      membership: { ...active.membership!, status: "SUSPENDED" },
    })).toBeNull();
    expect(getProjectAdminCollegeId({ ...active,
      membership: { ...active.membership!, roles: ["LEARNER"] },
    })).toBeNull();
  });

  it("PROJ-COL-SCOPE-03 refuses implicit Super Admin cross-tenant fallback", () => {
    const active = adminContext();
    const superUser = { ...active.user, systemRoles: ["SUPER_ADMIN" as const] };
    expect(getProjectAdminCollegeId({ ...active, user: superUser,
      adminScope: null })).toBeNull();
    expect(getProjectAdminCollegeId({ ...active, user: superUser,
      adminScope: { collegeId: OTHER_COLLEGE, organizationId: ORGANIZATION },
    })).toBe(OTHER_COLLEGE);
  });

  it("PROJ-COL-BADINPUT-01 prevents a duplicate student or active unmentored workspace", () => {
    const base = { collegeId: COLLEGE, templateId: TEMPLATE, slug: "team-alpha",
      title: "Team Alpha", sectionId: OTHER_COLLEGE, learnerMembershipIds: [STUDENT],
      primaryMentorMembershipId: MENTOR };
    expect(createProjectInstanceInputSchema.safeParse(base).success).toBe(true);
    expect(createProjectInstanceInputSchema.safeParse({
      ...base, learnerMembershipIds: [STUDENT, STUDENT],
    }).success).toBe(false);
    expect(createProjectInstanceInputSchema.safeParse({
      ...base, initialStatus: "ACTIVE", primaryMentorMembershipId: undefined,
    }).success).toBe(false);
    expect(createProjectInstanceInputSchema.safeParse({
      ...base, sectionId: undefined,
    }).success).toBe(false);
    expect(createProjectInstanceInputSchema.safeParse({
      ...base, collegeId: OTHER_COLLEGE, injectedOrganizationId: ORGANIZATION,
    }).success).toBe(false);
  });

  it("PROJ-COL-DOUBLE-01 blocks a second creation while the first is in flight", () => {
    expect(mayBeginClassTeamCreation(false, true)).toBe(true);
    expect(mayBeginClassTeamCreation(true, true)).toBe(false);
    expect(mayBeginClassTeamCreation(false, false)).toBe(false);
  });

  it("PROJ-COL-STALE-01 refuses stale team preview tokens and altered membership", () => {
    const groups = [{ name: "Team 1", membershipIds: [STUDENT] }];
    const token = previewVersion(groups);
    expect(() => assertPreviewVersion(groups, token)).not.toThrow();
    expect(() => assertPreviewVersion([{ name: "Team 1", membershipIds: [FOREIGN_STUDENT] }], token))
      .toThrow("TEAM_PREVIEW_STALE");
    expect(() => verifyClassTeamPreview(groups, [FOREIGN_STUDENT]))
      .toThrow("Team includes an ineligible learner");
  });

  it("PROJ-COL-STALE-04 never silently reuses another class roster or interprets fetch failures as zero learners", () => {
    const control = readFileSync("src/components/projects/project-create-control.tsx", "utf8");
    expect(control).toContain("setLearnerMembershipIds([]);setLoadedRosterSectionId(null)");
    expect(control).toContain("setLoadedRosterSectionId(sectionId)");
    expect(control).toContain("loadedRosterSectionId!==sectionId");
    expect(control).toContain("setRosterError(true)");
    expect(control).toContain("setClassesError(true)");
    expect(control).toContain("setRosterRetry(value=>value+1)");
    expect(control).toContain("setClassesRetry(value=>value+1)");
    expect(control).toContain("Class roster could not load.");
    expect(control).toContain("Classes could not load.");
    expect(control).toContain("if (submitLock.current) return");
  });

  it("PROJ-COL-STALE-05 refuses Enter-key submit with a pending/wrong class roster and ignores aborted candidates", () => {
    const control=readFileSync("src/components/projects/project-create-control.tsx","utf8");
    expect(control).toContain("if (!controller.signal.aborted) setMentors(body.mentors ?? [])");
    expect(control).toContain("controller.signal.aborted ||");
    expect(control).toContain("classesError ||");
    expect(control).toContain("!classes.some(item => item.id === sectionId)");
    expect(control).toContain("rosterError ||");
    expect(control).toContain("loadedRosterSectionId !== sectionId");
    expect(control).toContain("learnerMembershipIds.some(id => !roster.some(row => row.membershipId === id))");
    const guard=control.indexOf("if (sectionId && (");
    const locked=control.indexOf("submitLock.current = true");
    const mutation=control.indexOf("await projectMutation(");
    expect(guard).toBeGreaterThan(0);
    expect(guard).toBeLessThan(locked);
    expect(locked).toBeLessThan(mutation);
    expect(control).toContain("Retry loading it before creating the Project");
  });

  it("PROJ-COL-STALE-06 prevents mentorless activation after a Mentor selection is cleared",()=>{
    const control=readFileSync("src/components/projects/project-create-control.tsx","utf8");
    const validation=control.indexOf('if (initialStatus === "ACTIVE" && !mentorMembershipId)');
    const submit=control.indexOf("submitLock.current = true");
    expect(validation).toBeGreaterThan(0);
    expect(validation).toBeLessThan(submit);
    expect(control).toContain("Assign a Mentor before making this Project active.");
    expect(createProjectInstanceInputSchema.safeParse({
      collegeId:COLLEGE,templateId:TEMPLATE,slug:"a",title:"Team A",
      initialStatus:"ACTIVE",learnerMembershipIds:[],
    }).success).toBe(false);
  });

  it("PROJ-COL-STALE-02 rejects stale timestamps and repeated roster members", () => {
    const valid = { learnerMembershipIds: [STUDENT],
      expectedUpdatedAt: "2099-04-01T12:00:00.000+05:30" };
    expect(replaceCollegeProjectRosterSchema.safeParse(valid).success).toBe(true);
    expect(replaceCollegeProjectRosterSchema.safeParse({
      ...valid, learnerMembershipIds: [STUDENT, STUDENT],
    }).success).toBe(false);
    expect(replaceCollegeProjectRosterSchema.safeParse({
      ...valid, expectedUpdatedAt: "yesterday",
    }).success).toBe(false);
    const source = readFileSync("src/modules/projects/college-project-roster-service.ts", "utf8");
    expect(source).toContain('for("update")');
    expect(source).toContain('PROJECT_MEMBER_CONFLICT');
    expect(source).toContain("getDb().transaction(");
  });

  it("PROJ-COL-REVOKE-01 authenticates persisted creator under the project materialization transaction",()=>{
    const source=readFileSync("src/modules/projects/instance-service.ts","utf8");
    const begin=source.indexOf("return await db.transaction(async (tx) => {");
    const actor=source.indexOf('assertPersistedPlatformPermission(tx,context,"projects.manage"');
    const insert=source.indexOf(".insert(projectInstances)");
    expect(begin).toBeGreaterThan(0);
    expect(actor).toBeGreaterThan(begin);
    expect(actor).toBeLessThan(insert);
    expect(source).toContain("collegeId:college.id,organizationId:college.organizationId");
    expect(source).toContain("mapInstanceConstraint(error)");
    expect(source).toContain("recordActivityEventInTransaction(");
    expect(source).toContain("notifyProjectMemberships(tx,createdEvent.id");
  });

  it("PROJ-COL-REVOKE-02 checks live college admin authorization before archived project no-op or mutation",()=>{
    const source=readFileSync("src/modules/projects/instance-service.ts","utf8");
    const archive=source.indexOf("export async function archiveProjectInstance(");
    const locked=source.indexOf('.for("update")',archive);
    const persisted=source.indexOf('assertPersistedPlatformPermission(tx,context,"projects.manage"',archive);
    const noOp=source.indexOf('if (project.status === "ARCHIVED")',archive);
    const mutate=source.indexOf('.update(projectInstances)',archive);
    const activity=source.indexOf("recordActivityEventInTransaction(",archive);
    expect(archive).toBeGreaterThan(0);
    expect(locked).toBeGreaterThan(archive);
    expect(persisted).toBeGreaterThan(locked);
    expect(noOp).toBeGreaterThan(persisted);
    expect(mutate).toBeGreaterThan(noOp);
    expect(activity).toBeGreaterThan(mutate);
    expect(source).toContain("collegeId:scope.collegeId,organizationId:scope.organizationId");
  });

  it("PROJ-COL-ORIGIN-01 protects project creation and mentor reassignment from cross-origin POSTs", () => {
    for (const route of ["src/app/api/projects/route.ts",
      "src/app/api/projects/reassign-mentor/route.ts"]) {
      const text = readFileSync(route, "utf8");
      expect(text).toContain("isSameOriginRequest(request)");
      expect(text).toContain("getCurrentRequestContext()");
      expect(text).toContain("apiErrorResponse(error)");
    }
  });
});
