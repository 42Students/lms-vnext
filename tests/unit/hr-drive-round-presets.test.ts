import {describe,expect,it} from "vitest";
import {emptyHrDriveDraft,hrDriveDraftSchema} from "@/modules/placements/hr-drive-draft-model";
import {applyHrRoundPreset,HR_DRIVE_ROUND_PRESETS} from "@/modules/placements/hr-drive-round-presets";
describe("HR Request Drive local round presets",()=>{
 it("replaces only draft rounds with supported legacy kinds",()=>{
  const draft={...emptyHrDriveDraft(),title:"Engineer",description:"Test this hiring process.",
   location:"Hyderabad"};
  const next=applyHrRoundPreset(draft,"FULL_PROCESS");
  expect(next.rounds).toHaveLength(4);
  expect(next.title).toBe("Engineer");
  expect(next.rounds.map(r=>r.kind)).toEqual(["TALK","TEST","GD","INTERVIEW"]);
  expect(hrDriveDraftSchema.safeParse(next).success).toBe(true);
  expect(draft.rounds).toHaveLength(1);
 });
 it("all presets stay within Zod round caps",()=>{
  expect(HR_DRIVE_ROUND_PRESETS.every(p=>p.rounds.length>=1&&p.rounds.length<=12)).toBe(true);
 });
});
