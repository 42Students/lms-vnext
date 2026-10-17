import { readFileSync } from "node:fs";
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
  it("COL-dashboard-01 renders all 11 live Quick Actions on the primary College Admin landing", () => {
    const routes = new Map(COLLEGE_ADMIN_QUICK_ACTIONS.map(action => [action.key, action.href]));
    expect(routes.size).toBe(11);
    expect([...routes.values()].every(href => href?.startsWith("/college/"))).toBe(true);
    expect(routes.get("hiring-dashboard")).toBe("/college/hiring-dashboard");
    expect(routes.get("attendance")).toBe("/college/attendance");
    expect(routes.get("people")).toBe("/college/people");
    const collegePage = readFileSync("src/app/(authenticated)/college/page.tsx", "utf8");
    expect(collegePage).toMatch(/<CollegeAdminQuickActions\s*\/>/);
    const dashboardActions = readFileSync("src/components/admin/admin-dashboard-actions.tsx", "utf8");
    expect(dashboardActions).toContain("export function CollegeAdminQuickActions()");
  });

  it("preserves the complete 11-card College Admin Quick Actions roster", () => {
    expect(COLLEGE_ADMIN_QUICK_ACTIONS.map((item) => item.label)).toEqual([
      "Departments", "Courses", "Programs", "Faculty", "Students",
      "Jobs", "Hiring Dashboard", "Attendance", "Assignments",
      "Quizzes", "People Directory",
    ]);
    expect(new Set(COLLEGE_ADMIN_QUICK_ACTIONS.map((item) => item.key)).size)
      .toBe(11);
  });

  it("COL-dashboard-12 preserves 14 legacy steps plus the required academic period prerequisite", () => {
    const steps = COLLEGE_ADMIN_SETUP_PHASES.flatMap<SetupStep>((phase) => [...phase.steps]);
    expect(COLLEGE_ADMIN_SETUP_PHASES.map((phase) => phase.title)).toEqual([
      "Structure", "Courses", "Academic Structure", "People",
      "Lecture Halls & Jobs (Optional)",
    ]);
    expect(steps.map((item) => item.key)).toEqual([
      "departments", "course-list", "lessons", "lesson-content",
      "programs", "semesters", "semester-courses", "academic-periods", "batches", "classes",
      "faculty", "faculty-assignment", "students", "lecture-halls", "jobs",
    ]);
    expect(new Set(steps.map((item) => item.key)).size).toBe(15);
    expect(steps.find(item => item.key === "academic-periods")?.href).toBe("/college/academics");
    expect(steps.find(item => item.key === "academic-periods")?.label).toBe("Set up Academic Periods");
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
    expect(missing).not.toContain("semester-courses");
    expect(missing).not.toContain("classes");
  });

  it("does not erroneously restore a full setup guide to Super Admin", () => {
    expect(SUPER_ADMIN_GLOBAL_LINKS.map((item) => item.label)).toEqual([
      "Tenant Setup", "Recruiter accounts", "Feature Controls", "Activity Log",
    ]);
    expect(SUPER_ADMIN_GLOBAL_LINKS.map(item => item.href)).toEqual([
      "/admin/tenants", "/admin/recruiters", "/admin/features", "/admin/audit",
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
      "Set up Programs", "Create Semesters", "Map courses to semesters", "Set up Academic Periods", "Create Batches", "Create Classes",
      "Add Faculty", "Assign Faculty", "Add Students", "Add Lecture Halls", "Jobs & Placements",
    ]);
    expect(steps.find((s) => s.label === "Set up Programs")?.desc).toBe("Degree programs (B.Tech, MBA)");
    expect(steps.find((s) => s.label === "Add Students")?.desc).toBe("Student accounts, placed in a section");
  });
});
