import {describe,it,expect} from "vitest";
import {recruiterTeamCapabilityLabels} from "@/modules/placements/recruiter-team-capabilities-model";
describe("Recruiter teammate grant labels",()=>{
 it("shows only actual persisted, granted capabilities",()=>{
  expect(recruiterTeamCapabilityLabels(["DRIVES","INTERVIEWS","MESSAGES"]))
   .toEqual(["Hiring drives","Interview scheduling","Placement-cell messages"]);
 });
 it("does not claim all student access or display unsupported capabilities",()=>{
  expect(recruiterTeamCapabilityLabels(["DRIVES","DRIVES","UNVERIFIED"]))
   .toEqual(["Hiring drives"]);
  expect(recruiterTeamCapabilityLabels([])).toEqual([]);
 });
});
