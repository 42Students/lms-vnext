const fs = require("fs");
const path = require("path");

describe("42 Tracker low-friction reporting", () => {
  const reportPage = fs.readFileSync(
    path.resolve(__dirname, "../../pages/tracker/index.js"),
    "utf8"
  );

  test("autosaves and restores unfinished reports", () => {
    expect(reportPage).toContain("42tracker_report_draft_v1");
    expect(reportPage).toContain("Unsaved report restored.");
    expect(reportPage).toContain("onValuesChange={saveDraft}");
    expect(reportPage).toContain("localStorage.removeItem(DRAFT_KEY)");
  });

  test("supports keyboard submission without changing normal form validation", () => {
    expect(reportPage).toContain('event.key === "Enter"');
    expect(reportPage).toContain("event.ctrlKey || event.metaKey");
    expect(reportPage).toContain("form.submit()");
  });

  test("keeps repetitive context across successive reports", () => {
    expect(reportPage).toContain("reporterName: values.reporterName");
    expect(reportPage).toContain("accountRole: values.accountRole");
    expect(reportPage).toContain("environment: values.environment");
  });
});
