import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  templateVersionHistoryQuerySchema, templateVersionHistoryPage,
} from "@/modules/projects/template-version-history-model";

describe("Super Admin Projects: safe template subview failures", () => {
  it("PROJ-BREAK-ux-15 handles missing templates as 404, but outage/revocation as explicit retry", () => {
    const code = readFileSync(join(process.cwd(),
      "src/components/projects/super-admin-template-subview-page.tsx"),"utf8");
    expect(code).toContain('error.code === "PROJECT_TEMPLATE_NOT_FOUND"');
    // The legacy template subview now returns a safe missing-state panel
    // instead of throwing a route-wide 404, while outages offer a retry.
    expect(code).toContain("Template not found");
    expect(code).toContain("← Back to templates");
    expect(code).toContain('<ErrorState title="Failed to load template"');
    expect(code).toContain("Template could not be loaded. Review your access and try again.");
    expect(code).toContain("encodeURIComponent(templateId)");
    expect(code).not.toContain("throw error;");
    expect(code).toContain("templateVersionHistoryQuerySchema.safeParse(historyQuery)");
    expect(code).toContain('title="Invalid version page"');
  });
  it("PROJ-BREAK-scale-28 rejects corrupt, fractional or oversized history page selectors", () => {
    for(const page of [0, -1, "Infinity", "NaN", 1.5, "0", "99999999999999", "0x10", "1e2", ["1"], ["1","2"], " 1 "]) {
      expect(templateVersionHistoryQuerySchema.safeParse({page}).success, String(page)).toBe(false);
    }
    expect(templateVersionHistoryQuerySchema.safeParse({page:"1"}).success).toBe(true);
    expect(templateVersionHistoryQuerySchema.safeParse({page:2}).success).toBe(true);
    expect(templateVersionHistoryPage(200,1).offset).toBe(0);
  });
});
