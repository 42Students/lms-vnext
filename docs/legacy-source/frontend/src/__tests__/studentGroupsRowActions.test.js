import fs from "fs";
import path from "path";

const source = fs.readFileSync(
  path.join(process.cwd(), "src/components/admin/studentGroups/StudentGroupsList.jsx"),
  "utf8"
);

describe("Student Groups row mutation lifecycle", () => {
  test("status and delete actions are single-flight with row pending feedback and inline retry", () => {
    expect(source).toContain("rowActionIdsRef");
    expect(source).toContain("beginRowAction");
    expect(source).toContain("pendingRowIds.has");
    expect(source).toContain("loading={rowPending}");
    expect(source).toContain('message="Student group action failed"');
    expect(source).toContain(">Retry</Button>");
    expect(source).toContain("await load({ preserveExisting: true })");
  });
});
