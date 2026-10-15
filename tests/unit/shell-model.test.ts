import { describe, expect, it } from "vitest";
import type { MembershipRole } from "@/modules/identity/constants";
import type { RequestContext } from "@/modules/identity/context";
import {
  getShellNavigation,
  getShellRoleLabel,
} from "@/components/shell/shell-model";

function context(
  roles: readonly MembershipRole[] | null,
  systemRoles: RequestContext["user"]["systemRoles"] = [],
): RequestContext {
  return {
    user: {
      id: "user-1",
      identityUid: "identity-1",
      platformStatus: "ACTIVE",
      systemRoles,
    },
    membership: roles
      ? {
          id: "membership-1",
          collegeId: "college-1",
          organizationId: "organization-1",
          status: "ACTIVE",
          roles,
        }
      : null,
  };
}

const labels = (shellContext: RequestContext) =>
  getShellNavigation(shellContext).map((item) => item.label);

const hrefs = (shellContext: RequestContext) =>
  getShellNavigation(shellContext).map((item) => item.href);

/**
 * `expected` must appear in `actual` in that relative order. Extra entries
 * between them are fine, so the sidebar can grow without churning these
 * tests, but removing or reordering a key entry still fails.
 */
function expectInOrder(
  actual: readonly string[],
  expected: readonly string[],
) {
  let from = 0;
  for (const item of expected) {
    const found = actual.indexOf(item, from);
    expect(
      found,
      `"${item}" should appear after position ${from} in [${actual.join(" | ")}]`,
    ).toBeGreaterThanOrEqual(from);
    from = found + 1;
  }
}

const ADMIN_PREFIXES = ["/admin", "/college", "/superadmin"];

function hasAdminLinks(shellContext: RequestContext) {
  return hrefs(shellContext).some((href) =>
    ADMIN_PREFIXES.some(
      (prefix) => href === prefix || href.startsWith(`${prefix}/`),
    ),
  );
}

