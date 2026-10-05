import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("learner aggregate assignment parity", () => {
  it("opens an in-page assignment drawer with submission and review context", () => {
    const overview = fs.readFileSync(
      path.join(
        process.cwd(),
        "src/components/courses/learner-assessment-overview.tsx",
      ),
      "utf8",
    );
    const page = fs.readFileSync(
      path.join(
        process.cwd(),
        "src/app/(authenticated)/learn/allAssignments/page.tsx",
      ),
      "utf8",
    );

    expect(overview).toContain('import { Drawer }');
    expect(overview).toContain("AssignmentSubmissionControl");
    expect(overview).toContain("Your submission");
    expect(overview).toContain("Open in Learning Path");
    expect(overview).toContain("submissionText");
    expect(overview).toContain("submissionUrl");
    expect(page).toContain("submissionText:");
    expect(page).toContain("submissionUrl:");
    expect(page).toContain("feedback:");
  });
});
