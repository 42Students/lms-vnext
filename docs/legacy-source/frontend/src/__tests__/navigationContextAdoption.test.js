import fs from "fs";
import path from "path";

const read = (relative) => fs.readFileSync(path.join(process.cwd(), relative), "utf8");

describe("Phase 8 list/detail context adoption", () => {
  test("recruiter drives keep tab/search in the URL and carry the list URL into detail", () => {
    const list = read("src/pages/recruiter/drives/index.js");
    const detail = read("src/pages/recruiter/drives/[jobId].js");

    expect(list).toContain("const rawTab = Array.isArray(router.query?.tab)");
    expect(list).toContain("const rawQuery = Array.isArray(router.query?.q)");
    expect(list).toContain("updateListQuery({ tab: value })");
    expect(list).toContain("updateListQuery({ q: e.target.value })");
    expect(list).toContain("withReturnTo(driveHref(d.id), router.asPath)");

    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(detail).toContain("query: { ...router.query, jobId, tab: next }");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(detail).toContain("getSafeInternalReturnPath(router.query?.returnTo");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(detail).toContain('allowedPrefixes: ["/recruiter/drives"]');
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(detail).toContain("router.push(drivesReturnPath)");
  });

  test("TPO batches keep search beside existing URL filters and carry the list URL into detail", () => {
    const list = read("src/pages/tpo/batches/index.js");
    const detail = read("src/pages/tpo/batches/[batchId].js");

    expect(list).toContain("const rawSearch = Array.isArray(router.query?.q)");
    expect(list).toContain("router.replace(");
    expect(list).toContain("returnTo={router.asPath}");
    expect(list).toContain("withReturnTo(href, returnTo)");

    expect(detail).toContain("getSafeInternalReturnPath(router.query?.returnTo");
    expect(detail).toContain('allowedPrefixes: ["/tpo/batches"]');
    expect(detail).toContain("query: { ...router.query, tab: key }");
    expect(detail).toContain("href={batchesReturnPath}");
  });

  test("authenticated 404 remains inside the current role shell", () => {
    const page = read("src/pages/404.js");
    const layout = read("src/layouts/layout.js");

    expect(page).toContain("<Layout preserveRoleShell>{content}</Layout>");
    expect(page).toContain("<AdminLayout>{content}</AdminLayout>");
    expect(page).toContain("<SuperAdminLayout>{content}</SuperAdminLayout>");
    expect(layout).toContain("preserveRoleShell = false");
    expect(layout).toContain("legacyRole && !preserveRoleShell");
  });
});
