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
    expect(lessonQuery).toMatch(/eq\(\s*lessonContents\.status,\s*"PUBLISHED",?\s*\)/);
    expect(lessonQuery).toContain('"PUBLISHED"');
    expect(lessonQuery).toContain("eq(lessonContents.visibleToStudents,true)");
    expect(lessonQuery).toContain("isNull(lessonContents.deletedAt)");
    expect(lessonQuery).toContain("eq(lessonContents.deletedWithLesson,false)");
    expect(lessonQuery).toMatch(/eq\(\s*lessonContents\.deliveryId,\s*deliveryId,\s*\)/);
    expect(lessonQuery).toMatch(/isNull\(lessonContents\.deliveryId\)/);
    expect(source).toMatch(/eq\(\s*courseLessons\.learningPathId,\s*path\.id/);
  });
});
