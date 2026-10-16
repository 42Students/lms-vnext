import {describe,expect,it} from "vitest";
import {parseTpoEligibilityCsv,previewEligibilityImport} from "@/modules/placements/tpo-eligibility-import-model";
const a="11111111-1111-4111-8111-111111111111",b="22222222-2222-4222-8222-222222222222";
const roster=[
 {studentCode:a,membershipId:a,rollNumber:"21CS001",expectedVersion:"none"},
 {studentCode:b,membershipId:b,rollNumber:"21CS002",expectedVersion:"v2"},
];
describe("TPO-batches-31 eligibility CSV roll number matching",()=>{
 it("matches roll numbers and exact UUIDs without using names or emails",()=>{
  const rows=parseTpoEligibilityCsv("studentCode,decision,reason\n21cs001,ELIGIBLE,\n"+b+",INELIGIBLE,Not eligible");
  expect(previewEligibilityImport(rows,roster).map(r=>r.membershipId)).toEqual([a,b]);
 });
 it("skips ambiguous rolls and repeat aliases of the same member",()=>{
  const dup=[...roster,{studentCode:"33333333-3333-4333-8333-333333333333",membershipId:"33333333-3333-4333-8333-333333333333",rollNumber:"21CS001",expectedVersion:"none"}];
  const row=parseTpoEligibilityCsv("21CS001,ELIGIBLE,");
  expect(previewEligibilityImport(row,dup)[0].reason).toBe("Ambiguous roll number in batch");
  const aliases=parseTpoEligibilityCsv("21CS001,ELIGIBLE,\n"+a+",ELIGIBLE,");
  expect(previewEligibilityImport(aliases,roster).map(r=>r.status)).toEqual(["matched","unusable"]);
 });
 it("never matches out-of-batch codes and requires reasons for ineligible",()=>{
  const rows=parseTpoEligibilityCsv("21CS999,ELIGIBLE,\n21CS002,INELIGIBLE,");
  expect(previewEligibilityImport(rows,roster).map(r=>r.reason))
   .toEqual(["Not an active learner in this batch","Ineligible reason required"]);
 });
});
