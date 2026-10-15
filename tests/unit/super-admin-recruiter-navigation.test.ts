import { describe, expect, it } from "vitest";
import { SUPER_ADMIN_LEGACY_GROUPS } from "@/modules/people/super-admin-legacy-tabs-model";
import { getShellNavigation } from "@/components/shell/shell-model";
import type { RequestContext } from "@/modules/identity/context";

const context: RequestContext = {
  user: {
    id: "admin-user",
    identityUid: "admin-identity",
    platformStatus: "ACTIVE",
    systemRoles: ["SUPER_ADMIN"],
  },
  membership: null,
};

describe("Super Admin Recruiter Accounts navigation", () => {
  it("links the renamed recruiter directory once", () => {
    const accounts = SUPER_ADMIN_LEGACY_GROUPS.flatMap((group) => group.tabs)
      .filter((tab) => tab.label === "Recruiter accounts");
    expect(accounts).toHaveLength(1);
    expect(accounts[0]?.href).toBe("/admin/recruiters");
    expect(getShellNavigation(context).some((item) => item.href === "/admin/hr"))
      .toBe(false);
  });

  it("does not expose global admin links to ordinary users or disabled platform users", () => {
    const learner = {
      ...context,
      user: { ...context.user, systemRoles: [] },
    } satisfies RequestContext;
    const disabled = {
      ...context,
      user: { ...context.user, platformStatus: "DISABLED" as const },
    } satisfies RequestContext;
    expect(getShellNavigation(learner).some((item) => item.href === "/admin/recruiters")).toBe(false);
    expect(getShellNavigation(disabled).some((item) => item.href === "/admin/recruiters")).toBe(false);
  });
});
