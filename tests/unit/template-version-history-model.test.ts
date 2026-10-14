import { describe, expect, it } from "vitest";
import { templateVersionHistoryPage, templateVersionHistoryHref, templateVersionHistoryQuerySchema } from "@/modules/projects/template-version-history-model";
describe("Template version history paging", () => {
  it("caps at 25 and clamps old bookmarks after filtering", () => {
    expect(templateVersionHistoryPage(26, 999)).toEqual({ total: 26, totalPages: 2, page: 2, offset: 25 });
    expect(templateVersionHistoryPage(0, 999)).toEqual({ total: 0, totalPages: 1, page: 1, offset: 0 });
    expect(templateVersionHistoryPage(25, 1).totalPages).toBe(1);
  });
  it("keeps links in the exact template and rejects invalid scope overrides", () => {
    expect(templateVersionHistoryHref("00000000-0000-4000-8000-000000000001", 2)).toBe("/admin/projects/templates/00000000-0000-4000-8000-000000000001/versions?page=2");
    expect(templateVersionHistoryQuerySchema.safeParse({ page: "-1" }).success).toBe(false);
    expect(templateVersionHistoryQuerySchema.safeParse({ collegeId: "override" }).success).toBe(false);
  });
});
