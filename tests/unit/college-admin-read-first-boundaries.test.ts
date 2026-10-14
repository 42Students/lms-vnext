import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** Previously delivered College Admin routes must keep honest loading/errors.
 * Their data-level empty states are rendered by a shared directory component. */
const deliveredRoutes = [
  "assignments",
  "quizzes",
  "faculty",
  "students",
  "semester-courses",
  "faculty-assignment",
  "lessons",
  "course-progress",
  "semesters",
  "batches",
  "classes",
  "electives",
] as const;

const pagesRoot = join(process.cwd(), "src/app/(authenticated)/college");

describe("College Admin read-first page boundaries", () => {
  for (const name of deliveredRoutes) {
    it(`${name} retains a page, loading and retry-capable error boundary`, () => {
      const dir = join(pagesRoot, name);
      for (const file of ["page.tsx", "loading.tsx", "error.tsx"]) {
        expect(existsSync(join(dir, file))).toBe(true);
      }
      const loading = readFileSync(join(dir, "loading.tsx"), "utf8");
      const error = readFileSync(join(dir, "error.tsx"), "utf8");
      expect(loading).toContain("aria-busy");
      expect(error).toContain("reset");
      expect(error).toMatch(/ErrorState|role="alert"/);
    });
  }

  it("shared view components explicitly distinguish real empty pages from load failures", () => {
    for (const file of [
      "src/components/courses/college-assessment-aggregate.tsx",
      "src/components/college/college-role-directory-workspace.tsx",
      "src/components/academics/college-academic-directory.tsx",
      "src/components/academics/college-structure-directory.tsx",
      "src/components/courses/college-learning-directory.tsx",
    ]) {
      const content = readFileSync(join(process.cwd(), file), "utf8");
      expect(content).toMatch(/\.items\.length === 0/);
      expect(content).toMatch(/\.total === 0/);
    }
  });
});
