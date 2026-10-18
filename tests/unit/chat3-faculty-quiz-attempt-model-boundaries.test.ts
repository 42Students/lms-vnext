import { describe, expect, it } from "vitest";
import {
  facultyQuizAttemptsHref, facultyQuizAttemptsPage, facultyQuizAttemptsQuerySchema,
  facultyQuizAttemptSearchSchema, facultySearchQuizAttempts,
} from "@/modules/courses/faculty-quiz-attempts-model";
const quizId = "11111111-1111-4111-8111-111111111111";
const deliveryId = "22222222-2222-4222-8222-222222222222";
const other = "33333333-3333-4333-8333-333333333333";

describe("FAC-QUIZ-ATTEMPTS-MODEL-01 privacy-preserving Faculty attempt filters", () => {
  it("rejects untrusted tenant selectors, repeated query keys and nondecimal page text", () => {
    expect(facultyQuizAttemptsQuerySchema.parse({ quizId, deliveryId })).toMatchObject({
      order: "NEWEST", view: "ALL", page: 1, q: "",
    });
    for (const raw of [
      { quizId, deliveryId, collegeId: other },
      { quizId, deliveryId: [deliveryId] },
      { quizId, deliveryId, page: "1e3" },
      { quizId, deliveryId, page: 0 },
      { quizId, deliveryId, page: "001" },
      { quizId, deliveryId, page: 10001 },
      { quizId, deliveryId, order: "RANDOM" },
      { quizId, deliveryId, q: "a".repeat(121) },
    ]) {
      expect(facultyQuizAttemptsQuerySchema.safeParse(raw).success).toBe(false);
    }
    expect(facultyQuizAttemptSearchSchema.safeParse({ deliveryId }).success).toBe(true);
  });

  it("does not mutate response rows while sorting newest, oldest and date ties", () => {
    const values = [
      { id: "a", submittedAt: new Date("2099-01-01T00:00:00Z") },
      { id: "c", submittedAt: new Date("2099-01-03T00:00:00Z") },
      { id: "b", submittedAt: new Date("2099-01-03T00:00:00Z") },
    ];
    expect(facultyQuizAttemptsPage(values, 1).items.map(row => row.id)).toEqual(["b", "c", "a"]);
    expect(facultyQuizAttemptsPage(values, 1, "OLDEST").items.map(row => row.id)).toEqual([
      "a", "b", "c",
    ]);
    expect(values.map(row => row.id)).toEqual(["a", "c", "b"]);
  });

  it("clamps stale or hostile pure-model pages and sorts invalid database times deterministically", () => {
    const values = [
      { id: "z", submittedAt: new Date("invalid") },
      { id: "a", submittedAt: new Date("2099-01-01T00:00:00Z") },
      ...Array.from({ length: 20 }, (_, index) => ({
        id: "p" + index, submittedAt: new Date("2099-02-01T00:00:00Z"),
      })),
    ];
    expect(facultyQuizAttemptsPage(values, 999).page).toBe(3);
    expect(facultyQuizAttemptsPage(values, -1).page).toBe(1);
    expect(facultyQuizAttemptsPage(values, Number.NaN).page).toBe(1);
    expect(facultyQuizAttemptsPage(values, 1).items.some(row => row.id === "z")).toBe(false);
    expect(facultyQuizAttemptsPage([], 1)).toMatchObject({ total: 0, page: 1, items: [] });
  });

  it("filters only already-scoped learner names or emails, retaining no additional contacts", () => {
    const rows = [
      { learnerDisplayName: "Anika", learnerEmail: "anika@example.org", grade: 3 },
      { learnerDisplayName: "Bala", learnerEmail: null, grade: 4 },
    ];
    expect(facultySearchQuizAttempts(rows, "  ANIKA ")).toEqual([rows[0]]);
    expect(facultySearchQuizAttempts(rows, "EXAMPLE.org")).toEqual([rows[0]]);
    expect(facultySearchQuizAttempts(rows, "absent")).toEqual([]);
    const unfiltered = facultySearchQuizAttempts(rows, "");
    expect(unfiltered).toEqual(rows);
    expect(unfiltered).not.toBe(rows);
  });

  it("preserves exact quiz/delivery selector and encodes search text in navigation", () => {
    const href = facultyQuizAttemptsHref(quizId, deliveryId, 2, "OLDEST", " A&B ", "LATEST");
    const url = new URL(href, "https://example.org");
    expect(url.pathname).toBe("/teacher/report/quiz/" + quizId + "/attempts");
    expect(url.searchParams.get("deliveryId")).toBe(deliveryId);
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.get("order")).toBe("OLDEST");
    expect(url.searchParams.get("q")).toBe("A&B");
    expect(url.searchParams.get("view")).toBe("LATEST");
    expect(url.searchParams.has("collegeId")).toBe(false);
  });
});
