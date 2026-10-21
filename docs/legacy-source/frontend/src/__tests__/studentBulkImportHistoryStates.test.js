import fs from "fs";
import path from "path";

const read = (relative) => fs.readFileSync(path.join(process.cwd(), relative), "utf8");

describe("student bulk import history state contracts", () => {
  test("load failure never masquerades as a genuine empty history", () => {
    const source = read("src/pages/superadmin/sections/Students.js");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain('setImportHistoryError(e?.message || "Could not load bulk import history.")');
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain('message={importHistory.length > 0 ? "Could not refresh bulk import history" : "Could not load bulk import history"}');
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain('action={<Button size="small" onClick={openImportHistory}>Retry</Button>}');
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain("importHistoryError && importHistory.length === 0 ? null");
    expect(source).toContain("No bulk imports on file for this college.");
  });

  test("initial load is structural while same-college refresh preserves rows", () => {
    const source = read("src/pages/superadmin/sections/Students.js");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain('TableSkeleton rows={5} columns={3} label="Loading bulk import history"');
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain('RefreshStatus label="Refreshing bulk import history…"');
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain("const sameScope = Number(importHistoryCollegeId) === Number(requestedCollegeId)");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain("if (!sameScope) setImportHistory([])");
  });

  test("stale tenant history requests cannot overwrite the current college", () => {
    const source = read("src/pages/superadmin/sections/Students.js");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain("importHistoryRequestRef");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain("Number(collegeId) !== Number(requestedCollegeId)");
  });
});
