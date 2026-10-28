import { describe, expect, it } from "vitest";
import { legacyFormalTitle } from "@/modules/courses/course-legacy-parity-model";

/** Legacy NewProgramDetailsDTO.CourseInfo uses shortTitle != null ? shortTitle : courseName.
 * The historical course.formal_title column is retired; do not store another
 * mutable display name or change the null-based fallback to a truthy fallback. */
describe("DB-078 derived formal_title wire semantics", () => {
  it("uses the short title when present", () => {
    expect(legacyFormalTitle({ name: "Compiler Design", shortTitle: "Compilers" }))
      .toBe("Compilers");
  });
  it("uses the course name only for a null short title", () => {
    expect(legacyFormalTitle({ name: "Compiler Design", shortTitle: null }))
      .toBe("Compiler Design");
  });
  it("does not reinterpret empty or whitespace strings as null", () => {
    expect(legacyFormalTitle({ name: "Compiler Design", shortTitle: "" }))
      .toBe("");
    expect(legacyFormalTitle({ name: "Compiler Design", shortTitle: " " }))
      .toBe(" ");
  });
});
