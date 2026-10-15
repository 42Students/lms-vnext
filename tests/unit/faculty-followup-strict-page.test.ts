import { describe, expect, it } from "vitest";
import { facultyResponseFollowUpQuerySchema, parseFacultyFollowUpSearchParams } from "@/modules/courses/faculty-response-followup-model";

describe("Faculty follow-up pagination input", () => {
  it("accepts canonical page and already validated number", () => {
    const parsed = parseFacultyFollowUpSearchParams({page:"4"});
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.page).toBe(4);
    expect(facultyResponseFollowUpQuerySchema.parse({page:4}).page).toBe(4);
  });
  it("rejects ambiguous page selectors", () => {
    for (const page of ["+2", "2e1", "1.0", " 3", "03", "", "10001"]) {
      expect(parseFacultyFollowUpSearchParams({page}).success).toBe(false);
    }
  });
});
