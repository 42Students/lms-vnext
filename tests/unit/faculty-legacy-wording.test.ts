import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import { getShellNavigation } from "@/components/shell/shell-model";
import { facultyCourseTabs } from "@/modules/courses/faculty-course-navigation";

const facultyContext: RequestContext = {
  user: { id: "u", identityUid: "i", platformStatus: "ACTIVE", systemRoles: [] },
  membership: {
    id: "m",
    collegeId: "c",
    organizationId: "o",
    status: "ACTIVE",
    roles: ["FACULTY"],
  },
};

const page = (path: string) =>
  readFileSync(`src/app/(authenticated)/teacher/${path}`, "utf8");

describe("Faculty legacy wording (lists.js, CoursesContent, QuizzesContent, AssignmentsContent)", () => {
  it("sidebar uses the exact legacy labels", () => {
    expect(getShellNavigation(facultyContext).map((i) => i.label)).toEqual([
      "Courses",
      "Contacts",
      "Notifications",
      "Class Schedule",
      "All Quizzes",
      "All assignments",
      "Profile",
    ]);
  });

  it("page headings are My Courses / My Quizzes / My Assignments", () => {
    expect(page("courses/page.tsx")).toContain('title="My Courses"');
    expect(page("allQuizzes/page.tsx")).toContain('title="My Quizzes"');
    expect(page("allAssignments/page.tsx")).toContain("<RetainedFacultyAssignments");
    expect(readFileSync("src/components/courses/faculty-assessment-overview.tsx", "utf8")).toContain('title="My Assignments"');
  });

  it("Contacts heading follows the selected tab", () => {
    const src = page("contacts/[contactsTab]/page.tsx");
    expect(src).toContain("title={selected.label}");
    for (const label of ["All Contacts", "Teachers", "Students"]) {
      expect(src).toContain(`label: "${label}"`);
    }
  });

  it("course tabs follow the newest Faculty prototype", () => {
    expect(facultyCourseTabs.map((t) => t.label)).toEqual([
      "Overview",
      "Blueprint",
      "Attendance",
      "Discussions",
      "Students",
    ]);
  });
});
