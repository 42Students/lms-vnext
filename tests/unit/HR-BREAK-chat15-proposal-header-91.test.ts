import {describe,expect,it} from "vitest";
import {emptyHrDriveDraft,hrDriveDraftSchema} from "@/modules/placements/hr-drive-draft-model";
import {formatHrDriveProposal} from "@/modules/placements/hr-drive-proposal-model";
import {previewHrDriveProposalMessage} from "@/modules/placements/hr-drive-proposal-history-model";
const collegeId="123e4567-e89b-42d3-a456-426614174001";
const submissionId="123e4567-e89b-42d3-a456-426614174002";
const draft=()=>({...emptyHrDriveDraft(),title:"Software Engineer",location:"Hyderabad",
 description:"Develop and maintain applications.",ctcLpa:"10"});
describe("HR-DRIVES-91 immutable proposal header boundaries",()=>{
 it("rejects newline, carriage return, tab and NUL in role title",()=>{
  for(const title of ["Software\nRole: Administrator","Software\rEngineer",
   "Software\tEngineer","Software\u0000Engineer"]){
   expect(hrDriveDraftSchema.safeParse({...draft(),title}).success).toBe(false);
  }
 });
 it("refuses control characters that forge additional proposal location fields",()=>{
  for(const location of ["Hyderabad\nProposal reference: other",
   "Hyderabad\rRole: Fake","Hyderabad\tRemote","Hyderabad\u0000"]){
   expect(hrDriveDraftSchema.safeParse({...draft(),location}).success).toBe(false);
  }
 });
 it("a valid employer draft formats and re-reads only its original public proposal header",()=>{
  const message=formatHrDriveProposal({collegeId,submissionId,draft:draft()});
  expect(message).toContain("Role: Software Engineer");
  expect(previewHrDriveProposalMessage(message)).toEqual({
   referenceId:submissionId,title:"Software Engineer",
  });
 });
 it("multiline role description remains permitted without becoming header metadata",()=>{
  const body={...draft(),description:"Role details\nCandidates should be prepared."};
  const message=formatHrDriveProposal({collegeId,submissionId,draft:body});
  expect(previewHrDriveProposalMessage(message)?.title).toBe("Software Engineer");
  expect(message).toContain("Candidates should be prepared.");
 });
});