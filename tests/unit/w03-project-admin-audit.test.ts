import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseProjectAdminAuditQuery } from "@/modules/projects/admin-audit-query-model";

const root = process.cwd();
const audit = readFileSync(
  join(root, "src/components/projects/project-admin-audit-page.tsx"),
  "utf8",
);
const nav = readFileSync(
  join(root, "src/components/projects/project-admin-nav.tsx"),
  "utf8",
);
const superRoute = readFileSync(
  join(root, "src/app/(authenticated)/admin/projects/audit/page.tsx"),
  "utf8",
);
const collegeRoute = readFileSync(
  join(root, "src/app/(authenticated)/college/projects/audit/page.tsx"),
  "utf8",
);
const queryModel = readFileSync(
  join(root, "src/modules/projects/admin-audit-query-model.ts"),
  "utf8",
);
const accessModel = readFileSync(
  join(root, "src/modules/projects/admin-audit-access-model.ts"),
  "utf8",
);

describe("W03 project admin audit parity contract", () => {
  it("keeps both legacy account audit routes behind the Projects nav", () => {
    expect(nav).toContain('["/audit", "Audit"]');
    expect(superRoute).toContain('basePath="/admin/projects"');
    expect(collegeRoute).toContain('basePath="/college/projects"');
  });

  it("reads only PROJECTS activity and preserves legacy-style audit filters", () => {
    expect(audit).toContain('module: "PROJECTS"');
    // The component delegates parsing to a shared validated query model.
    expect(audit).toContain("parseProjectAdminAuditQuery(searchParams)");
    // Action/status/eventType are aliases, but conflicting aliases must fail closed.
    expect(queryModel).toContain("actionAliases");
    const action = "projects.task.created";
    expect(parseProjectAdminAuditQuery({ action }).eventType).toBe(action);
    expect(parseProjectAdminAuditQuery({ status: action }).eventType).toBe(action);
    expect(parseProjectAdminAuditQuery({ eventType: action }).eventType).toBe(action);
    expect(parseProjectAdminAuditQuery({ action, status: action }).ignoredInvalidFilters).toBe(false);
    const conflicting = parseProjectAdminAuditQuery({ action, eventType: "projects.project.created" });
    expect(conflicting.eventType).toBeUndefined();
    expect(conflicting.ignoredInvalidFilters).toBe(true);
    const duplicated = parseProjectAdminAuditQuery({ action: [action, action] });
    expect(duplicated.eventType).toBeUndefined();
    expect(duplicated.ignoredInvalidFilters).toBe(true);
    expect(queryModel).toContain('allow("subjectType"');
    expect(queryModel).toContain('allow("from", validCalendarDate)');
    expect(queryModel).toContain('allow("to", validCalendarDate)');
    expect(queryModel).toContain("ignoredInvalidFilters");
  });

  it("requires college scope except for explicitly authorized global Super Admin template audit", () => {
    expect(superRoute).toContain("getProjectAdminCollegeId(context)");
    expect(superRoute).toContain("if (!collegeId && !mayReadGlobalProjectAudit(context))");
    expect(superRoute).toContain("Select a college scope");
    expect(audit).toContain("mayReadGlobalProjectAudit(context)");
    // Clearing the scope is not sufficient on its own: global activity still
    // requires an active Super Admin and an explicit activity.read permission.
    expect(accessModel).toContain("if (!context || !isSuperAdmin(context)) return false");
    expect(accessModel).toContain("context.adminScope?.collegeId || context.adminScope?.organizationId");
    expect(accessModel).toContain('can(context, "activity.read")');
  });

  it("preserves cursor filters when loading older activity", () => {
    expect(audit).toContain('"beforeOccurredAt"');
    expect(audit).toContain('"beforeId"');
    // Compare ignoring whitespace so formatter line-wrapping cannot break it.
    const flat = audit.replace(/\s+/g, "");
    expect(flat).toContain('nextParams.set("action",eventType)');
    expect(flat).toContain('nextParams.set("subjectType",subjectType');
  });
});
