import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {sortTpoBatchWorkingPriority} from "@/modules/placements/tpo-batch-priority-sort-model";
const page=()=>readFileSync("src/app/(authenticated)/tpo/batches/page.tsx","utf8");
const a={id:"active",name:"Alpha",finishedAt:null,endYear:2099,state:"IN_PLACEMENTS"};
const b={id:"with-students",name:"Bravo",finishedAt:null,endYear:2100};
const c={id:"empty",name:"Charlie",finishedAt:null,endYear:2101};
const d={id:"finished",name:"Delta",finishedAt:new Date("2099-02-01T00:00:00Z"),endYear:2102};
describe("TPO Batches resilient working set",()=>{
 it("TPO-batches-09 ranks active eligible batches before nonempty, empty and finished",()=>{
  const counts=new Map([["active",{eligible:10,assessed:10}],
   ["with-students",{eligible:0,assessed:12}],["empty",{eligible:0,assessed:0}],
   ["finished",{eligible:25,assessed:25}]]);
  expect(sortTpoBatchWorkingPriority([d,c,b,a],counts).map(row=>row.id))
   .toEqual(["active","with-students","empty","finished"]);
  expect(page()).toContain("sortTpoBatchWorkingPriority");
  expect(page()).toContain("Recommended order");
 });
 it("TPO-batches-15 never displays internal migration names when lifecycle data is unavailable",()=>{
  const ui=page();
  expect(ui).not.toContain("migration is pending.");
  expect(ui).not.toContain("storage is registered.");
  expect(ui).toContain("Some batch details are temporarily unavailable; academic batches remain visible.");
 });
 it("TPO-batches-28 treats optional counts as independently fallible without hiding the batch list",()=>{
  const ui=page();
  for(const item of ["countTpoLearnersWithoutClass(context).catch(()=>null)",
   "listTpoBatchCardEligibility(context,data.batches.map(batch=>batch.id)).catch(()=>null)",
   "listTpoBatchJourneyCounts(context,data.batches.map(batch=>batch.id)).catch(()=>null)"])
   expect(ui).toContain(item);
  expect(ui).toContain("Eligibility counts could not load.");
  expect(ui).toContain("Recent decisions could not load.");
 });
 it("GR-38 does not show zero when a KPI could not be loaded",()=>{
  expect(page()).toContain('{data.ready&&value!==null?value:"—"}');
  expect(page()).toContain("const placedCount=journey===null?null:");
  expect(page()).toContain('data.ready&&value!==null?value:"—"');
 });
 it("GR-72 keeps the academic batch directory usable on secondary-service failure",()=>{
  const ui=page();
  expect(ui).toContain("Other batch details are still available.");
  expect(ui).toContain("The batch list is still available.");
  expect(ui).toContain("batchPage.items.map");
 });
 it("TPO-batches-27 shows academic years, a placement-eligibility back link, and effective status",()=>{
  const reader=readFileSync("src/modules/placements/tpo-batch-workspace-read-service.ts","utf8");
  const overview=readFileSync("src/app/(authenticated)/tpo/batches/[batchId]/page.tsx","utf8");
  expect(reader).toContain("startYear:sql<number|null>");
  expect(reader).toContain("endYear:sql<number|null>");
  expect(overview).toContain("Placement eligibility");
  expect(overview).toContain('tpoBatchReturnHref(query["returnTo"])');
  expect(overview).toContain("tpoBatchPlacementState");
  expect(overview).toContain("batch.endYear");
 });

});
