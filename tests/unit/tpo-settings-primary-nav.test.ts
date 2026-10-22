import {describe,expect,it} from "vitest";
import {TPO_SETTINGS_NAV_GROUPS} from "@/components/placements/tpo-settings-nav";
describe("TPO-settings-audit-01 legacy primary Settings sections",()=>{
 it("keeps the five legacy-visible settings sections while deep links retain other panels",()=>{
  expect(TPO_SETTINGS_NAV_GROUPS.map(g=>g.title)).toEqual(["Placement policy","People"]);
  const labels=TPO_SETTINGS_NAV_GROUPS.flatMap(g=>(g.items as readonly {label:string}[]).map(x=>x.label));
  expect(labels).toEqual([
   "Placement rules","Job types","After college","Placement team","Recruiters",
  ]);
  const legacy=["Placement rules","Job types","After college"];
  expect(labels.filter(label=>legacy.includes(label))).toEqual(legacy);
  expect(TPO_SETTINGS_NAV_GROUPS.flatMap(g=>[...g.items] as {href:string}[]).every(x=>x.href.startsWith("/tpo/settings/"))).toBe(true);
 });
});
