import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const routes = [
  "calendar/follow-ups/route.ts",
  "calendar/follow-ups/[followupId]/route.ts",
  "follow-ups/[followupId]/done/route.ts",
  "follow-ups/[followupId]/route.ts",
  "follow-ups/due/route.ts",
  "leads/[leadId]/activity/route.ts",
  "leads/[leadId]/contacted/route.ts",
  "leads/[leadId]/follow-ups/route.ts",
  "leads/[leadId]/invite/route.ts",
  "leads/[leadId]/not-now/route.ts",
  "leads/[leadId]/route.ts",
  "leads/bulk-owner/route.ts",
  "leads/bulk-stage/route.ts",
  "leads/check/route.ts",
  "leads/import/route.ts",
  "leads/route.ts",
];
describe("TPO-calendar-reports-20 TPO-recruiters-35 real CRM readiness", () => {
  it("verifies three registered physical tables, including dependent followups", () => {
    const source=readFileSync("src/modules/placements/tpo-crm-storage-readiness.ts","utf8");
    for(const table of ["placement_tpo_leads","placement_tpo_lead_activities","placement_tpo_followups"])
      expect(source).toContain('placementTableExists("'+table+'")');
    expect(source).toContain("return leads && activities && followups;");
  });
  it("checks registered storage instead of a volatile environment flag on all routes", () => {
    for(const route of routes) {
      const source=readFileSync("src/app/api/placements/tpo/"+route,"utf8");
      expect(source).toContain("await tpoCrmTablesReady()");
      expect(source).not.toContain("process.env.DB09_TPO_API_READY");
      expect(source).toContain("getCurrentRequestContext");
    }
  });
  it("unblocks recruiter detail and due followups when storage is registered", () => {
    for(const page of [
      "src/app/(authenticated)/tpo/recruiters/[leadId]/page.tsx",
      "src/app/(authenticated)/tpo/follow-ups/page.tsx",
    ]) {
      const source=readFileSync(page,"utf8");
      expect(source).toContain("await tpoCrmTablesReady()");
      expect(source).not.toContain("process.env.DB09_TPO_API_READY");
    }
  });
});
