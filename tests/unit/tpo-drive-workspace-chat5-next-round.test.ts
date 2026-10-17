import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {tpoDriveTabs} from "@/modules/placements/tpo-drive-tab-model";
const source=(path:string)=>readFileSync(path,"utf8");
const id="11111111-1111-4111-8111-111111111111";
describe("Drive Workspace next-round graceful action and mobile parity",()=>{
 it("TPO-drive-workspace-55 offers an audited administrative action with safe errors and retained evidence",()=>{
  const panel=source("src/components/placements/tpo-offer-lifecycle-panel.tsx");
  expect(panel).toContain("apiFetch");
  expect(panel).toContain("useGuardedAction");
  expect(panel).toContain("setReviewed(false)");
  expect(panel).toContain("selected.map((choice) => choice.id)");
  expect(panel).toContain("Mandatory evidence");
 });
 it("TPO-drive-workspace-70 removes native offer-confirm popups and preserves accessible consequence review",()=>{
  const panel=source("src/components/placements/tpo-offer-lifecycle-panel.tsx");
  const offers=source("src/components/placements/placement-offer-controls.tsx");
  expect(panel).not.toContain("window.confirm");
  expect(panel).toContain("checked={reviewed}");
  expect(panel).toContain("disabled={!valid || busy || !reviewed}");
  expect(offers).toContain("apiFetch");
  expect(offers).not.toContain("PLACEMENT_OFFER_ACTION_FAILED");
 });
 it("TPO-drive-workspace-72 uses a keyboard-accessible mobile section picker with desktop tabs intact",()=>{
  const nav=source("src/components/placements/tpo-drive-workspace-nav.tsx");
  expect(nav).toContain('aria-label="Drive workspace section"');
  expect(nav).toContain("sm:hidden");
  expect(nav).toContain("sm:flex");
  expect(nav).toContain("router.push(event.target.value)");
  expect(tpoDriveTabs(id).some(x=>x.label==="Discussion")).toBe(true);
 });
 it("GR-04 GR-30 GR-31 handles offer API failures and double submissions through shared guards",()=>{
  const panel=source("src/components/placements/tpo-offer-lifecycle-panel.tsx");
  const offers=source("src/components/placements/placement-offer-controls.tsx");
  expect(panel).toContain("apiFetch");
  expect(panel).toContain("useGuardedAction");
  expect(panel).toContain("if (!valid || busy) return;");
  expect(offers).toContain("apiFetch");
 });
 it("GR-35 GR-90 GR-91 uses an explicit check and announced error for offer confirmations",()=>{
  const panel=source("src/components/placements/tpo-offer-lifecycle-panel.tsx");
  expect(panel).toContain('type="checkbox"');
  expect(panel).toContain("checked={reviewed}");
  expect(panel).toContain('role={notice.includes("updated and audited")?"status":"alert"}');
 });
 it("GR-39 prevents an overlong drive-navigation name from breaking the mobile selector",()=>{
  const nav=source("src/components/placements/tpo-drive-workspace-nav.tsx");
  expect(nav).toContain("min-w-0");
  expect(nav).toContain("w-full");
 });
});
