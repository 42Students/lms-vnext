import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {matchTpoBulkRollNumbers} from "@/modules/placements/tpo-bulk-ui-model";
const read=(path:string)=>readFileSync(path,"utf8");
describe("TPO batch remaining legacy controls",()=>{
 it("TPO-batches-23 preserves an explicit whole-batch decision and class override explanation",()=>{
  const ui=read("src/app/(authenticated)/tpo/batches/[batchId]/page.tsx");
  expect(ui).toContain('aria-label="Whole batch eligibility decision"');
  expect(ui).toContain("The batch is ineligible");
  expect(ui).toContain("Classes or students set to Eligible");
  expect(ui).toContain("Set batch decision");
 });
 it("TPO-batches-43 offers reason presets and enforces a three-character ineligibility reason",()=>{
  const ui=read("src/components/tpo/tpo-batch-inline-decision.tsx");
  expect(ui).toContain("Common ineligibility reasons");
  for(const reason of ["Higher studies","Not interested in placements","Detained / year back","Discontinued","Disciplinary","Already has a job"])expect(ui).toContain(reason);
  expect(ui).toContain("reason.trim().length>=3");
  expect(ui).toContain('role="alert"');
 });
 it("TPO-batches-47 never matches an ambiguous roll number to an arbitrary student",()=>{
  const roster=[
   {id:"00000000-0000-4000-8000-000000000001",label:"A",rollNumber:"CSE-11"},
   {id:"00000000-0000-4000-8000-000000000002",label:"B",rollNumber:"CSE-11"},
   {id:"00000000-0000-4000-8000-000000000003",label:"C",rollNumber:"CSE-12"},
  ];
  const selected=matchTpoBulkRollNumbers(roster,"CSE-11,CSE-12,UNKNOWN");
  expect(selected.ids).toEqual(["00000000-0000-4000-8000-000000000003"]);
  expect(selected.unmatched).toEqual(["CSE-11","UNKNOWN"]);
  expect(selected.requested).toBe(3);
 });
 it("TPO-batches-62 restores old tab URL aliases without a conflicting dynamic path",()=>{
  const ui=read("src/app/(authenticated)/tpo/batches/[batchId]/page.tsx");
  expect(ui).toContain('registration:"registrations"');
  expect(ui).toContain('students:"students"');
  expect(ui).toContain('history:"history"');
  expect(ui).toContain('redirect("/tpo/batches/"+encodeURIComponent(batchId)+"/"+aliases[selected])');
 });
});
