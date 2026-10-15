import { describe, it, expect } from "vitest";
import { isLearnerAssignmentHttpsLink } from "@/modules/courses/learner-assignment-link-model";
describe("learner assignment link client validation", () => {
  it("accepts secure submission links", () => { expect(isLearnerAssignmentHttpsLink(" https://example.org/item ")).toBe(true); });
  it("rejects credentials and unsafe protocols before sending", () => {
    for (const value of ["https://user:secret@example.org/item","http://example.org/item","javascript:alert(1)","not a link"]) expect(isLearnerAssignmentHttpsLink(value)).toBe(false);
  });
});
