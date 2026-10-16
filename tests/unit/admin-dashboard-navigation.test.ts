import { describe, expect, it } from "vitest";
import {
  COLLEGE_ADMIN_QUICK_ACTIONS,
  COLLEGE_ADMIN_SETUP_PHASES,
  COLLEGE_SETUP_GUIDE_COPY,
  SUPER_ADMIN_GLOBAL_LINKS,
  SUPER_ADMIN_COLLEGE_LINKS,
} from "@/modules/admin-ui/admin-dashboard-navigation";

type SetupStep = { key: string; label: string; href: string | null };

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
    const steps = COLLEGE_ADMIN_SETUP_PHASES.flatMap<SetupStep>((phase) => [...phase.steps]);
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
      ...COLLEGE_ADMIN_SETUP_PHASES.flatMap<SetupStep>((phase) => [...phase.steps]),
    ].filter((item) => item.href !== null);
    for (const link of links) {
      expect(link.href).toMatch(/^\/college\/[a-z-]+$/);
      expect(link.href).not.toContain("/college-admin/");
    }
    const missing = COLLEGE_ADMIN_SETUP_PHASES.flatMap<SetupStep>((phase) => [...phase.steps])
      .filter((item) => item.href === null).map((item) => item.key);
    expect(missing).not.toContain("faculty-assignment");
    expect(COLLEGE_ADMIN_SETUP_PHASES.flatMap<SetupStep>((phase) => [...phase.steps])
      .find((step) => step.key === "faculty-assignment")?.href)
      .toBe("/college/faculty-assignment");
    expect(missing).toContain("semester-courses");
    expect(missing).toContain("classes");
  });

  it("does not erroneously restore a full setup guide to Super Admin", () => {
    expect(SUPER_ADMIN_GLOBAL_LINKS.map((item) => item.label)).toEqual([
      "Tenant Setup", "Feature Controls", "Activity Log",
    ]);
    expect(SUPER_ADMIN_GLOBAL_LINKS.map(item => item.href)).toEqual([
      "/admin/tenants/setup", "/admin/features", "/admin/audit",
    ]);
    expect(SUPER_ADMIN_COLLEGE_LINKS.map(item => item.href)).toEqual([
      "/admin/tenants/setup?tab=setup", "/admin/academics", "/admin/courses",
      "/admin/people", "/admin/placements", "/admin/projects/templates",
      "/admin/verification", "/tracker/audit-findings",
    ]);
  });

  it("COL-dashboard-12 uses the exact legacy setup guide wording", () => {
    expect(COLLEGE_SETUP_GUIDE_COPY).toEqual({
      collapseLabel: "Setting up a new college? Step-by-step setup guide",
      heading: "Setup Guide (Follow in Order)",
      intro: "If you're setting up the LMS for the first time, follow these phases in order. Each phase depends on the previous one being completed.",
    });
    const steps = COLLEGE_ADMIN_SETUP_PHASES.flatMap<{ label: string; desc: string }>((p) => [...p.steps]);
    expect(steps.map((s) => s.label)).toEqual([
      "Create Departments", "Create Courses", "Add Lessons", "Add Lesson Content",
      "Set up Programs", "Create Semesters", "Map courses to semesters", "Create Batches", "Create Classes",
      "Add Faculty", "Assign Faculty", "Add Students", "Add Lecture Halls", "Jobs & Placements",
    ]);
    expect(steps.find((s) => s.label === "Set up Programs")?.desc).toBe("Degree programs (B.Tech, MBA)");
    expect(steps.find((s) => s.label === "Add Students")?.desc).toBe("Student accounts, placed in a section");
  });
});
