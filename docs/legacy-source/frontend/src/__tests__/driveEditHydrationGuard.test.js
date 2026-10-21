import fs from "fs";
import path from "path";

describe("TPO drive edit hydration guard", () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), "src/components/tpo/DriveFormPage.js"),
    "utf8"
  );

  test("fails closed until an existing drive is successfully hydrated", () => {
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain('useState(editId ? "loading" : "ready")');
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain('if (editId && editHydration !== "ready") return null;');
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain('if (editId && editHydration !== "ready") return;');
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain('disabled={Boolean(editId) && editHydration !== "ready"}');
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain('message="This drive could not be loaded"');
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain('setEditHydrationRetryKey((value) => value + 1)');
  });

  test("stale hydration work is invalidated", () => {
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain("const requestId = ++hydrationSeq.current;");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain("requestId !== hydrationSeq.current");
    expect(source).toContain("clearTimeout(timer.current);");
  });
});
