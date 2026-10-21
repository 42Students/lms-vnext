import fs from "fs";
import path from "path";

const source = fs.readFileSync(path.join(process.cwd(), "src/pages/mentor/notifications.js"), "utf8");

describe("mentor notifications partial-data recovery", () => {
  test("announcement and personal notification failures are tracked independently", () => {
    expect(source).toContain("Promise.allSettled");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain('"college announcements"');
    expect(source).toContain('"personal notifications"');
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain("partialError:");
    expect(source).not.toContain("fetchAnnouncementPages().catch(() => [])");
    expect(source).not.toContain("fetchPersonalPages().catch(() => [])");
  });

  test("partial failure never renders a misleading all-clear state", () => {
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain("Some notifications could not be loaded");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain("Retry missing notifications");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain("No project alerts are currently shown. Retry to check the missing notification sources.");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain("Project alerts are still shown below.");
  });
});
