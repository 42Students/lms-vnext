const fs = require("fs");
const path = require("path");

describe("42 Tracker screenshot evidence flow", () => {
  test("persists the issue before uploading screenshot evidence", () => {
    const page = fs.readFileSync(
      path.resolve(__dirname, "../../pages/tracker/index.js"),
      "utf8"
    );
    const createIndex = page.indexOf("await createBugReport(payload)");
    const uploadIndex = page.indexOf("await uploadEntries(");
    expect(createIndex).toBeGreaterThan(-1);
    expect(uploadIndex).toBeGreaterThan(createIndex);
    expect(page).toContain("The issue is safe");
  });

  test("supports paste/drop/browse and issue-detail evidence gallery", () => {
    const picker = fs.readFileSync(
      path.resolve(__dirname, "../../components/tracker/ScreenshotPicker.jsx"),
      "utf8"
    );
    const detail = fs.readFileSync(
      path.resolve(__dirname, "../../pages/tracker/issues/[issueId].js"),
      "utf8"
    );
    expect(picker).toContain('window.addEventListener("paste"');
    expect(picker).toContain("onDrop=");
    expect(picker).toContain('type="file"');
    expect(detail).toContain("listBugAttachments");
    expect(detail).toContain("tracker-evidence-grid");
  });
});
