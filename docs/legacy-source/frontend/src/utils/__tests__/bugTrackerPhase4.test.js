const fs = require("fs");
const path = require("path");

describe("42 Tracker fix and retest workflow UI", () => {
  test("keeps engineering metadata collapsed and off the reporting form", () => {
    const detail = fs.readFileSync(
      path.resolve(__dirname, "../../pages/tracker/issues/[issueId].js"),
      "utf8"
    );
    const engineering = fs.readFileSync(
      path.resolve(__dirname, "../../components/tracker/EngineeringDetails.jsx"),
      "utf8"
    );
    const report = fs.readFileSync(
      path.resolve(__dirname, "../../pages/tracker/index.js"),
      "utf8"
    );

    expect(detail).toContain("<EngineeringDetails");
    expect(engineering).toContain("<details");
    expect(engineering).toContain("Engineering details");
    expect(report).not.toContain("rootCause");
    expect(report).not.toContain("frontendCommitSha");
  });

  test("retest UI only renders for READY_FOR_RETEST and exposes simple outcomes", () => {
    const retest = fs.readFileSync(
      path.resolve(__dirname, "../../components/tracker/RetestCard.jsx"),
      "utf8"
    );
    expect(retest).toContain('issue.status !== "READY_FOR_RETEST"');
    expect(retest).toContain("Works now");
    expect(retest).toContain("Still broken");
    expect(retest).toContain('submit("PASS")');
    expect(retest).toContain('submit("FAIL")');
  });

  test("activity is secondary and cannot break issue details", () => {
    const detail = fs.readFileSync(
      path.resolve(__dirname, "../../pages/tracker/issues/[issueId].js"),
      "utf8"
    );
    expect(detail).toContain("listBugActivity");
    expect(detail).toContain(".catch(() => {})");
  });
});
