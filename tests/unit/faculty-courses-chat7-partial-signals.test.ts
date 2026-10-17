import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
const read = (file: string) =>
  readFileSync(new URL("../../" + file, import.meta.url), "utf8");
describe("Faculty Home partial signal recovery", () => {
  it("FAC-courses-27 retains successful source responses when attendance or an assignment fails", () => {
    const service = read("src/modules/courses/faculty-course-home-service.ts");
    expect(service).toContain("Promise.allSettled(");
    expect(service).toContain('result.status === "fulfilled"');
    expect(service).toContain("attendance: attendanceComplete");
    expect(service).toContain("assignments: assignmentsComplete");
    expect(service).not.toContain("assignments: assignmentRows,\n  });\n}");
  });
  it("FAC-courses-27 shows Retry signals and never describes failed counts as zero or All clear", () => {
    const view = read("src/components/courses/faculty-course-home-signals.tsx");
    expect(view).toContain("Some faculty course signals are incomplete");
    expect(view).toContain("Unknown metrics are shown as unavailable, not zero.");
    expect(view).toContain("Retry signals");
    expect(view).toContain("assignmentsReady ? signals.pendingSubmissions.length : \"—\"");
    expect(view).toContain("riskReady ? signals.atRiskTotal : \"—\"");
    expect(view).toContain('!assignmentsReady || signals.pendingSubmissions.length');
    expect(view).toContain("Learner risk signals are unavailable");
    expect(view).toContain("Performance metrics are unavailable");
  });
});
