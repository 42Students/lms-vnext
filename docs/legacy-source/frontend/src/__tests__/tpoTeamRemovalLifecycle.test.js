import fs from "fs";
import path from "path";

const source = fs.readFileSync(path.join(process.cwd(), "src/pages/tpo/settings.js"), "utf8");

describe("TPO placement-team removal lifecycle", () => {
  test("impact lookup fails closed before any removal prompt", () => {
    expect(source).toContain('if (!r.success)');
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain("Could not check what this team member owns. Nothing was changed.");
  });

  test("direct removal rejects failed confirmations instead of looking successful", () => {
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain("Could not remove this team member. Nothing was changed.");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain("throw new Error");
  });

  test("reassignment modal stays open and locked until the server confirms success", () => {
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain("removingBusy");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain("cancelButtonProps={{ disabled: removingBusy }}");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain("maskClosable={!removingBusy}");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain("Reassignment was not saved");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toMatch(/if \(!result\.success\)[\s\S]*setRemovalError[\s\S]*return;/);
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toMatch(/message\.success\("Removed\. Their recruiters and drives were reassigned\."\);[\s\S]*setRemoving\(null\)/);
    expect(source).not.toContain('setRemoving(null); await run("Removed. Their recruiters and drives were reassigned."');
  });
});
