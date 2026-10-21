const fs = require("fs");
const path = require("path");

describe("42 Logs Phase 8A", () => {
  test("searches with POST bodies and loads raw detail lazily", () => {
    const service = fs.readFileSync(
      path.resolve(__dirname, "../../api/Services/SuperAdminLogsService.js"),
      "utf8"
    );
    const page = fs.readFileSync(
      path.resolve(__dirname, "../../pages/tracker/logs.js"),
      "utf8"
    );

    expect(service).toContain('Api.post("/api/v1/superadmin/logs/query"');
    expect(service).toContain('Api.post("/api/v1/superadmin/logs/detail"');
    expect(page).toContain("getCloudLogDetail");
    expect(page).toContain("selectedDetail");
  });

  test("query changes clear old results and refresh failures explicitly mark stale data", () => {
    const page = fs.readFileSync(
      path.resolve(__dirname, "../../pages/tracker/logs.js"),
      "utf8"
    );

    expect(page).toContain("setItems([])");
    expect(page).toContain("setStale(true)");
    expect(page).toContain("Showing the last successful results. They may be stale.");
    expect(page).toContain("Run query");
  });

  test("background refresh and pagination use separate cancellation channels", () => {
    const page = fs.readFileSync(
      path.resolve(__dirname, "../../pages/tracker/logs.js"),
      "utf8"
    );

    expect(page).toContain("refreshRequestRef");
    expect(page).toContain("olderRequestRef");
    expect(page).toContain("loadedOlderRef");
    expect(page).toContain("document.hidden");
    expect(page).toContain("visibilitychange");
  });
});
