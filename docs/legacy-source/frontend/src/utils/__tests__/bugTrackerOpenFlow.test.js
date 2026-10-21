const fs = require("fs");
const path = require("path");

describe("42 Tracker no-login Phase 1 flow", () => {
  test("reporting page has a reporter selector and no access-session dependency", () => {
    const page = fs.readFileSync(path.resolve(__dirname, "../../pages/tracker/index.js"), "utf8");
    expect(page).toContain("REPORTER_OPTIONS");
    expect(page).toContain('name="reporterName"');
    expect(page).not.toContain("useTrackerSession");
    expect(page).not.toContain("accessError");
  });

  test("issues and details load without session gating", () => {
    const list = fs.readFileSync(path.resolve(__dirname, "../../pages/tracker/issues/index.js"), "utf8");
    const detail = fs.readFileSync(path.resolve(__dirname, "../../pages/tracker/issues/[issueId].js"), "utf8");
    expect(list).not.toContain("useTrackerSession");
    expect(detail).not.toContain("useTrackerSession");
    expect(detail).toContain("updateBugStatus");
  });
});
