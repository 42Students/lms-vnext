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

describe("authenticated shell model", () => {
  it("gives SUPER_ADMIN the platform administration navigation", () => {
    const shellContext = context(null, ["SUPER_ADMIN"]);

    expect(
      getShellNavigation(shellContext).map((item) => item.label),
    ).toEqual([
      "Dashboard",
      "Organizations",
      "Colleges",
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

  it("keeps College Admin navigation tenant-focused", () => {
    const shellContext = context(["COLLEGE_ADMIN"]);

    expect(
      getShellNavigation(shellContext).map((item) => item.label),
    ).toEqual([
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

  it("gives faculty teaching navigation without admin navigation", () => {
    const shellContext = context(["FACULTY", "MENTOR"]);

    expect(getShellNavigation(shellContext)).toEqual([
      {
        label: "Dashboard",
        href: "/dashboard",
        shortLabel: "D",
      },
      {
        label: "Teaching Courses",
        href: "/teach/courses",
        shortLabel: "T",
      },
      {
        label: "Mentoring Projects",
        href: "/mentor/projects",
        shortLabel: "P",
      },
    ]);
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

    expect(
      getShellNavigation(shellContext).map(
        (item) => item.label,
      ),
    ).toEqual([
      "Dashboard",
      "Teaching Courses",
      "Mentoring Projects",
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
    expect(getShellRoleLabel(shellContext)).toBe(
      "College Admin · Faculty · Mentor",
    );
  });

  it("keeps both learner and faculty Course entry points for a dual-role membership", () => {
    const shellContext = context([
      "LEARNER",
      "FACULTY",
    ]);

    expect(
      getShellNavigation(shellContext).map(
        (item) => item.label,
      ),
    ).toEqual([
      "Dashboard",
      "Courses",
      "Quizzes",
      "Assignments",
      "Class Schedule",
      "Attendance",
      "My Placements",
      "Projects",
      "Notifications",
      "Profile",
      "Teaching Courses",
    ]);
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
        label: "Hiring Workspace",
        href: "/hr/placements",
        shortLabel: "H",
      },
      {
        label: "Messages",
        href: "/hr/messages",
        shortLabel: "M",
      },
    ]);
    expect(getShellRoleLabel(shellContext)).toBe(
      "Employer Recruiter",
    );
  });

  it("gives TPO memberships the placement command center", () => {
    const shellContext = context(["FACULTY", "TPO"]);

    expect(
      getShellNavigation(shellContext).map(
        (item) => item.label,
      ),
    ).toEqual([
      "Dashboard",
      "Teaching Courses",
      "Recruiter Leads",
      "Messages",
      "Placement Operations",
    ]);
    expect(getShellRoleLabel(shellContext)).toBe(
      "Faculty · TPO",
    );
  });

  it("keeps nested learner routes under the canonical sidebar entry", () => {
    const learnerNav = getShellNavigation(context(["LEARNER"]));
    const hrefs = learnerNav.map((item) => item.href);

    expect(hrefs).toContain("/learn/courses");
    expect(hrefs).toContain("/learn/my-placements");
    expect(hrefs).toContain("/learn/projects");
    expect(hrefs).not.toContain("/learn/courses/example/home");
    expect(hrefs).not.toContain("/learn/my-placements/jobs");
    expect(hrefs).not.toContain("/learn/projects/example");
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

    expect(
      navigation.map((item) => item.label),
    ).toContain("Projects");
    expect(
      navigation.map((item) => item.label),
    ).not.toContain("My Placements");
    expect(
      navigation.map((item) => item.label),
    ).toContain("Teaching Courses");
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
