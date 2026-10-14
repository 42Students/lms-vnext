import {describe,expect,it} from "vitest";
import {emptyHrDriveDraft} from "@/modules/placements/hr-drive-draft-model";
import {hrDraftPreviewRounds} from "@/modules/placements/hr-draft-preview-model";
describe("HR recruiter student-facing draft preview",()=>{
 it("preserves round order, kind and chosen names without saving",()=>{
  const draft={...emptyHrDriveDraft(),rounds:[
   {name:" Screening ",kind:"TEST" as const},
   {name:"Panel",kind:"INTERVIEW" as const},
  ]};
  expect(hrDraftPreviewRounds(draft)).toEqual([
   {order:1,kind:"TEST",name:"Screening"},
   {order:2,kind:"INTERVIEW",name:"Panel"},
  ]);
  expect(draft.rounds[0]!.name).toBe(" Screening ");
 });
});
