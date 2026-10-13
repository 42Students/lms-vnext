import { describe, expect, it } from "vitest";
import { facultyCourseTabs, facultyCourseTabFromPath, facultyCourseTabHref, isFacultyCourseTab } from "@/modules/courses/faculty-course-navigation";

describe("Faculty course legacy tab navigation contract", () => {
  it("preserves all five distinct legacy daily-use pages in original order", () => {
    expect(facultyCourseTabs.map((tab) => tab.path)).toEqual([
      "home", "blueprint", "students", "attendanceDetail", "discussions",
    ]);
    expect(facultyCourseTabs.map((tab) => tab.label)).toEqual([
      "Overview", "Blueprint", "Students", "Attendance", "Discussions",
    ]);
  });

  it("constructs exact Section-scoped destinations without retaining another Section", () => {
    expect(facultyCourseTabHref("delivery-two", "blueprint"))
      .toBe("/teacher/courses/delivery-two/blueprint");
    expect(facultyCourseTabHref("delivery-two", "attendanceDetail"))
      .toBe("/teacher/courses/delivery-two/attendanceDetail");
    expect(facultyCourseTabHref("delivery /#2", "students"))
      .toBe("/teacher/courses/delivery%20%2F%232/students");
  });

  it("treats unsupported and nested tabs as Overview instead of a misleading page", () => {
    expect(isFacultyCourseTab("learningPath")).toBe(false);
    expect(isFacultyCourseTab("blueprint")).toBe(true);
    expect(facultyCourseTabFromPath("/teacher/courses/delivery-1/students")).toBe("students");
    expect(facultyCourseTabFromPath("/teacher/courses/delivery-1/not-a-tab")).toBe("home");
  });
});
