import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {parseTpoEligibilitySheetCsv,previewTpoEligibilitySheet} from "@/modules/placements/tpo-eligibility-sheet-model";

describe("TPO batch import preview and commit security",()=>{
 it("TPO-batches-R04 shows exact unusable row causes and never treats an invalid decision as eligible",()=>{
  const rows=parseTpoEligibilitySheetCsv("roll no,decision,reason\n,Eligible,\nR1,maybe,\nR2,Ineligible,x\nR2,Eligible,\nR9,Eligible,");
  const roster=[
   {studentCode:"R1",membershipId:"11111111-1111-4111-8111-111111111111",rollNumber:"R1",expectedVersion:"v1"},
   {studentCode:"R2",membershipId:"22222222-2222-4222-8222-222222222222",rollNumber:"R2",expectedVersion:"v2"},
  ];
  const verdict=previewTpoEligibilitySheet(rows,roster);
  expect(verdict.map(row=>row.status)).toEqual(["unusable","unusable","unusable","unusable","unusable"]);
  expect(verdict.map(row=>row.reason)).toEqual([
   "Roll number is missing","Decision must be Eligible, Ineligible or Not decided",
   "Ineligible needs a reason","Roll number appears twice","No student with this roll number",
  ]);
 });
 it("TPO-batches-R04 accepts a reviewed, valid roll and counts it only once",()=>{
  const rows=parseTpoEligibilitySheetCsv("usn,outcome,comment\nR1,Yes,\nR1,No,Proof missing");
  const roster=[{studentCode:"R1",membershipId:"11111111-1111-4111-8111-111111111111",rollNumber:"R1",expectedVersion:"v1"}];
  expect(previewTpoEligibilitySheet(rows,roster).map(row=>row.status)).toEqual(["matched","unusable"]);
 });
 it("TPO-batches-R04 requires confirmed same-origin write and refuses any unreviewed unusable source row on the server",()=>{
  const server=readFileSync(new URL("../../src/app/api/placements/tpo/batches/[batchId]/import-commit/route.ts",import.meta.url),"utf8");
  expect(server).toContain("isSameOriginRequest(request)");
  expect(server).toContain("confirmed:z.literal(true)");
  expect(server).toContain("if(preview.skipped>0)");
  const form=readFileSync(new URL("../../src/components/tpo/tpo-batch-eligibility-import.tsx",import.meta.url),"utf8");
  expect(form).toContain("if(unresolved>0)");
  expect(form).toContain("unresolved>0||!acknowledged");
 });
});