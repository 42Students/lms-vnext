import { describe, expect, it } from "vitest";
import { browserTitleForPath } from "@/components/shell/page-titles";

describe("legacy browser titles (dev format `<title> · 42LMS`)", () => {
  it("uses the bare 42LMS fallback when no title is known", () => {
    expect(browserTitleForPath("/")).toBe("42LMS");
    expect(browserTitleForPath("/tpo/home")).toBe("Home · 42LMS");
  });

  it.each([
    ["/learn/courses", "Courses · 42LMS"],
    ["/learn/allQuizzes", "All Quizzes · 42LMS"],
    ["/learn/allAssignments", "All Assignment · 42LMS"],
    ["/learn/calendar", "Calendar · 42LMS"],
    ["/learn/my-placements/offers", "My Placements · 42LMS"],
    ["/teacher/courses", "Courses · 42LMS"],
    ["/teacher/contacts/allContacts", "Contacts · 42LMS"],
    ["/teacher/profile", "Profile · 42LMS"],
    ["/mentor/projects", "Mentor · 42LMS"],
    ["/mentor/notifications", "Notifications · 42LMS"],
    ["/college", "Dashboard · 42LMS"],
    ["/college/activity", "Activity Log · 42LMS"],
    ["/college/semester-courses", "Semester-Course Mapping · 42LMS"],
    ["/college/people", "People Directory · 42LMS"],
    ["/college/faculty", "Faculty · 42LMS"],
  ])("%s -> %s", (path, title) => {
    expect(browserTitleForPath(path)).toBe(title);
  });

  it("uses the constant Superadmin title for Super Admin", () => {
    expect(browserTitleForPath("/admin/colleges", { superAdmin: true })).toBe(
      "Superadmin · 42LMS",
    );
    expect(browserTitleForPath("/dashboard", { superAdmin: true })).toBe(
      "Superadmin · 42LMS",
    );
  });
});
