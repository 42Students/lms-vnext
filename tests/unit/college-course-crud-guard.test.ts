import { describe, expect, it } from "vitest";
import { createCourseInputSchema, updateCourseInputSchema } from "@/modules/courses/validation";

describe("College course mutation strict boundaries", () => {
  const input = {
    departmentId: "10000000-0000-4000-8000-000000000001",
    name: "Design Studio",
    code: "DS-101",
    description: null,
  };
  it("requires a real department and clean code before creation", () => {
    expect(createCourseInputSchema.parse(input)).toEqual(input);
    expect(createCourseInputSchema.safeParse({ ...input, collegeId: input.departmentId }).success)
      .toBe(false);
    expect(createCourseInputSchema.safeParse({ ...input, code: "@bad" }).success)
      .toBe(false);
    expect(createCourseInputSchema.safeParse({ ...input, name: "" }).success)
      .toBe(false);
  });
  it("refuses unknown edit fields and empty changes", () => {
    const expectedUpdatedAt = "2026-10-20T10:00:00Z";
    expect(updateCourseInputSchema.safeParse({ name: "Edited", expectedUpdatedAt }).success).toBe(true);
    expect(updateCourseInputSchema.safeParse({ name: "Edited" }).success).toBe(false);
    expect(updateCourseInputSchema.safeParse({ expectedUpdatedAt }).success).toBe(false);
    expect(updateCourseInputSchema.safeParse({ collegeId: input.departmentId, expectedUpdatedAt }).success)
      .toBe(false);
    expect(updateCourseInputSchema.safeParse({ status: "ARCHIVED", expectedUpdatedAt }).success)
      .toBe(false);
  });
});
