import {describe,expect,it} from "vitest";
import {hrDriveProposalHistoryCsv} from "@/modules/placements/hr-drive-proposal-export-model";
const valid={referenceId:"123e4567-e89b-42d3-a456-426614174001",
 title:"Engineering role",createdAt:new Date("2099-01-01T00:00:00.000Z")};
describe("HR-PROPOSAL-CSV-99 archived recruiter discussion export privacy",()=>{
 it("escapes whitespace-prefixed spreadsheet formulas before quoting the role cell",()=>{
  for(const title of [" =HYPERLINK(1,2)","\t@SUM(1,2)","\n+1","  -1"]){
   const csv=hrDriveProposalHistoryCsv([{...valid,title}]);
   expect(csv).toContain('"\''+title.replaceAll('"','""')+'"');
   expect(csv).toContain('"DISCUSSION_ONLY"');
  }
 });
 it("does not throw or invent time when a historic proposal timestamp is corrupt",()=>{
  const csv=hrDriveProposalHistoryCsv([{...valid,createdAt:new Date(Number.NaN)}]);
  expect(csv).toContain(',"","DISCUSSION_ONLY"');
  expect(csv).not.toContain("Invalid Date");
 });
 it("exports metadata only and never emits raw conversation or private candidate data",()=>{
  const csv=hrDriveProposalHistoryCsv([valid]);
  expect(csv).toContain("sent_at_utc");
  expect(csv).toContain("2099-01-01T00:00:00.000Z");
  expect(csv).not.toContain("Private applicant");
  expect(csv).not.toContain("SUBMITTED_APPROVAL_REQUEST");
 });
 it("produces one harmless header-only CSV for a newly authorized empty history",()=>{
  const csv=hrDriveProposalHistoryCsv([]);
  expect(csv.split("\r\n")).toHaveLength(2);
  expect(csv).toContain("proposal_reference");
 });
});