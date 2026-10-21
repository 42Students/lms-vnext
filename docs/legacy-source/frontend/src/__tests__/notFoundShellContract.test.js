import fs from "fs";
import path from "path";

const read = (relative) => fs.readFileSync(path.join(process.cwd(), relative), "utf8");

describe("authenticated 404 shell contract", () => {
  test("404 keeps the role shell for authenticated users but remains public when logged out", () => {
    const source = read("src/pages/404.js");

    expect(source).toContain("const effectiveUser = loginUser?.isUserLoggedIn ? loginUser : persistedUser");
    expect(source).toContain("getStoredUserData()");
    expect(source).toContain('localStorage.getItem("isUserLoggedIn")');
    expect(source).toContain("const authenticated = Boolean(effectiveUser?.isUserLoggedIn && role)");
    expect(source).toContain("if (!authenticated) return content");
    expect(source).toContain("role === ROLE.SUPER_ADMIN");
    expect(source).toContain("role === ROLE.ADMIN");
    expect(source).toContain("<Layout preserveRoleShell>{content}</Layout>");
    expect(source).toContain("homePathForRole(role)");
    expect(source).toContain("Custom404.nolayout = true");
  });

  test("strict TPO/recruiter guards do not redirect a preserved not-found shell", () => {
    const source = read("src/layouts/layout.js");

    expect(source).toContain("const preserveStrictPortalShell = preserveRoleShell && isStrictPortalRole(layoutRole)");
    expect(source).toContain("const restoreRedirect = preserveRoleShell");
    expect(source).toContain("legacyRole && !preserveRoleShell");
    expect(source).toContain("const strictRedirect = preserveRoleShell");
  });
});
