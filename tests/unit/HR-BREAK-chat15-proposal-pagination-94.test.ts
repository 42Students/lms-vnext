import {describe,expect,it} from "vitest";
import {hrProposalHistoryWindow,HR_PROPOSAL_PAGE_SIZE,previewHrDriveProposalMessage}
 from "@/modules/placements/hr-drive-proposal-history-model";
const id="123e4567-e89b-42d3-a456-426614174001";
describe("HR-PROPOSALS-94 persisted recruiter discussion pagination",()=>{
 it("keeps first and last page offsets at exactly 20 records",()=>{
  expect(hrProposalHistoryWindow(1,21)).toEqual({
   page:1,pages:2,offset:0,total:21,
  });
  expect(hrProposalHistoryWindow(2,21)).toEqual({
   page:2,pages:2,offset:HR_PROPOSAL_PAGE_SIZE,total:21,
  });
  expect(hrProposalHistoryWindow(50,21)).toMatchObject({page:2,offset:20});
 });
 it("recovers from malformed or stale page inputs before producing a SQL offset",()=>{
  for(const value of [Number.NaN,Infinity,-Infinity,0,-1,1.5]){
   expect(hrProposalHistoryWindow(value,30)).toMatchObject({page:1,offset:0});
  }
 });
 it("refuses unsound persisted totals rather than treating private rows as an empty page",()=>{
  for(const value of [Number.NaN,Infinity,-1,1.2]){
   expect(()=>hrProposalHistoryWindow(1,value)).toThrow("INVALID_PROPOSAL_COUNT");
  }
 });
 it("empty recruiter proposals expose one navigable empty page",()=>{
  expect(hrProposalHistoryWindow(7,0)).toEqual({page:1,pages:1,offset:0,total:0});
 });
 it("preview never includes proposal private description or accepts nonproposal chat",()=>{
  const head="Drive proposal for placement cell discussion — NOT a submitted approval request";
  const msg=[head,"Proposal reference: "+id,"Role: Engineer","Description:","Private text"].join("\n");
  expect(previewHrDriveProposalMessage(msg)).toEqual({referenceId:id,title:"Engineer"});
  expect(previewHrDriveProposalMessage("Normal conversation")).toBeNull();
  expect(previewHrDriveProposalMessage([head,"Proposal reference: not-valid","Role: Engineer"].join("\n")))
   .toBeNull();
 });
});