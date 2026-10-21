import fs from "fs";
import path from "path";

const read = (p) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

const collegeSections = [
  "summary",
  "overview",
  "readiness",
  "resources",
  "sprints",
  "tasks",
  "team",
  "meetings",
  "delivery",
];

const superAdminSections = [
  "summary",
  "overview",
  "readiness",
  "resources",
  "sprints",
  "tasks",
  "team",
  "meetings",
  "delivery",
];

test("college-admin workspace sections use the race-safe loader and expose load recovery", () => {
  const shared = read("src/components/admin/projects/adminWorkspaceSection.js");
  expect(shared).toContain("const requestSeq = useRef(0)");
  expect(shared).toContain("if (requestId !== requestSeq.current) return");
  expect(shared).toContain("return { workspace, loading, error, reload: load }");

  for (const section of collegeSections) {
    const source = read(`src/pages/college-admin/projects/workspaces/[workspaceId]/${section}.js`);
    expect(source).toContain("Workspace could not be loaded");
    expect(source).toMatch(/Retry/);
  }
});

test("superadmin workspace sections use the race-safe loader and expose load recovery", () => {
  const shared = read("src/components/admin/projects/superAdminWorkspaceSection.js");
  expect(shared).toContain("const requestSeq = useRef(0)");
  expect(shared).toContain("if (requestId !== requestSeq.current) return");
  expect(shared).toContain("return { workspace, loading, error, reload: load }");

  for (const section of superAdminSections) {
    const source = read(`src/pages/superadmin/projects/workspaces/[workspaceId]/${section}.js`);
    expect(source).toContain("Workspace could not be loaded");
    expect(source).toMatch(/Retry/);
  }
});

test("project audit tabs keep audit history recoverable when either source fails", () => {
  const college = read("src/pages/college-admin/projects/workspaces/[workspaceId]/audit.js");
  const superAdmin = read("src/pages/superadmin/projects/workspaces/[workspaceId]/audit.js");
  // The redesign moved the resource-audit error and its Retry into one shared component both pages render.
  const resourceAudit = read("src/components/admin/projects/WorkspaceResourceAudit.jsx");
  expect(resourceAudit).toContain("Resource audit could not be loaded");
  expect(resourceAudit).toContain("onClick={onRetry}");

  expect(college).toContain("useAdminWorkspace");
  expect(college).toContain("Retry workspace");
  expect(college).toContain("error={resourceAuditError}");
  expect(college).toContain("onRetry={() => setResourceAuditReloadKey");

  expect(superAdmin).toContain("useSuperAdminWorkspace");
  expect(superAdmin).toContain("onClick={reloadWorkspace}");
  expect(superAdmin).toContain("error={resourceAuditError}");
  expect(superAdmin).toContain("onRetry={() => setResourceAuditReloadKey");
});
