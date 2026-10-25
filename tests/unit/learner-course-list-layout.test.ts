import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  new URL("../../src/components/courses/learner-course-list.tsx", import.meta.url),
  "utf8",
);

describe("learner Courses responsive layout source contract", () => {
  it("keeps the Electives heading in a dedicated full-width grid row", () => {
    expect(source).toContain('<Fragment key={row.course.deliveryId}>');
    expect(source).toContain('className="col-span-full mb-1 mt-2');
    expect(source).toContain('className="min-w-0"');
    expect(source).toContain("startsElectiveGroup");
    expect(source).not.toContain('className={startsElectiveGroup ? "md:col-span-2 xl:col-span-3" : ""}');
  });

  it("keeps course-type filters mobile-responsive and accessible", () => {
    expect(source).toContain('label="Filter by course type"');
    expect(source).toContain('value={effectiveTypeFilter}');
    expect(source).toContain('{value: "elective", label: `Electives ${electiveCount}`}');
    expect(source).toContain('className="w-full md:w-auto');
    expect(source).toContain("setVisibleLimit(PAGE_SIZE)");
  });

  it("keeps clickable cards linked to the correct learner course overview", () => {
    expect(source).toContain('href={`/learn/courses/${encodeURIComponent(row.course.deliveryId)}/home`}');
  });
});