describe("authenticated shell model", () => {
  it("gives SUPER_ADMIN the platform administration navigation", () => {
    const shellContext = context(null, ["SUPER_ADMIN"]);

    expectInOrder(labels(shellContext), [
      "Dashboard",
      "Organizations",
      "Colleges",
      "Feature Controls",
      "Departments",
      "Academics",
      "Courses",
      "Projects",
      "Placements",
      "People",
      "Domains",
      "Activity",
    ]);
    expect(getShellRoleLabel(shellContext)).toBe("Super Admin");
  });

  it("exposes a distinct Super Admin placement interview calendar without changing other roles", () => {
    const superAdminContext = context(null, ["SUPER_ADMIN"]);
    const superAdminNavigation = getShellNavigation(superAdminContext);
    const superAdminHrefs = superAdminNavigation.map((item) => item.href);

    expectInOrder(superAdminHrefs, [
      "/admin/placements",
      "/admin/placements/calendar",
      "/admin/recruiters",
    ]);

    expect(
      superAdminNavigation.find(
        (item) => item.href === "/admin/placements/calendar",
      ),
    ).toMatchObject({
      label: "Placement Interview Calendar",
      href: "/admin/placements/calendar",
      icon: "/assets/images/common/calender.svg",
    });

    expect(superAdminHrefs).not.toContain("/tpo/calendar");
    expect(superAdminHrefs).not.toContain("/college/placements/calendar");

    const scopedSuperAdmin: RequestContext = {
      ...superAdminContext,
      adminScope: {
        organizationId: "organization-1",
        collegeId: "college-1",
      },
    };

    expect(hrefs(scopedSuperAdmin)).toContain(
      "/admin/placements/calendar",
    );

    const tpoHrefs = hrefs(context(["TPO"]));
    expect(tpoHrefs).toContain("/tpo/calendar");
    expect(tpoHrefs).not.toContain("/admin/placements/calendar");

    const collegeHrefs = hrefs(context(["COLLEGE_ADMIN"]));
    expect(collegeHrefs).toContain("/college/placements/calendar");
    expect(collegeHrefs).not.toContain("/admin/placements/calendar");

    const learnerHrefs = hrefs(context(["LEARNER"]));
    expect(learnerHrefs).not.toContain("/admin/placements/calendar");
    expect(learnerHrefs).not.toContain("/tpo/calendar");
    expect(learnerHrefs).not.toContain("/college/placements/calendar");
  });

  it("hides legacy Student Groups from College Admin navigation for all role mixes", () => {
    for (const roles of [
      ["COLLEGE_ADMIN"],
      ["COLLEGE_ADMIN", "FACULTY"],
      ["COLLEGE_ADMIN", "MENTOR", "LEARNER"],
    ] as const) {
      const links = getShellNavigation(context(roles)).map((item) => item.href);
      expect(links).not.toContain("/college/groups");
      expect(links).toContain("/college/students");
    }
  });

  it("keeps College Admin navigation tenant-focused", () => {
    const shellContext = context(["COLLEGE_ADMIN"]);

    expectInOrder(labels(shellContext), [
      "Dashboard",
      "My College",
      "Departments",
      "Academics",
      "Courses",
      "Projects",
      "Placements",
      "People",
      "Domains",
      "Activity",
    ]);
    expect(labels(shellContext)).not.toContain("Organizations");
    expect(labels(shellContext)).not.toContain("Colleges");
    expect(getShellRoleLabel(shellContext)).toBe("College Admin");
  });

  it("gives learners their Course workspace without admin navigation", () => {
    const shellContext = context(["LEARNER"]);

    expect(getShellNavigation(shellContext)).toEqual([
      { label: "Courses", href: "/learn/courses", shortLabel: "C", icon: "/assets/images/common/courses.svg", activeIcon: "/assets/images/common/course.svg", group: "learning" },
      { label: "Quizzes", href: "/learn/allQuizzes", shortLabel: "Q", icon: "/assets/images/common/quiz.svg", activeIcon: "/assets/images/common/quiz-active.svg", group: "learning" },
      { label: "Assignments", href: "/learn/allAssignments", shortLabel: "A", icon: "/assets/images/common/assignment.svg", activeIcon: "/assets/images/common/assignment-active.svg", group: "learning" },
      { label: "Class Schedule", href: "/learn/calendar", shortLabel: "S", icon: "/assets/images/common/calender.svg", group: "tracking" },
      { label: "Attendance", href: "/learn/attendance", shortLabel: "T", icon: "/assets/images/common/attendance.svg", group: "tracking" },
      { label: "My Placements", href: "/learn/my-placements", shortLabel: "P", icon: "/assets/images/common/book-open.svg", group: "career" },
      { label: "Projects", href: "/learn/projects", shortLabel: "P", icon: "/assets/images/common/folder.svg", group: "learning" },
      { label: "Notifications", href: "/learn/notifications", shortLabel: "N", icon: "/assets/images/common/notification.svg", group: "account" },
      { label: "Profile", href: "/learn/profile", shortLabel: "R", icon: "/assets/images/common/myAccount.svg", group: "account" },
    ]);
    expect(getShellRoleLabel(shellContext)).toBe(
      "Learner",
    );
    expect(
      getShellNavigation(shellContext).some(
        (item) =>
          item.href === "/activity",
      ),
    ).toBe(false);
  });

  it("gives a Faculty-only membership the exact legacy Courses entry point and icon", () => {
    const navigation = getShellNavigation(context(["FACULTY"]));
    expect(navigation[0]).toMatchObject({
      label: "Courses",
      href: "/teacher/courses",
      icon: "/assets/images/common/courses.svg",
      activeIcon: "/assets/images/common/course.svg",
    });
  });

  it("never leaks generic Dashboard or other roles into a Faculty-only sidebar", () => {
    const navigation = getShellNavigation(context(["FACULTY"]));
    expect(navigation.map((item) => item.href)).toEqual([
      "/teacher/courses",
      "/teacher/contacts/allContacts",
      "/teacher/notifications",
      "/teacher/calendar",
      "/teacher/allQuizzes",
      "/teacher/allAssignments",
      "/teacher/profile",
    ]);
  });

  it("gives faculty teaching navigation without admin navigation", () => {
    const shellContext = context(["FACULTY", "MENTOR"]);

    expectInOrder(labels(shellContext), [
      "Dashboard",
      "Courses",
      "Class Schedule",
      "All Quizzes",
      "All Assignments",
      "Projects",
      "Meetings",
    ]);
    expect(hrefs(shellContext)).toContain("/teacher/courses");
    expect(hrefs(shellContext)).toContain("/mentor/projects");
    expect(hasAdminLinks(shellContext)).toBe(false);
    expect(getShellRoleLabel(shellContext)).toBe(
      "Faculty · Mentor",
    );
  });

  it("keeps College Admin workspaces additive for faculty and mentor roles", () => {
    const shellContext = context([
      "COLLEGE_ADMIN",
      "FACULTY",
      "MENTOR",
    ]);

    // Teaching and mentoring come first, the admin workspace is added after.
    expectInOrder(hrefs(shellContext), [
      "/dashboard",
      "/teacher/courses",
      "/mentor/projects",
      "/college",
      "/college/departments",
    ]);
    expectInOrder(labels(shellContext), [
      "My College",
      "Departments",
      "Academics",
      "Placements",
      "People",
      "Domains",
      "Activity",
    ]);
    expect(getShellRoleLabel(shellContext)).toBe(
      "College Admin · Faculty · Mentor",
    );
  });

  it("keeps both learner and faculty Course entry points for a dual-role membership", () => {
    const shellContext = context([
      "LEARNER",
      "FACULTY",
    ]);

    expect(hrefs(shellContext)).toContain("/learn/courses");
    expect(hrefs(shellContext)).toContain("/teacher/courses");
    expectInOrder(labels(shellContext), [
      "Dashboard",
      "Quizzes",
      "Assignments",
      "My Placements",
      "All Quizzes",
      "All Assignments",
    ]);
    expect(hasAdminLinks(shellContext)).toBe(false);
  });

  it("gives recruiter-only identities the shared hiring workspace without a fake membership", () => {
    const shellContext: RequestContext = {
      ...context(null),
      recruiter: {
        userId: "recruiter-1",
        companyId: "company-1",
        companyName: "Example Employer",
        title: "Talent Partner",
        status: "ACTIVE",
        grants: [
          {
            id: "grant-1",
            organizationId: "organization-1",
            collegeId: "college-1",
            collegeName: "College One",
            companyRelationshipId:
              "relationship-1",
          },
        ],
      },
    };

    expect(getShellNavigation(shellContext)).toEqual([
      {
        label: "Dashboard",
        href: "/dashboard",
        shortLabel: "D",
      },
      {
        label: "Today",
        href: "/hr/home",
        shortLabel: "T",
      },
      {
        label: "Hiring Workspace",
        href: "/hr/placements",
        shortLabel: "H",
      },
      {
        label: "Calendar",
        href: "/hr/calendar",
        shortLabel: "C",
        icon: "/assets/images/common/calender.svg",
        group: "tracking",
      },
      {
        label: "Company & Team",
        href: "/hr/company",
        shortLabel: "C",
        group: "account",
      },
      {
        label: "Profile",
        href: "/hr/profile",
        shortLabel: "P",
        group: "account",
      },
    ]);
    expect(getShellRoleLabel(shellContext)).toBe(
      "Employer Recruiter",
    );
  });

  it("gives TPO memberships the placement command center", () => {
    const shellContext = context(["FACULTY", "TPO"]);

    expectInOrder(labels(shellContext), [
      "Dashboard",
      "Courses",
      "Recruiter Leads",
      "Companies",
      "Placement Operations",
      "Students",
      "Calendar",
    ]);
    expect(hrefs(shellContext)).toContain("/teacher/courses");
    expect(hrefs(shellContext)).toContain("/tpo/calendar");
    expect(hrefs(shellContext)).toContain("/tpo/students");
    expect(hrefs(shellContext)).toContain("/tpo/companies");
    expect(hrefs(shellContext)).toContain("/tpo/audit");
    expect(hrefs(shellContext)).toContain("/tpo/messages");
    expect(hrefs(shellContext)).toContain("/tpo/settings");
    expect(hrefs(shellContext)).toContain("/tpo/more");
    expect(hasAdminLinks(shellContext)).toBe(false);
    expect(getShellRoleLabel(shellContext)).toBe(
      "Faculty · TPO",
    );
  });

  it("exposes the placement calendar only to the matching college roles", () => {
    const tpoNavigation = hrefs(context(["TPO"]));
    const collegeNavigation = hrefs(context(["COLLEGE_ADMIN"]));
    const learnerNavigation = hrefs(context(["LEARNER"]));

    expect(tpoNavigation).toContain("/tpo/calendar");
    expect(tpoNavigation).not.toContain("/college/placements/calendar");

    expect(collegeNavigation).toContain("/college/placements/calendar");
    expect(collegeNavigation).not.toContain("/tpo/calendar");

    expect(learnerNavigation).not.toContain("/tpo/calendar");
    expect(learnerNavigation).not.toContain("/college/placements/calendar");
  });

  it("exposes TPO reports only in TPO navigation and preserves report destinations", () => {
    const tpoNavigation = getShellNavigation(context(["TPO"]));
    const reports = tpoNavigation.filter((item) => item.href === "/tpo/reports");

    expect(reports).toEqual([
      {
        label: "Reports",
        href: "/tpo/reports",
        shortLabel: "R",
        group: "tracking",
      },
    ]);

    const mixed = getShellNavigation(context(["FACULTY", "TPO"]));
    expectInOrder(
      mixed.map((item) => item.href),
      [
        "/tpo/recruiters",
        "/tpo/placements",
        "/tpo/calendar",
        "/tpo/reports",
      ],
    );

    expect(hrefs(context(["COLLEGE_ADMIN"]))).not.toContain("/tpo/reports");
    expect(hrefs(context(["LEARNER"]))).not.toContain("/tpo/reports");
    expect(hrefs(context(["FACULTY"]))).not.toContain("/tpo/reports");
    expect(hrefs(context(null, ["SUPER_ADMIN"]))).not.toContain("/tpo/reports");
  });

  it("never shows two sidebar entries with the same label, for any role mix", () => {
    const roles: MembershipRole[] = [
      "LEARNER",
      "FACULTY",
      "MENTOR",
      "TPO",
      "COLLEGE_ADMIN",
    ];
    // every non-empty combination of roles (31 of them)
    for (let mask = 1; mask < 1 << roles.length; mask += 1) {
      const combo = roles.filter((_, bit) => mask & (1 << bit));
      const names = labels(context(combo));
      expect(
        new Set(names).size,
        `duplicate labels for [${combo.join(", ")}]: ${names.join(" | ")}`,
      ).toBe(names.length);
    }
  });

  it("qualifies a repeated label by the area it opens and keeps both destinations", () => {
    const dual = getShellNavigation(context(["LEARNER", "FACULTY"]));

    const courses = dual.filter((item) =>
      item.label.startsWith("Courses"),
    );
    expect(courses.map((item) => [item.label, item.href])).toEqual([
      ["Courses · Learning", "/learn/courses"],
      ["Courses · Teaching", "/teacher/courses"],
    ]);

    const admin = getShellNavigation(
      context(["COLLEGE_ADMIN", "FACULTY", "MENTOR"]),
    );
    expect(
      admin.find((item) => item.href === "/college/courses")?.label,
    ).toBe("Courses · College");
    expect(
      admin.find((item) => item.href === "/mentor/projects")?.label,
    ).toBe("Projects · Mentoring");
    expect(
      admin.find((item) => item.href === "/college/projects")?.label,
    ).toBe("Projects · College");
  });

  it("leaves labels alone when they are not repeated", () => {
    expect(labels(context(["COLLEGE_ADMIN"]))).not.toContainEqual(
      expect.stringContaining("·"),
    );
    expect(labels(context(["LEARNER"]))).not.toContainEqual(
      expect.stringContaining("·"),
    );
    expect(labels(context(["FACULTY", "TPO"]))).toContain("Courses");
  });

  it("does not drop any destination when it qualifies labels", () => {
    const all = context([
      "LEARNER",
      "FACULTY",
      "MENTOR",
      "TPO",
      "COLLEGE_ADMIN",
    ]);
    const destinations = hrefs(all);
    expect(new Set(destinations).size).toBe(destinations.length);
    for (const href of [
      "/learn/courses",
      "/teacher/courses",
      "/college/courses",
      "/learn/notifications",
      "/teacher/notifications",
      "/mentor/notifications",
    ]) {
      expect(destinations).toContain(href);
    }
  });

  it("keeps nested learner routes under the canonical sidebar entry", () => {
    const learnerNav = getShellNavigation(context(["LEARNER"]));
    const learnerHrefs = learnerNav.map((item) => item.href);

    expect(learnerHrefs).toContain("/learn/courses");
    expect(learnerHrefs).toContain("/learn/my-placements");
    expect(learnerHrefs).toContain("/learn/projects");
    expect(learnerHrefs).not.toContain("/learn/courses/example/home");
    expect(learnerHrefs).not.toContain("/learn/my-placements/jobs");
    expect(learnerHrefs).not.toContain("/learn/projects/example");
  });

  it("hides learner Projects and Placements when current access says they are unavailable", () => {
    const navigation = getShellNavigation(
      context(["LEARNER"]),
      {
        projectsEnabled: false,
        placementsEnabled: false,
      },
    );

    expect(
      navigation.map((item) => item.label),
    ).toEqual([
      "Courses",
      "Quizzes",
      "Assignments",
      "Class Schedule",
      "Attendance",
      "Notifications",
      "Profile",
    ]);
  });

  it("filters only learner-owned optional links on mixed-role memberships", () => {
    const navigation = getShellNavigation(
      context(["LEARNER", "FACULTY"]),
      {
        projectsEnabled: true,
        placementsEnabled: false,
      },
    );
    const navHrefs = navigation.map((item) => item.href);

    expect(navHrefs).toContain("/learn/projects");
    expect(
      navigation.map((item) => item.label),
    ).not.toContain("My Placements");
    expect(navHrefs).toContain("/teacher/courses");
  });

  it("adds Drive Day only for a learner with a current coordinator assignment", () => {
    const navigation = getShellNavigation(
      context(["LEARNER"]),
      {
        projectsEnabled: true,
        placementsEnabled: false,
        driveDayEnabled: true,
      },
    );

    expect(
      navigation.map((item) => item.label),
    ).toEqual([
      "Courses",
      "Quizzes",
      "Assignments",
      "Class Schedule",
      "Attendance",
      "Projects",
      "Notifications",
      "Profile",
      "Drive Day",
    ]);
    expect(
      navigation.at(-1)?.href,
    ).toBe("/tpo/drive-day");
  });

});
