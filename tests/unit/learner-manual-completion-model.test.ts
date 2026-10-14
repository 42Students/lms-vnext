import { describe, it, expect } from "vitest";
import { manualContentCompletionGate } from "@/modules/courses/learner-manual-completion-model";
describe("manual learner content completion", () => {
  const now = new Date("2026-10-14T10:00:00Z");
  it("allows resources and completed live classes", () => {
    expect(manualContentCompletionGate("RESOURCE", null, now)).toBe("ALLOWED");
    expect(manualContentCompletionGate("LIVE_CLASS", new Date("2026-10-13T10:00:00Z"), now)).toBe("ALLOWED");
  });
  it("rejects video shortcuts and early live classes", () => {
    expect(manualContentCompletionGate("VIDEO", null, now)).toBe("TIMED_CONTENT_MANUAL_COMPLETION_NOT_ALLOWED");
    expect(manualContentCompletionGate("YOUTUBE", null, now)).toBe("TIMED_CONTENT_MANUAL_COMPLETION_NOT_ALLOWED");
    expect(manualContentCompletionGate("LIVE_CLASS", new Date("2026-10-15T10:00:00Z"), now)).toBe("LIVE_CLASS_NOT_FINISHED");
  });
});