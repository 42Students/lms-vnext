import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(
  "src/modules/courses/learner-course-service.ts", "utf8",
);

describe("Learner syllabus soft-delete and audience isolation", () => {
  it("excludes soft-deleted lessons even if marked active and visible", () => {
    const lessonQuery = source.slice(
      source.lastIndexOf("const rows = await getDb()", source.indexOf("type ContentItem")),
      source.indexOf("type ContentItem"),
    );
    expect(lessonQuery).toContain('eq(courseLessons.status, "ACTIVE")');
    expect(lessonQuery).toContain("eq(courseLessons.visibleToStudents, true)");
    expect(lessonQuery).toContain("isNull(courseLessons.deletedAt)");
  });

  it("continues to deny hidden, deleted and foreign-class content", () => {
    const lessonQuery = source.slice(
      source.lastIndexOf("const rows = await getDb()", source.indexOf("type ContentItem")),
      source.indexOf("type ContentItem"),
    );
    expect(lessonQuery).toContain('eq(lessonContents.status,');
    expect(lessonQuery).toContain('"PUBLISHED"');
    expect(lessonQuery).toContain("eq(lessonContents.visibleToStudents,true)");
    expect(lessonQuery).toContain("isNull(lessonContents.deletedAt)");
    expect(lessonQuery).toContain("eq(lessonContents.deletedWithLesson,false)");
    expect(lessonQuery).toContain("eq(lessonContents.deliveryId,");
    expect(lessonQuery).toContain("deliveryId,");
    expect(lessonQuery).toContain("eq(courseLessons.learningPathId,");
  });
});
