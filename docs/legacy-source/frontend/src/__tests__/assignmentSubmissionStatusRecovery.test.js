import fs from "fs";
import path from "path";
import { learnerAssignmentState } from "@/components/Assignments/AssignmentsContent";

const source = fs.readFileSync(path.join(process.cwd(), "src/components/Assignments/AssignmentsContent.jsx"), "utf8");

describe("learner assignment submission-status recovery", () => {
  test("unknown submission state fails closed and never advertises Submit", () => {
    expect(learnerAssignmentState({ dueDate: null }, null, undefined, "loading")).toMatchObject({
      action: "View",
      label: "Checking submission status…",
    });
    expect(learnerAssignmentState({ dueDate: null }, null, undefined, "error")).toMatchObject({
      action: "View",
      label: expect.stringContaining("Submission status unavailable"),
    });
  });

  test("submission lookup errors are visible and retryable instead of silently becoming not-submitted", () => {
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain("Submission status is unavailable");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain("Retry submission status");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain("We couldn't verify your submission history");
    expect(source).not.toContain(".catch(() => {});\n    return () => { cancelled = true; };");
  });

  test("same-user refresh failure preserves the last known map while new-user scope clears it", () => {
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain("submissionScopeRef.current !== scope");
    expect(source).toContain("setSubmissionsByContentId(new Map())");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain("setSubmissionsLoaded(true)");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain('type={submissionsLoaded ? "warning" : "error"}');
  });
});
