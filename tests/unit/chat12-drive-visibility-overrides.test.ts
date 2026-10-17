import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {tpoDriveVisibilitySelection,tpoDriveVisibilityValid} from "@/modules/placements/tpo-drive-visibility-bulk-model";
const src=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
describe("TPO drive visibility overrides",()=>{
 it("TPO-students-12 limits actions to 25 selected learners actually displayed on the roster page",()=>{
  const items=Array.from({length:30},(_,index)=>({id:"id-"+index}));
  expect(tpoDriveVisibilitySelection(["other",...items.map(x=>x.id)],items,25).map(x=>x.id))
   .toEqual(items.slice(0,25).map(x=>x.id));
  expect(tpoDriveVisibilitySelection(["other"],items,25)).toEqual([]);
 });
 it("TPO-students-12 requires a reason to include or exclude, but permits explicit clear",()=>{
  expect(tpoDriveVisibilityValid({jobId:"a",decision:"INCLUDE",reason:"",count:1})).toBe(false);
  expect(tpoDriveVisibilityValid({jobId:"a",decision:"EXCLUDE",reason:"Valid reason",count:1})).toBe(true);
  expect(tpoDriveVisibilityValid({jobId:"a",decision:"CLEAR",reason:"",count:1})).toBe(true);
 });
 it("TPO-students-12 uses scoped PUT/DELETE eligibility APIs and a guarded confirmation",()=>{
  const page=src("src/app/(authenticated)/tpo/students/page.tsx");
  const ui=src("src/components/tpo/tpo-students-drive-visibility.tsx");
  const route=src("src/app/api/placements/jobs/[jobId]/eligibility/[membershipId]/route.ts");
  expect(page).toContain("<TpoStudentsDriveVisibility");
  expect(ui).toContain("run(async()=>");
  expect(ui).toContain('method:"PUT"');
  expect(ui).toContain('method:"DELETE"');
  expect(ui).toContain("The eligibility rules still protect college and cohort targeting.");
  expect(route).toContain("isSameOriginRequest(request)");
  expect(route).toContain("setEligibilityOverride(");
  expect(route).toContain("revokeEligibilityOverride(");
 });
});
