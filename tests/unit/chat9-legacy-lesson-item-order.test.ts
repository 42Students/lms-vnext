import { describe, expect, it } from "vitest";
import { compareLegacyLearnerLessonItems } from "@/modules/courses/legacy-lesson-item-sort-model";

describe("legacy learner lesson item order", () => {
  it("uses explicit authored sequence before dates or item kind", () => {
    const values = [
      {id: "quiz-uuid", sequence: 2, createdAt: new Date("2024-01-01")},
      {id: "content-uuid", sequence: 1, createdAt: new Date("2025-01-01")},
      {id: "assignment-uuid", sequence: 2, createdAt: new Date("2023-01-01")},
    ];
    expect(values.sort(compareLegacyLearnerLessonItems).map(value => value.id))
      .toEqual(["content-uuid", "quiz-uuid", "assignment-uuid"]);
  });

  it("falls back to dates then numeric legacy IDs for missing sequences", () => {
    const values = [
      {id: "8", sequence: null, createdAt: null},
      {id: "dated-later", sequence: null, createdAt: new Date("2024-06-01")},
      {id: "3", sequence: null, createdAt: null},
      {id: "dated-earlier", sequence: null, createdAt: new Date("2024-01-01")},
      {id: "authored", sequence: 15, createdAt: null},
    ];
    expect(values.sort(compareLegacyLearnerLessonItems).map(value => value.id))
      .toEqual(["authored", "dated-earlier", "dated-later", "3", "8"]);
  });
});
