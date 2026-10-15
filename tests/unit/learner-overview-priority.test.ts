import { describe, expect, it } from "vitest";
import { selectPriorityLearnerActivity } from "@/modules/courses/learner-overview-priority";

type Event = {
  type: "Assignment" | "Quiz" | "Live Session";
  priority: number;
  id: string;
};

describe("learner course Home next-action priority", () => {
  it("selects an assessment over an earlier live class", () => {
    const events: Event[] = [
      { type: "Live Session", priority: 10, id: "session" },
      { type: "Assignment", priority: 90, id: "assignment" },
    ];
    expect(selectPriorityLearnerActivity(events)?.id).toBe("assignment");
  });

  it("does not lose an assessment hidden beyond the six feed events", () => {
    const events: Event[] = [
      ...Array.from({ length: 8 }, (_, i) => ({
        type: "Live Session" as const, priority: i + 1, id: `session-${i}`,
      })),
      { type: "Quiz", priority: 12, id: "quiz" },
    ];
    expect(selectPriorityLearnerActivity(events)?.id).toBe("quiz");
  });

  it("uses the earliest deadline among assignment and quiz choices", () => {
    const events: Event[] = [
      { type: "Quiz", priority: 50, id: "later" },
      { type: "Assignment", priority: 30, id: "earlier" },
    ];
    expect(selectPriorityLearnerActivity(events)?.id).toBe("earlier");
  });

  it("falls back to the nearest live session when no assessment is due", () => {
    const events: Event[] = [
      { type: "Live Session", priority: 70, id: "later" },
      { type: "Live Session", priority: 40, id: "first" },
    ];
    expect(selectPriorityLearnerActivity(events)?.id).toBe("first");
  });

  it("returns null on an empty set and ignores malformed timestamps", () => {
    expect(selectPriorityLearnerActivity<Event>([])).toBeNull();
    expect(selectPriorityLearnerActivity<Event>([
      { type: "Quiz", priority: Number.NaN, id: "invalid" },
      { type: "Live Session", priority: 40, id: "valid" },
    ])?.id).toBe("valid");
  });
});


describe("overdue still-submittable Course Home assignments", () => {
  it("prioritizes overdue published assignments over upcoming quizzes and sessions", () => {
    const events = [
      { id: "quiz", type: "Quiz" as const, priority: 30 },
      { id: "late", type: "Assignment" as const, priority: 10, overdue: true },
      { id: "live", type: "Live Session" as const, priority: 2 },
    ];
    expect(selectPriorityLearnerActivity(events)?.id).toBe("late");
  });
});
