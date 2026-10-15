import { describe, expect, it } from "vitest";
import {
  accountActionCopy,
  accountMenuVariant,
} from "@/components/shell/college-account-copy";

describe("legacy account menu wording (profiledropdown.js)", () => {
  it("College Admin keeps My Account -> /college/profile and Logout", () => {
    expect(accountActionCopy("collegeAdmin")).toEqual({
      accountLabel: "My Account",
      accountHref: "/college/profile",
      signOutLabel: "Logout",
    });
  });

  it.each(["tpo", "faculty", "learner", "recruiter", "other"] as const)(
    "%s uses My Account and Logout, never Security / Sign out",
    (variant) => {
      const copy = accountActionCopy(variant);
      expect(copy.accountLabel).toBe("My Account");
      expect(copy.signOutLabel).toBe("Logout");
      expect(copy.accountHref).toBeTruthy();
    },
  );

  it("routes each role to its working profile page", () => {
    expect(accountActionCopy("learner").accountHref).toBe("/learn/profile");
    expect(accountActionCopy("faculty").accountHref).toBe("/teacher/profile");
    expect(accountActionCopy("tpo").accountHref).toBe("/tpo/profile");
    expect(accountActionCopy("recruiter").accountHref).toBe("/hr/profile");
    expect(accountActionCopy("other").accountHref).toBe("/account/security");
  });

  it("Super Admin shows Logout only", () => {
    expect(accountActionCopy("superAdmin")).toEqual({
      accountLabel: null,
      accountHref: null,
      signOutLabel: "Logout",
    });
  });

  it("derives the variant from roles", () => {
    const base = { superAdmin: false, recruiterOnly: false };
    expect(accountMenuVariant({ ...base, superAdmin: true, roles: [] })).toBe("superAdmin");
    expect(accountMenuVariant({ ...base, roles: ["COLLEGE_ADMIN", "FACULTY"] })).toBe("collegeAdmin");
    expect(accountMenuVariant({ ...base, roles: ["FACULTY"] })).toBe("faculty");
    expect(accountMenuVariant({ ...base, roles: ["MENTOR"] })).toBe("other");
    expect(accountMenuVariant({ ...base, roles: [], recruiterOnly: true })).toBe("recruiter");
  });
});
