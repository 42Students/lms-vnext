import { describe, expect, it } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import { getShellNavigation } from "@/components/shell/shell-model";

const mentor: RequestContext = {
  user: {
    id: "mentor-1",
    identityUid: "mentor-identity",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: "mentor-membership",
    organizationId: "college-org",
    collegeId: "college-1",
    status: "ACTIVE",
    roles: ["MENTOR"],
  },
};

describe("mentor legacy sidebar", () => {
  it("shows Projects, Meetings, Notifications in legacy order", () => {
    expect(getShellNavigation(mentor).map(({ label, href }) => [label, href]))
      .toEqual([
        ["Projects", "/mentor/projects"],
        ["Meetings", "/mentor/calendar"],
        ["Notifications", "/mentor/notifications"],
      ]);
  });

  it("keeps each role in its own workspace for a multi-role member", () => {
    const mentorNav = getShellNavigation(mentor);
    expect(mentorNav.some((item) => item.href === "/mentor/calendar")).toBe(true);
    expect(mentorNav.some((item) => item.href === "/teacher/courses")).toBe(false);
    const facultyNav = getShellNavigation({
      ...mentor,
      membership: { ...mentor.membership!, roles: ["FACULTY"] },
    });
    expect(facultyNav.some((item) => item.href === "/teacher/courses")).toBe(true);
    // Holding both roles with none selected shows only the dashboard.
    const both = getShellNavigation({
      ...mentor,
      membership: { ...mentor.membership!, roles: ["MENTOR", "FACULTY"] },
    });
    expect(both.map((item) => item.href)).toEqual(["/dashboard"]);
  });
});
