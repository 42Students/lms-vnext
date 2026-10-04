import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const canonicalLearnerPages = [
  "src/app/(authenticated)/learn/page.tsx",
  "src/app/(authenticated)/learn/courses/page.tsx",
  "src/app/(authenticated)/learn/courses/[deliveryId]/page.tsx",
  "src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx",
  "src/app/(authenticated)/learn/allQuizzes/page.tsx",
  "src/app/(authenticated)/learn/allAssignments/page.tsx",
  "src/app/(authenticated)/learn/calendar/page.tsx",
  "src/app/(authenticated)/learn/attendance/page.tsx",
  "src/app/(authenticated)/learn/my-placements/page.tsx",
  "src/app/(authenticated)/learn/my-placements/jobs/page.tsx",
  "src/app/(authenticated)/learn/my-placements/jobs/[jobId]/page.tsx",
  "src/app/(authenticated)/learn/my-placements/applications/page.tsx",
  "src/app/(authenticated)/learn/my-placements/assessments/page.tsx",
  "src/app/(authenticated)/learn/my-placements/interviews/page.tsx",
  "src/app/(authenticated)/learn/my-placements/calendar/page.tsx",
  "src/app/(authenticated)/learn/my-placements/placement/page.tsx",
  "src/app/(authenticated)/learn/my-placements/rules/page.tsx",
  "src/app/(authenticated)/learn/projects/page.tsx",
  "src/app/(authenticated)/learn/projects/[projectId]/page.tsx",
  "src/app/(authenticated)/learn/notifications/page.tsx",
  "src/app/(authenticated)/learn/profile/page.tsx",
  "src/app/quiz/page.tsx",
] as const;

describe("legacy learner route contract", () => {
  it("keeps every canonical learner page route materialized in vNext", () => {
    for (const relativePath of canonicalLearnerPages) {
      expect(fs.existsSync(path.join(process.cwd(), relativePath)), relativePath).toBe(true);
    }
  });

  it("keeps old vNext route names as redirects instead of primary learner naming", () => {
    const aliases = [
      ["src/app/(authenticated)/learn/quizzes/page.tsx", "/learn/allQuizzes"],
      ["src/app/(authenticated)/learn/assignments/page.tsx", "/learn/allAssignments"],
      ["src/app/(authenticated)/learn/placements/page.tsx", "/learn/my-placements"],
    ] as const;

    for (const [relativePath, target] of aliases) {
      const content = fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
      expect(content).toContain(`redirect("${target}")`);
    }
  });
});
