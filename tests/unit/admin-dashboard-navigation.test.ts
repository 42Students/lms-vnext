import { describe, expect, it } from "vitest";
import {
  COLLEGE_ADMIN_QUICK_ACTIONS,
  COLLEGE_ADMIN_SETUP_PHASES,
  SUPER_ADMIN_GLOBAL_LINKS,
} from "@/modules/admin-ui/admin-dashboard-navigation";

describe("W06 legacy admin Dashboard navigation fidelity", () => {
  it("preserves the complete 11-card College Admin Quick Actions roster", () => {
    expect(COLLEGE_ADMIN_QUICK_ACTIONS.map((item) => item.label)).toEqual([
      "Departments", "Courses", "Programs", "Faculty", "Students",
      "Jobs", "Hiring Dashboard", "Attendance", "Assignments",
      "Quizzes", "People Directory",
    ]);
    expect(new Set(COLLEGE_ADMIN_QUICK_ACTIONS.map((item) => item.key)).size)
      .toBe(11);
  });

  it("preserves all 14 legacy College Admin setup steps by phase", () => {
    const steps = COLLEGE_ADMIN_SETUP_PHASES.flatMap((phase) => phase.steps);
    expect(COLLEGE_ADMIN_SETUP_PHASES.map((phase) => phase.title)).toEqual([
      "Structure", "Courses", "Academic Structure", "People",
      "Lecture Halls & Jobs (Optional)",
    ]);
    expect(steps.map((item) => item.key)).toEqual([
      "departments", "course-list", "lessons", "lesson-content",
      "programs", "semesters", "semester-courses", "batches", "classes",
      "faculty", "faculty-assignment", "students", "lecture-halls", "jobs",
    ]);
    expect(new Set(steps.map((item) => item.key)).size).toBe(14);
  });

  it("links only actual vNext workspace routes; never invents missing legacy screens", () => {
    const links = [
      ...COLLEGE_ADMIN_QUICK_ACTIONS,
      ...COLLEGE_ADMIN_SETUP_PHASES.flatMap((phase) => phase.steps),
    ].filter((item) => item.href !== null);
    for (const link of links) {
      expect(link.href).toMatch(/^\/college\/(departments|courses|programs|placements)$/);
      expect(link.href).not.toContain("/college-admin/");
    }
    const missing = COLLEGE_ADMIN_SETUP_PHASES.flatMap((phase) => phase.steps)
      .filter((item) => item.href === null).map((item) => item.key);
    expect(missing).toContain("faculty-assignment");
    expect(missing).toContain("lecture-halls");
    expect(missing).toContain("semester-courses");
    expect(missing).toContain("classes");
  });

  it("does not erroneously restore a full setup guide to Super Admin", () => {
    expect(SUPER_ADMIN_GLOBAL_LINKS.map((item) => item.label)).toEqual([
      "Tenant Setup", "Feature Controls", "Activity Log",
    ]);
    expect(SUPER_ADMIN_GLOBAL_LINKS[0]?.href).toBeNull();
    expect(SUPER_ADMIN_GLOBAL_LINKS[1]?.href).toBeNull();
    expect(SUPER_ADMIN_GLOBAL_LINKS[2]?.href).toBe("/activity");
  });
});
