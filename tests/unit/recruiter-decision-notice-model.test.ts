import {describe,it,expect} from "vitest";
import {recruiterDecisionNoticeRows} from "@/modules/placements/recruiter-decision-notice-model";
describe("REC-calendar-messages-profile-22 request-decision notification projection",()=>{
 it("only targets recruiter Drive request history and preserves read state",()=>{
  const sample=[{id:"notice",title:"Drive request approved",body:"Approved",
   createdAt:new Date("2026-10-17T12:00:00Z"),readAt:null,subjectId:"request"}];
  const output=recruiterDecisionNoticeRows(sample,"550e8400-e29b-41d4-a716-446655440000");
  expect(output[0]?.href).toContain("/hr/drives?collegeId=");
  expect(output[0]?.unread).toBe(true);
  expect(output[0]?.body).toBe("Approved");
 });
});
