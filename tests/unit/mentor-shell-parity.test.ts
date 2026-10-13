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

  it("keeps all role workspaces for a multi-role member", () => {
    const nav = getShellNavigation({
      ...mentor,
      membership: { ...mentor.membership!, roles: ["MENTOR", "FACULTY"] },
    });
    expect(nav.some((item) => item.href === "/teacher/courses")).toBe(true);
    expect(nav.some((item) => item.href === "/mentor/calendar")).toBe(true);
  });
});
