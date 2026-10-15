import { describe, expect, it } from "vitest";
import { facultyResultsQuerySchema, parseFacultyResultsSearchParams } from "@/modules/courses/faculty-results-model";

describe("Faculty results pagination input", () => {
  it("accepts normal page navigation and parsed server reuse", () => {
    expect(parseFacultyResultsSearchParams({page:"2"}).data?.page).toBe(2);
    expect(facultyResultsQuerySchema.parse({page:2}).page).toBe(2);
  });
  it("rejects exponent, signed, fractional and whitespace input", () => {
    for (const page of ["1e3", "+2", "2.5", " 2 ", "", "0002", "10001"]) {
      expect(parseFacultyResultsSearchParams({page}).success).toBe(false);
    }
  });
});
