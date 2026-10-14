import { describe, expect, it } from "vitest";
import { adminLessonStats, adminLearningHref, adminLearningQuerySchema } from "@/modules/courses/admin-learning-read-model";
import type { CollegeLessonRecord } from "@/modules/courses/college-learning-directory-model";
describe("Super Admin lesson model", () => {
  it("counts persisted content, not learners", () => {
    const rows = [{ contentCount: 5, publishedContentCount: 3 }, { contentCount: 2, publishedContentCount: 1 }] as CollegeLessonRecord[];
    expect(adminLessonStats(rows)).toEqual({ lessons: 2, authored: 7, published: 4 });
  });
  it("parses bounded query and builds admin-only navigation", () => {
    expect(adminLearningQuerySchema.safeParse({ q: "x", page: "1001" }).success).toBe(false);
    expect(adminLearningHref("LESSONS", { q: "a", status: "ALL", page: 2 })).toBe("/admin/lessons?q=a&status=ALL&page=2");
  });
});
