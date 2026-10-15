import { describe, expect, it } from "vitest";
import { submitAssignmentInputSchema } from "@/modules/courses/assignment-validation";
const deliveryId = "00000000-0000-4000-8000-000000000001";
const payload = (submissionUrl: string) => ({ deliveryId, submissionType: "LINK", submissionUrl });
describe("learner link assignment boundary", () => {
  it("allows ordinary HTTPS links", () => {
    expect(submitAssignmentInputSchema.safeParse(payload("https://example.org/assignment")).success).toBe(true);
  });
  it("bounds extremely long links before storage", () => {
    const oversized = "https://example.org/" + "a".repeat(2049);
    expect(submitAssignmentInputSchema.safeParse(payload(oversized)).success).toBe(false);
  });
  it("rejects embedded URL credentials and non HTTPS links", () => {
    for (const url of ["https://alice:secret@example.org/file", "http://example.org/file", "javascript:alert(1)"]) {
      expect(submitAssignmentInputSchema.safeParse(payload(url)).success).toBe(false);
    }
  });
});
