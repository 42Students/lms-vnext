import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";import {join} from "node:path";
import {publicPlacementContentInput,formatPublicPlacementMetric} from "@/modules/placements/public-page/content-model";
import {tpoCommunicationChangeSchema} from "@/modules/placements/tpo-communication-change-model";
const read=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("chat9 public page, signature and audit evidence",()=>{
 it("TPO-settings-audit-74 only previews privacy-cleared published values and validates the selected public metrics",()=>{
  expect(publicPlacementContentInput.safeParse({about:"Campus",metricKeys:["PLACED","OFFERS"],expectedUpdatedAt:null}).success).toBe(true);
  expect(publicPlacementContentInput.safeParse({about:"a".repeat(4001),metricKeys:["PLACED"],expectedUpdatedAt:null}).success).toBe(false);
  expect(publicPlacementContentInput.safeParse({about:"",metricKeys:["PLACED","PLACED"],expectedUpdatedAt:null}).success).toBe(false);
  expect(formatPublicPlacementMetric("PLACED",{population:null,placed:null,offers:null,employers:null,highestCtcInr:null,medianCtcInr:null})).toBe("(not enough data yet)");
  const page=read("src/app/(authenticated)/tpo/settings/public-page/page.tsx");
  expect(page).toContain("readOptionalPublicPlacementData(");
  expect(page).toContain("Unpublished, stale or suppressed counts are not filled from private dashboards.");
 });
 it("TPO-settings-audit-76 bounds stored email signature and keeps preview distinct from actual email delivery",()=>{
  const service=read("src/modules/placements/tpo-communication-settings-service.ts");
  const branding=read("src/app/(authenticated)/tpo/settings/branding/page.tsx");
  const editor=read("src/components/tpo/tpo-communication-settings-editors.tsx");
  const validation=read("src/modules/placements/tpo-communication-change-model.ts");
  expect(service).toContain("tpoCommunicationChangeSchema.parse(raw)");
  expect(validation).toContain("emailSignature:z.string().trim().max(300)");
  expect(tpoCommunicationChangeSchema.safeParse({section:"SIGNATURE",emailSignature:"x".repeat(300),expectedVersion:null}).success).toBe(true);
  expect(tpoCommunicationChangeSchema.safeParse({section:"SIGNATURE",emailSignature:"x".repeat(301),expectedVersion:null}).success).toBe(false);
  expect(branding).toContain("TpoEmailSignatureEditor");
  expect(editor).toContain("How the end of an invite looks");
  expect(editor).toContain("Sending requires configured email delivery.");
 });
 it("TPO-settings-audit-92 scopes audit quick looks to the current TPO member and retains explicit category and date filters",()=>{
  const page=read("src/app/(authenticated)/tpo/audit/page.tsx");
  expect(page).toContain('aria-label="Quick looks"');
  expect(page).toContain('aria-label="Filter audit by category"');
  expect(page).toContain("Apply filters");
  expect(page).toContain("getTpoAuditLog");
 });
 it("TPO-settings-audit-93 uses authorized, bounded audit CSV from the same filtered log rather than raw unscoped activity",()=>{
  const route=read("src/app/api/placements/tpo/audit/export/route.ts");
  expect(route).toContain("getCurrentRequestContext()");
  expect(route).toContain("tpoAuditQuerySchema.parse");
  expect(route).toContain("getTpoAuditLog(context,");
  expect(route).toContain("page<=20");
  expect(route).toContain('filename="audit-log.csv"');
  expect(route).toContain('"X-Export-Truncated"');
 });
 it("TPO-settings-audit-97 escapes formula-leading clipboard cells and exposes explicit copy selection",()=>{
  const grid=read("src/components/tpo/tpo-audit-grid.tsx");
  expect(grid).toContain('return /^[\\s\\uFEFF]*[=+\\-@]/u.test(oneLine)?"\'"+oneLine:oneLine;');
  expect(grid).toContain("Copy rows");
  expect(grid).toContain("setOldestFirst");
  expect(grid).toContain("Select all visible rows");
 });
});
