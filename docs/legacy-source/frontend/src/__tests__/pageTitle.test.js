import { getBrowserTitle, getDashboardPageTitle, titleizeRouteSegment } from "@/utils/pageTitle";

describe("page title helpers", () => {
  test("uses explicit learner route titles", () => {
    expect(getBrowserTitle("/learn/courses", "courses")).toBe("Courses · 42LMS");
    expect(getBrowserTitle("/learn/assessments", "assessments")).toBe("Assessments · 42LMS");
  });

  test("uses explicit admin route titles", () => {
    expect(getBrowserTitle("/college-admin/lesson-content", "lesson-content")).toBe("Lesson Content · 42LMS");
    expect(getBrowserTitle("/college-admin/faculty-assignment", "faculty-assignment")).toBe("Faculty Assignment · 42LMS");
  });

  test("falls back to readable route segment when active item is missing", () => {
    expect(getDashboardPageTitle("/learn/saved-jobs", undefined)).toBe("Saved Jobs");
    expect(getDashboardPageTitle("/teacher/fileExplorer", undefined)).toBe("FileExplorer");
    expect(getDashboardPageTitle("/learn/courses/[courseId]/[...courseTab]", undefined)).toBe("Courses");
  });

  test("legacy teacher file explorer route redirects instead of 404", () => {
    const source = require("fs").readFileSync(require("path").join(process.cwd(), "src/pages/teacher/fileExplorer.js"), "utf8");
    expect(source).toContain('destination: "/teacher/courses"');
    expect(source).toContain("permanent: false");
  });

  test("TPO pages use the sidebar names, detail pages included", () => {
    expect(getBrowserTitle("/tpo/batches", undefined)).toBe("Placement eligibility · 42LMS");
    expect(getBrowserTitle("/tpo/batches/[batchId]", undefined)).toBe("Placement eligibility · 42LMS");
    expect(getBrowserTitle("/tpo/recruiters", undefined)).toBe("Engage · 42LMS");
  });

  test("never returns undefined/null text in browser title", () => {
    const titles = [
      getBrowserTitle("/learn/courses", undefined),
      getBrowserTitle("/teacher/notifications", "unknown-menu"),
      getBrowserTitle("/learn/courses/[courseId]/[...courseTab]", undefined),
      getBrowserTitle("", undefined),
    ];

    titles.forEach((title) => {
      expect(title).toBeTruthy();
      expect(title).not.toMatch(/undefined|null/i);
    });
  });

  test("titleizes dashed and underscored route segments", () => {
    expect(titleizeRouteSegment("career-calendar")).toBe("Career Calendar");
    expect(titleizeRouteSegment("semester_courses")).toBe("Semester Courses");
  });
});
