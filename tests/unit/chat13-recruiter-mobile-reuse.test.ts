import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const svc = readFileSync("src/modules/placements/super-admin-hr-service.ts", "utf8");
const ui = readFileSync("src/components/admin/super-admin-hr-accounts.tsx", "utf8");
const create = svc.split("export async function createSuperAdminHrAccount")[1]?.split("export async function updateSuperAdminHrAccount")[0] ?? "";

describe("Super Admin recruiter mobile identity reuse", () => {
  it("SA-placements-projects-37 reuses only an active recruiter from the same canonical company", () => {
    expect(create).toContain("existing.companyId !== relationship.companyId");
    expect(create).toContain('existing.status !== "ACTIVE"');
    expect(create).toContain("reusedExisting = true");
  });
  it("SA-placements-projects-37 prevents duplicate active grants and unlimited new access", () => {
    expect(create).toContain(".onConflictDoNothing().returning(");
    expect(create).toContain("validUntil: grantExpiry");
    expect(create).toContain("existingGrant.validUntil <= grantTime");
  });
  it("SA-placements-projects-37 reopens the existing recruiter with the legacy explanation", () => {
    expect(create).toContain("return {...account, reusedExisting}");
    expect(ui).toContain("if (created.account.reusedExisting)");
    expect(ui).toContain("openDetail(created.account)");
    expect(ui).toContain("A recruiter with this mobile already exists. Opening it so you can add colleges.");
  });
});
