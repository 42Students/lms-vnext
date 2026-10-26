import {describe,it,expect} from "vitest";
import {filterOwnRecruiterRequests,requestStageLabel,recruiterRequestAttentionCounts} from "@/modules/placements/recruiter-request-list-model";
const now=new Date("2026-10-17T00:00:00.000Z");
const rows=["REQUEST","SENT_BACK","DRAFT","REJECTED","CANCELLED"].map(status=>({
 id:status,status,draft:{title:"QA Engineer"},createdAt:now
}));
describe("REC-home-drives-12/13 request visibility",()=>{
 it("shows active requests and real waiting counts",()=>{
  expect(filterOwnRecruiterRequests(rows,"WAITING","").map(x=>x.status)).toEqual(["DRAFT","REQUEST","SENT_BACK"]);
  expect(filterOwnRecruiterRequests(rows,"CLOSED","")).toHaveLength(2);
  expect(filterOwnRecruiterRequests(rows,"LIVE","")).toHaveLength(0);
  expect(filterOwnRecruiterRequests(rows,"ALL","QA")).toHaveLength(5);
 });
 it("shows sent back as a reason-bearing state",()=>{
  expect(requestStageLabel("SENT_BACK")).toBe("Needs changes · sent back");
  expect(requestStageLabel("REQUEST")).toBe("Sent for review");
 });
 it("does not tell recruiters their sent-back requests are awaiting the placement cell",()=>{
  expect(recruiterRequestAttentionCounts(rows)).toEqual({
   waitingOnCollege:2,needsRecruiterChanges:1,
  });
  expect(recruiterRequestAttentionCounts([{status:"SENT_BACK"}])).toEqual({
   waitingOnCollege:0,needsRecruiterChanges:1,
  });
  expect(recruiterRequestAttentionCounts([])).toEqual({
   waitingOnCollege:0,needsRecruiterChanges:0,
  });
 });

});
