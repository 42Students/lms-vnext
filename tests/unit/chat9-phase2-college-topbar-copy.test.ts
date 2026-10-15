import { describe, expect, it } from "vitest";
import { accountActionCopy } from "@/components/shell/college-account-copy";
describe("college top navbar legacy account actions", () => {
  it("reuses the legacy My Account and Logout wording and college profile target", () => {
    expect(accountActionCopy(true)).toEqual({
      accountLabel:"My Account",accountHref:"/college/profile",signOutLabel:"Logout",
    });
  });
  it("does not rename security controls in other account lanes", () => {
    expect(accountActionCopy(false).accountLabel).toBe("Security");
    expect(accountActionCopy(false).signOutLabel).toBe("Sign out");
  });
});
