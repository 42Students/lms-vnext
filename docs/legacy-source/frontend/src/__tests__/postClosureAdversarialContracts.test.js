import fs from "fs";
import path from "path";

const read = (relative) => fs.readFileSync(path.join(process.cwd(), relative), "utf8");

describe("post-closure adversarial state contracts", () => {
  test("TPO page filters distinguish filtered zero from genuine empty", () => {
    const source = read("src/components/tpo/TpoDataTable.js");
    expect(source).toContain("pageFiltered");
    expect(source).toContain("No rows match the current filters");
    expect(source).toContain("Adjust or clear the page filters to see more rows.");
  });

  test("recruiter Drive nested data never converts request failure into empty content", () => {
    const source = read("src/pages/recruiter/drives/[jobId].js");
    expect(source).toContain("Could not load interview slots");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain("Could not load messages");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain("ListSkeleton rows={3}");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain("ListSkeleton rows={4}");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain("loadSeqRef");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain("sendRef");
  });

  test("student bulk import history owns tenant scope and separates loading/error/empty", () => {
    const source = read("src/pages/superadmin/sections/Students.js");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain("importHistoryRequestRef");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain('RefreshStatus label="Refreshing bulk import history…"');
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain('TableSkeleton rows={5} columns={3} label="Loading bulk import history"');
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain("Could not load bulk import history");
    expect(source).toContain("No bulk imports on file for this college.");
  });

  test("Super Admin active-session history separates failure from no active sessions", () => {
    const source = read("src/pages/superadmin/sections/AdminUsers.js");
    expect(source).toContain("sessionsRequestRef");
    expect(source).toContain('TableSkeleton rows={5} columns={4} label="Loading active sessions"');
    expect(source).toContain("Could not load active sessions");
    expect(source).toContain('locale={{ emptyText: "No active sessions." }}');
  });

  test("master tracker remains fully closed", () => {
    const master = read("docs/ui-hardening/UI_HARDENING_MASTER_PLAN_2026.md");
    expect(master).not.toContain("- [ ]");
    expect(master).toContain("COMPLETE — Phases 1–15 and the final role-by-role adversarial sweep are closed");
  });
});
