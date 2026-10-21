const fs = require("fs");
const path = require("path");

describe("42 Logs console", () => {
  test("uses authenticated Super Admin POST APIs and never issue mutations", () => {
    const service = fs.readFileSync(
      path.resolve(__dirname, "../../api/Services/SuperAdminLogsService.js"),
      "utf8"
    );
    const page = fs.readFileSync(
      path.resolve(__dirname, "../../pages/tracker/logs.js"),
      "utf8"
    );

    expect(service).toContain('"/api/v1/superadmin/logs/query"');
    expect(service).toContain('"/api/v1/superadmin/logs/detail"');
    expect(service).toContain('import Api from "../ApiMethod"');
    // The concern here is free-text search/detail lookups leaking into a URL, not GET in general --
    // status/mark-viewed/mute (added alongside the alerting work) take no free-text parameters.
    expect(service).toContain('Api.post("/api/v1/superadmin/logs/query"');
    expect(service).toContain('Api.post("/api/v1/superadmin/logs/detail"');
    expect(page).not.toContain("createBugReport");
    expect(page).not.toContain("updateBug");
    expect(page).not.toContain("issueId");
  });

  test("keeps bounded environment severity time and deliberate search controls", () => {
    const page = fs.readFileSync(
      path.resolve(__dirname, "../../pages/tracker/logs.js"),
      "utf8"
    );

    expect(page).toContain('{ value: "PRODUCTION", label: "Production" }');
    expect(page).toContain('{ value: "DEVELOPMENT", label: "Development" }');
    expect(page).toContain('{ value: "UAT", label: "UAT" }');
    expect(page).toContain('{ value: "WARNING", label: "Warnings + Errors" }');
    expect(page).toContain('maxLength={200}');
    expect(page).toContain("Run query");
    expect(page).toContain("Load older");
  });

  test("preserves stable pagination while keeping refresh independent", () => {
    const page = fs.readFileSync(
      path.resolve(__dirname, "../../pages/tracker/logs.js"),
      "utf8"
    );

    expect(page).toContain("paginationAnchorRef");
    expect(page).toContain("pageToken: nextPageToken");
    expect(page).toContain("anchor: paginationAnchorRef.current");
    expect(page).toContain("refreshRequestRef");
    expect(page).toContain("olderRequestRef");
  });

  test("only surfaces Logs nav for a superadmin browser context", () => {
    const shell = fs.readFileSync(
      path.resolve(__dirname, "../../components/tracker/TrackerShell.jsx"),
      "utf8"
    );

    expect(shell).toContain("userData?.id === 0");
    expect(shell).toContain('href="/tracker/logs"');
  });
});
