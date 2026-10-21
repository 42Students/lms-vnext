import { filterNavByFeatureFlags } from "@/utils/featureFlagNavFilter";

describe("filterNavByFeatureFlags", () => {
  const nav = [
    { modulename: "Dashboard", path: "dashboard" },
    { modulename: "Courses & Content", path: "courses" },
    { modulename: "Quizzes", path: "allQuizzes" },
    { modulename: "Assignments", path: "allAssignments" },
    { modulename: "Attendance", path: "attendance" },
    { modulename: "Class Schedule", path: "calendar" },
    { modulename: "Placements", path: "jobs" },
    { modulename: "Projects", path: "projects" },
    { divider: true },
    { modulename: "Profile", path: "profile" },
  ];

  const mentorNav = [
    { modulename: "Projects", path: "projects" },
    { modulename: "Meetings", path: "calendar" },
    { modulename: "Notifications", path: "notifications" },
  ];

  const paths = (items) => items.filter((item) => !item.divider).map((item) => item.path);

  it("passes everything through when no flags are given", () => {
    expect(filterNavByFeatureFlags(nav)).toHaveLength(nav.length);
  });

  it("treats unknown module flags as irrelevant", () => {
    expect(filterNavByFeatureFlags(nav, { modules: { somethingElse: false } })).toHaveLength(nav.length);
  });

  it("still honors legacy Projects and Placements flags", () => {
    const result = filterNavByFeatureFlags(nav, { projectsEnabled: false, placementsEnabled: false });
    expect(paths(result)).not.toContain("projects");
    expect(paths(result)).not.toContain("jobs");
    expect(paths(result)).toContain("courses");
  });

  it("never hides core Courses, lessons, quizzes, assignments, attendance or schedule for retired OFF flags", () => {
    const result = filterNavByFeatureFlags(nav, { modules: { courses: false } });
    expect(result).toEqual(nav);
  });

  it("keeps course pages visible with a retired locked/off backend payload", () => {
    const result = filterNavByFeatureFlags(nav, {
      projectsEnabled: true,
      placementsEnabled: true,
      modules: { courses: false, projects: false, placements: false },
    });
    expect(paths(result)).toEqual([
      "dashboard", "courses", "allQuizzes", "allAssignments", "attendance", "calendar", "profile",
    ]);
  });

  it("lets the generic map win over a legacy optional-module flag", () => {
    const result = filterNavByFeatureFlags(nav, { projectsEnabled: true, modules: { projects: false } });
    expect(paths(result)).not.toContain("projects");
  });

  it("never drops dividers", () => {
    const result = filterNavByFeatureFlags(nav, { modules: { projects: false } });
    expect(result.some((item) => item.divider)).toBe(true);
  });

  it("retired Courses flags cannot hide mentors' Meetings", () => {
    const result = filterNavByFeatureFlags(mentorNav, { modules: { courses: false } });
    expect(paths(result)).toEqual(["projects", "calendar", "notifications"]);
  });

  it("Projects OFF hides mentors' Projects and Meetings", () => {
    const result = filterNavByFeatureFlags(mentorNav, { modules: { projects: false } });
    expect(paths(result)).toEqual(["notifications"]);
  });

  it("returns non-array input untouched", () => {
    expect(filterNavByFeatureFlags(null, { modules: { courses: false } })).toBeNull();
  });
});
