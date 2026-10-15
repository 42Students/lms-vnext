import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  "src/app/(authenticated)/tracker/audit-findings/page.tsx",
  "utf8",
);

describe("tracker audit findings route guard", () => {
  it("redirects non-super-admins like the other tracker pages", () => {
    const redirectAt = source.indexOf('redirect("/dashboard")');
    const permissionAt = source.indexOf("requirePermission(");
    expect(source).toContain("isSuperAdmin(ctx)");
    expect(redirectAt).toBeGreaterThan(-1);
    expect(redirectAt).toBeLessThan(permissionAt);
  });
});
