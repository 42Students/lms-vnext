import {describe,expect,it} from "vitest";
import {mentorReviewQuerySchema,mentorPortfolioHref,selectMentorReviewQueue} from "@/modules/projects/mentor-portfolio-model";
import type {MentorProjectAttention} from "@/modules/projects/mentor-attention";
describe("Mentor delivery triage order",()=>{
 it("validates strict order and retains it in page URLs",()=>{
  expect(mentorReviewQuerySchema.parse({}).order).toBe("NEWEST");
  expect(mentorReviewQuerySchema.safeParse({order:"UNKNOWN"}).success).toBe(false);
  expect(mentorReviewQuerySchema.safeParse({collegeId:"other"}).success).toBe(false);
  expect(mentorPortfolioHref("reviews",{order:"OLDEST",page:2})).toContain("order=OLDEST");
 });
 it("orders current pending REVIEW only and ties stably",()=>{
  const rows=[
   {projectId:"a",key:"late",kind:"REVIEW",title:"X",description:"Y",href:"/x",occurredAt:"2026-10-14T12:00:00Z"},
   {projectId:"b",key:"early",kind:"REVIEW",title:"X",description:"Y",href:"/x",occurredAt:"2026-10-12T12:00:00Z"},
   {projectId:"c",key:"stalled",kind:"STALLED",title:"X",description:"Y",href:"/x",occurredAt:"2026-10-11T12:00:00Z"},
  ] as MentorProjectAttention[];
  expect(selectMentorReviewQueue(rows,"","OLDEST").map(x=>x.key)).toEqual(["early","late"]);
  expect(selectMentorReviewQueue(rows,"","NEWEST").map(x=>x.key)).toEqual(["late","early"]);
 });
});
