import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("legacy workspace and scope switcher wording (Header.js, SuperAdminHeader.js)", () => {
  const workspace = read("src/components/shell/membership-switcher.tsx");
  const scope = read("src/components/shell/admin-scope-switcher.tsx");

  it("workspace switcher says Switch workspace", () => {
    expect(workspace).toContain('<option value="" disabled>Switch workspace</option>');
    expect(workspace).toContain('if (!membershipId || membershipId === activeMembershipId) return;');
    expect(workspace).toMatch(/htmlFor="membership-switcher">\s*Switch workspace\s*</);
    expect(workspace).not.toContain("Select college");
    expect(workspace).not.toContain("Active college membership");
  });

  it("Super Admin scope placeholder is All colleges", () => {
    expect(scope).toContain('<option value="">All colleges</option>');
    expect(scope).not.toContain("All platform");
  });
});
