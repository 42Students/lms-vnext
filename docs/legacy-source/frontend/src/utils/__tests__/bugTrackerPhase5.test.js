const fs = require("fs");
const path = require("path");

describe("42 Tracker Phase 5 quick reporting", () => {
  test("tracker visit opts the browser in and app shell owns one global launcher", () => {
    const shell = fs.readFileSync(
      path.resolve(__dirname, "../../components/tracker/TrackerShell.jsx"),
      "utf8"
    );
    const app = fs.readFileSync(
      path.resolve(__dirname, "../../pages/_app.js"),
      "utf8"
    );
    expect(shell).toContain("QUICK_REPORT_ENABLED_KEY");
    expect(shell).toContain("localStorage.setItem");
    expect(app).toContain("<TrackerQuickReportLauncher />");
  });

  test("environment remains a user-selected field in the quick drawer", () => {
    const drawer = fs.readFileSync(
      path.resolve(__dirname, "../../components/tracker/TrackerQuickReportLauncher.jsx"),
      "utf8"
    );
    expect(drawer).toContain('name="environment"');
    expect(drawer).toContain("ENVIRONMENT_OPTIONS");
    expect(drawer).toContain("Environment is always selected by you.");
    expect(drawer).not.toContain("window.location.hostname");
  });

  test("quick report persists the issue before uploading screenshots", () => {
    const drawer = fs.readFileSync(
      path.resolve(__dirname, "../../components/tracker/TrackerQuickReportLauncher.jsx"),
      "utf8"
    );
    expect(drawer.indexOf("await createBugReport")).toBeGreaterThan(-1);
    expect(drawer.indexOf("await uploadEntries")).toBeGreaterThan(drawer.indexOf("await createBugReport"));
    expect(drawer).toContain("The issue itself is already saved.");
  });
});
