import { isExpiredUnsubmittedQuiz } from "@/pages/Dashboard/course/syllabus/syllabus";

// #9's fix blocks OPENING an already-expired quiz, but a learner still had to click into a dead
// item on the roadmap list to discover that -- this is the pure logic behind the "Expired" tag
// added directly to the list row instead, so they never have to.
describe("isExpiredUnsubmittedQuiz", () => {
  test("flags a quiz whose due date has passed and hasn't been submitted", () => {
    const content = { submitted: false, contentDataDTO: { due_date: "2020-01-01T00:00:00.000Z" } };
    expect(isExpiredUnsubmittedQuiz("quiz", content)).toBe(true);
  });

  test("does not flag an already-submitted quiz, even past its due date", () => {
    const content = { submitted: true, contentDataDTO: { due_date: "2020-01-01T00:00:00.000Z" } };
    expect(isExpiredUnsubmittedQuiz("quiz", content)).toBe(false);
  });

  test("does not flag a quiz whose due date hasn't passed yet", () => {
    const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const content = { submitted: false, contentDataDTO: { due_date: future } };
    expect(isExpiredUnsubmittedQuiz("quiz", content)).toBe(false);
  });

  test("does not flag a quiz with no due date at all", () => {
    const content = { submitted: false, contentDataDTO: {} };
    expect(isExpiredUnsubmittedQuiz("quiz", content)).toBe(false);
  });

  test("never flags a non-quiz item, even one shaped exactly like an expired quiz", () => {
    const content = { submitted: false, contentDataDTO: { due_date: "2020-01-01T00:00:00.000Z" } };
    expect(isExpiredUnsubmittedQuiz("assignment", content)).toBe(false);
  });
});
