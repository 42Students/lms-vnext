import {describe,expect,it} from "vitest";
import {MENTOR_PORTFOLIO_SEGMENTS,matchesMentorPortfolioSegment,
 mentorPortfolioSegmentHref} from
 "@/modules/projects/mentor-portfolio-segment-model";
const facts=(overrides:Partial<Parameters<typeof matchesMentorPortfolioSegment>[1]>={})=>({
 status:"ACTIVE",blocker:null,attentionKinds:new Set<string>(),
 hasFinalSubmission:false,planFullyDelivered:false,...overrides,
});
describe("Mentor Home team segment source predicates",()=>{
 it("exposes all five prototype chips with no inferred sixth segment",()=>{
  expect([...MENTOR_PORTFOLIO_SEGMENTS]).toEqual([
   "CURRENT","NEEDS_YOU","AT_RISK","FINAL_SUBMISSION","ARCHIVED",
  ]);
 });
 it("limits Needs you to decisions and not generic upcoming meetings",()=>{
  expect(matchesMentorPortfolioSegment("NEEDS_YOU",facts({
   attentionKinds:new Set(["MEETING_SOON"]),
  }))).toBe(false);
  for(const kind of ["TASK_REVIEW","TASK_BLOCKED","SPRINT_SIGN_OFF",
   "UNASSIGNED_NEXT","REQUESTED","REVIEW"]){
    expect(matchesMentorPortfolioSegment("NEEDS_YOU",facts({
      attentionKinds:new Set([kind]),
    })),kind).toBe(true);
  }
 });
 it("defines At risk from recorded blockers or explicit stalled events",()=>{
  expect(matchesMentorPortfolioSegment("AT_RISK",facts())).toBe(false);
  expect(matchesMentorPortfolioSegment("AT_RISK",facts({blocker:"Dependency"})))
   .toBe(true);
  expect(matchesMentorPortfolioSegment("AT_RISK",facts({
   attentionKinds:new Set(["STALLED"]),
  }))).toBe(true);
 });
 it("does not call missing release data a completed final submission",()=>{
  expect(matchesMentorPortfolioSegment("FINAL_SUBMISSION",facts())).toBe(false);
  expect(matchesMentorPortfolioSegment("FINAL_SUBMISSION",facts({
   hasFinalSubmission:true,
  }))).toBe(true);
  expect(matchesMentorPortfolioSegment("FINAL_SUBMISSION",facts({
   planFullyDelivered:true,
  }))).toBe(true);
 });
 it("keeps all archived work out of current/action/risk segments",()=>{
  const archived=facts({status:"ARCHIVED",blocker:"Recorded blocker",
   attentionKinds:new Set(["TASK_REVIEW"]),hasFinalSubmission:true});
  expect(matchesMentorPortfolioSegment("ARCHIVED",archived)).toBe(true);
  for(const segment of ["CURRENT","NEEDS_YOU","AT_RISK",
   "FINAL_SUBMISSION"] as const){
    expect(matchesMentorPortfolioSegment(segment,archived),segment).toBe(false);
  }
 });
 it("preserves independent search/sort while clearing obsolete filters and page",()=>{
  const url=mentorPortfolioSegmentHref("NEEDS_YOU",{
   search:"graphql",assignment:"PRIMARY",sort:"TITLE",pageSize:50,
  });
  expect(url).toContain("segment=NEEDS_YOU");
  expect(url).toContain("search=graphql");
  expect(url).not.toContain("page=");
  expect(url).not.toContain("attention=");
  expect(url).not.toContain("status=");
 });
});
