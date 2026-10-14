import { describe, expect, it } from "vitest";
import { adminAuditTextFilterSchema, auditLiteralLikePattern } from "@/modules/activity/admin-audit-search-model";
import { superAdminAuditExportSchema } from "@/modules/activity/super-admin-audit-export-model";
describe("Super Admin audit literal search", () => {
  it("escapes wildcards while leaving quotes for parameter binding", () => {
    expect(auditLiteralLikePattern("  Review_100%  ")).toBe("%Review\\_100\\%%");
    expect(auditLiteralLikePattern("a\\b")).toBe("%a\\\\b%");
    expect(auditLiteralLikePattern("O'Reilly")).toBe("%O'Reilly%");
  });
  it("shares bounded validated filters between viewer and CSV", () => {
    const query = { actorName: " Faculty ", q: " assignment " };
    expect(adminAuditTextFilterSchema.parse(query)).toEqual({ actorName: "Faculty", q: "assignment" });
    expect(superAdminAuditExportSchema.parse(query)).toEqual(adminAuditTextFilterSchema.parse(query));
    for (const input of [{ q: "x".repeat(101) }, { actorName: " " }, { organizationId: "override" }])
      expect(superAdminAuditExportSchema.safeParse(input).success).toBe(false);
  });
});
