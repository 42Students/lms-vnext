import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { countFacultyCourseCardItems } from "../../src/modules/courses/faculty-course-card-summary-model";
const source = (path: string) =>
  readFileSync(new URL("../../" + path, import.meta.url), "utf8");

describe("faculty course cards use bounded scoped summaries", () => {
  it("FAC-courses-09 counts shared and exact Section records without leaking neighbouring deliveries", () => {
    const result = countFacultyCourseCardItems({
      lessonIds: new Set(["lesson-a", "lesson-b"]),
      deliveryId: "section-one",
      contents: [
        { lessonId: "lesson-a", deliveryId: null, status: "PUBLISHED" },
        { lessonId: "lesson-a", deliveryId: "section-one", status: "DRAFT" },
        { lessonId: "lesson-a", deliveryId: "section-two", status: "DRAFT" },
        { lessonId: "lesson-external", deliveryId: null, status: "PUBLISHED" },
      ],
      assignments: [
        { lessonId: "lesson-b", deliveryId: null, status: "PUBLISHED" },
        { lessonId: "lesson-b", deliveryId: "section-two", status: "PUBLISHED" },
      ],
      quizzes: [{ lessonId: "lesson-b", deliveryId: "section-one", status: "DRAFT" }],
    });
    expect(result).toEqual({
      lessons: 2, contents: 2, assignments: 1, quizzes: 1,
      draftItems: 2, publishedItems: 2,
    });
  });

  it("FAC-courses-09 uses fixed batched queries not one full workspace load per card", () => {
    const list = source("src/app/(authenticated)/teacher/courses/page.tsx");
    const batch = source("src/modules/courses/faculty-course-card-summary-service.ts");
    expect(list).toContain("listFacultyCourseCardSummaries(list.items)");
    expect(list).not.toContain("getFacultyCourseWorkspace(context,course.deliveryId)");
    expect(batch).toContain("const visible=assigned;");
    expect(batch).not.toContain("facultyCourseSummaryWindow(assigned,true).items");
    expect(batch).toContain("if (!visible.length) return result");
    expect(batch).toContain("Promise.all([");
    expect(batch).toContain("inArray(courseLessons.learningPathId, pathIds)");
    expect(batch).toContain("countFacultyCourseCardItems");
    expect(batch).toContain("ne(courseQuizzes.status, \"ARCHIVED\")");
  });
});
