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
  "videos",
  "resources",
  "course-progress",
  "semesters",
  "batches",
  "classes",
  "electives",
  "attendance/departments",
  "attendance/corrections",
  "placements/readiness-by-department",
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
      // Shared loading is announced via a labeled Skeleton role=status; the
      // old direct aria-busy marker is no longer the only valid accessible pattern.
      if (!loading.includes("aria-busy")) {
        expect(loading).toContain("GracefulPageLoading");
        const shared = readFileSync(join(process.cwd(),
          "src/components/ui/graceful-page-loading.tsx"),"utf8");
        const skeleton = readFileSync(join(process.cwd(),
          "src/components/ui/skeleton.tsx"),"utf8");
        expect(shared).toContain("<Skeleton label={label}");
        expect(shared).toContain('role="status"');
        expect(shared).toContain("Try again");
        expect(skeleton).toContain('role="status" aria-live="polite"');
        expect(skeleton).toContain('<span className="sr-only">{label}</span>');
      }
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
      "src/components/courses/college-content-aggregate.tsx",
    ]) {
      const content = readFileSync(join(process.cwd(), file), "utf8");
      // A shared DataTable can own the empty state, while other directories
      // explicitly compare their filtered row count to zero. The page error
      // boundary above remains a separate retryable failure, not an empty list.
      expect(content).toContain(".items.length");
      expect(content).toMatch(/EmptyState|\.items\.length\s*===?\s*0/);
    }
  });
});
