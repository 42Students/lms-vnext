import {describe,expect,it} from "vitest";
import {emptyHrDriveDraft,hrDriveDraftSchema} from "@/modules/placements/hr-drive-draft-model";
import {reorderHrDraftRound} from "@/modules/placements/hr-draft-round-order-model";
describe("HR local hiring round order",()=>{
 it("moves by one position and cannot cross bounds",()=>{
  const draft={...emptyHrDriveDraft(),rounds:[
   {kind:"TEST" as const,name:"Assessment"},{kind:"INTERVIEW" as const,name:"Panel"},
   {kind:"GD" as const,name:"Group discussion"}]};
  const moved=reorderHrDraftRound(draft,2,-1);
  expect(moved.rounds.map(r=>r.name)).toEqual(["Assessment","Group discussion","Panel"]);
  expect(draft.rounds[1]!.name).toBe("Panel");
  expect(reorderHrDraftRound(moved,0,-1)).toBe(moved);
  expect(reorderHrDraftRound(moved,4,1)).toBe(moved);
  expect(hrDriveDraftSchema.safeParse({...moved,title:"Engineer",
   description:"A role with clear duties and requirements.",location:"Hyderabad"}).success).toBe(true);
 });
});
