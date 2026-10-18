import { describe, expect, it } from "vitest";
import { assertAssignmentSubmissionDeadline } from "@/modules/courses/assignment-submission-deadline-policy";
import { CoursesServiceError } from "@/modules/courses/errors";

function expectDenied(dueAt: Date | null, now: Date, code: string) {
  try {
    assertAssignmentSubmissionDeadline(dueAt, now);
  } catch (error) {
    expect(error).toBeInstanceOf(CoursesServiceError);
    expect((error as CoursesServiceError).code).toBe(code);
    return;
  }
  throw new Error("Expected the persisted assignment deadline guard to deny submission");
}

describe("LEARNER-learning-misc-05 persisted assignment deadline", () => {
  it("allows submissions strictly before the saved deadline, down to one millisecond", () => {
    const dueAt = new Date("2099-01-30T18:29:59.999Z");
    expect(() => assertAssignmentSubmissionDeadline(dueAt, new Date(dueAt.getTime() - 1))).not.toThrow();
  });

  it("refuses a request at or after its persisted deadline regardless of a stale open client tab", () => {
    const dueAt = new Date("2099-01-30T18:29:59.999Z");
    expectDenied(dueAt, dueAt, "ASSIGNMENT_DEADLINE_PASSED");
    expectDenied(dueAt, new Date(dueAt.getTime() + 1), "ASSIGNMENT_DEADLINE_PASSED");
  });

  it("rejects missing and malformed deadlines instead of allowing an open-ended submission", () => {
    const now = new Date("2099-01-30T12:00:00.000Z");
    expectDenied(null, now, "ASSIGNMENT_DEADLINE_NOT_CONFIGURED");
    expectDenied(new Date("invalid"), now, "ASSIGNMENT_DEADLINE_NOT_CONFIGURED");
    expectDenied(new Date("2099-01-31T00:00:00.000Z"), new Date("invalid"), "ASSIGNMENT_DEADLINE_PASSED");
  });

  it("does not mistake a next-day IST midnight deadline for midnight UTC", () => {
    // 31 January 00:00 Asia/Kolkata is 30 January 18:30 UTC.
    const istMidnight = new Date("2099-01-30T18:30:00.000Z");
    expect(() => assertAssignmentSubmissionDeadline(istMidnight, new Date("2099-01-30T18:29:59.999Z"))).not.toThrow();
    expectDenied(istMidnight, istMidnight, "ASSIGNMENT_DEADLINE_PASSED");
  });
});
