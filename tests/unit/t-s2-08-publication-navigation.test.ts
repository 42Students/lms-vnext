import {describe,expect,it} from "vitest";
import {TPO_SETTINGS_NAV_GROUPS} from "@/components/placements/tpo-settings-nav";
import {publicPlacementPublicationInput} from "@/modules/placements/public-page/publication-policy";
describe("T-S2-08 public publishing remains a scoped TPO setting",()=>{
 it("keeps the new setting reachable",()=>{
  expect((TPO_SETTINGS_NAV_GROUPS as readonly {items:readonly {href:string;label:string}[]}[]).flatMap(x=>x.items)
   .some(x=>x.href==="/tpo/settings/public-page"&&x.label==="Public placements")).toBe(true);
 });
 it("does not accept population claims through an opt-in request",()=>{
  expect(publicPlacementPublicationInput.safeParse({enabled:true,collegeId:"other",populationCount:1000}).success).toBe(false);
 });
});
