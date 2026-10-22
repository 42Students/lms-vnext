import {describe,expect,it} from "vitest";
import {TPO_SETTINGS_NAV_GROUPS} from "@/components/placements/tpo-settings-nav";
import {publicPlacementPublicationInput} from "@/modules/placements/public-page/publication-policy";
describe("T-S2-08 public publishing remains a scoped TPO setting",()=>{
 it("keeps the new setting reachable",()=>{
  // The pixel-clone navigation keeps exactly the old five sections; public
  // publication remains available on its own authorized, scoped settings route.
  expect(TPO_SETTINGS_NAV_GROUPS.flatMap(group=>group.items)).toHaveLength(5);
  const {readFileSync}=await import("node:fs");
  const page=readFileSync("src/app/(authenticated)/tpo/settings/public-page/page.tsx","utf8");
  expect(page).toContain('<PageHeader title="Public placements"');
  expect(page).toContain('<TpoSettingsNav active="public-page" compact/>');
  expect(page).toContain("getTpoPublicPlacementPublication(context)");
 });
 it("does not accept population claims through an opt-in request",()=>{
  expect(publicPlacementPublicationInput.safeParse({enabled:true,collegeId:"other",populationCount:1000}).success).toBe(false);
 });
});
