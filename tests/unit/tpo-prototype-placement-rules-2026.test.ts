import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
import {tpoRuleBoundsValid,TPO_RULE_LIMITS} from "@/modules/placements/tpo-rule-limits";
const source=(path:string)=>readFileSync(path,"utf8");

describe("TPO prototype Settings / placement rules",()=>{
 it("renders the saved college policy as editable sentences instead of an unrelated summary-only screen",()=>{
  const index=source("src/app/(authenticated)/tpo/settings/page.tsx");
  const rules=source("src/app/(authenticated)/tpo/settings/rules/page.tsx");
  const editor=source("src/components/placements/tpo-college-rules-control.tsx");
  expect(index).toContain('TpoPlacementRulesSettingsPage searchParams={Promise.resolve({})}');
  expect(rules).toContain("<TpoCollegeRulesControl rules={{");
  expect(editor).toContain("Read them as sentences. Click a highlighted value to change it.");
  for(const label of ["Counts as placed when","Maximum held offers","Offer uplift threshold",
   "Minimum response period"]){
   expect(editor).toContain('aria-label="'+label+'"');
  }
  expect(editor).toContain("Save the rules");
  expect(editor).toContain(">Discard</Button>");
 });
 it("retains arbitrary persisted integer thresholds while showing compact prototype preset selectors",()=>{
  const editor=source("src/components/placements/tpo-college-rules-control.tsx");
  expect(editor).toContain("Number(form.upliftPct)");
  expect(editor).toContain("Number(form.minResponseHours)");
  expect(editor).toContain("Custom thresholds and response times");
  expect(editor).toContain("TPO_RULE_LIMITS.upliftPct.min");
  expect(editor).toContain("TPO_RULE_LIMITS.minResponseHours.max");
  expect(TPO_RULE_LIMITS.upliftPct.min).toBe(0);
  expect(tpoRuleBoundsValid({
   maxHeldOffers:2,upliftPct:37,minResponseHours:51,
  })).toBe(true);
 });
 it("keeps the real mutation and concurrency controls; never treats the UI as a saved receipt",()=>{
  const editor=source("src/components/placements/tpo-college-rules-control.tsx");
  expect(editor).toContain('fetch("/api/placements/tpo/settings/rules"');
  expect(editor).toContain("expectedVersion: rules.version");
  expect(editor).toContain("confirmed: true");
  expect(editor).toContain('if (!response.ok) throw new Error(');
  expect(editor).toContain("const discard=()=>");
  expect(editor).toContain("<ConfirmDialog open={confirmSave}");
  expect(editor).toContain('title="Leave without saving"');
  expect(editor).toContain("allowUnload.current=true");
 });
 it("preserves the separate CGPA conversion endpoint instead of implying an atomic cross-service save",()=>{
  const rules=source("src/app/(authenticated)/tpo/settings/rules/page.tsx");
  const cgpa=source("src/components/placements/tpo-cgpa-rule-control.tsx");
  expect(rules).toContain("TpoCgpaRuleControl initialRule={cgpaRule}");
  expect(cgpa).toContain('fetch("/api/placements/tpo/settings/cgpa-rule"');
  expect(cgpa).toContain('title:"CGPA conversion updated"');
 });
});
