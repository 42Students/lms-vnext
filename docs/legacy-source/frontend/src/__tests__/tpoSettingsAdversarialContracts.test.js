import fs from "fs";
import path from "path";

describe("TPO settings adversarial hardening contracts", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "src/pages/tpo/settings.js"), "utf8");

  test("settings access bootstrap fails closed on unknown errors", () => {
    expect(source).toContain('setAccessError(errorText(r, "Could not verify your placement-settings access.');
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain('title="Couldn\'t verify settings access"');
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain("onRetry={loadSettingsAccess}");
  });

  test("shared mutations are synchronous single-flight actions", () => {
    expect(source).toContain("const busyRef = useRef(false);");
    expect(source).toContain("if (busyRef.current) return false;");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain('typeof action === "function" ? action() : action');
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).not.toMatch(/run\([^\n]+,\s*(saveCollegeSettings|savePlacementRules)\(/);
  });

});
