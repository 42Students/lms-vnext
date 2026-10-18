import {describe,expect,it} from "vitest";
import {resolveOwnInterviewDeepLink} from "@/modules/placements/learner-interview-deeplink-model";
import {learnerInterviewFocusState} from "@/modules/placements/learner-interview-focus-model";
import {learnerInterviewMobileSummary} from "@/modules/placements/learner-interview-mobile-model";
import {learnerInterviewRescheduleSummary} from "@/modules/placements/learner-interview-reschedule-summary-model";
import {learnerInterviewCountdown} from "@/modules/placements/learner-interview-countdown-model";
import {learnerRoundTimeSignal,learnerRoundTimeLabel} from "@/modules/placements/learner-round-time-signal";
import {isCareerRoundVisible} from "@/modules/placements/learner-round-visibility-policy";
import {learnerRoundSearchQuerySchema,learnerRoundSearchFromQuery,learnerRoundSearchHref}
 from "@/modules/placements/learner-round-search-query-model";
import {learnerInterviewWithdrawalInputSchema,learnerInterviewWithdrawalTarget}
 from "@/modules/placements/learner-interview-withdrawal-model";
const a="00000000-0000-4000-8000-000000000001",b="00000000-0000-4000-8000-000000000002";
const now=Date.parse("2026-10-20T04:00:00Z");

describe("TPO-BREAK-LEARNER-INTERVIEW-07 IDOR, stale tabs and honest schedule states",()=>{
 it("an arbitrary application+round deep link cannot grant access outside the authenticated learner's rounds",()=>{
  const own=[{applicationId:a,roundId:b,roundKind:"INTERVIEW"},
   {applicationId:b,roundId:a,roundKind:"TEST"}];
  expect(resolveOwnInterviewDeepLink(own,{applicationId:a,roundId:b}))
   .toEqual({valid:true,key:a+":"+b});
  expect(resolveOwnInterviewDeepLink(own,{applicationId:b,roundId:a})).toEqual({valid:false});
  expect(resolveOwnInterviewDeepLink(own,{applicationId:a,roundId:a})).toEqual({valid:false});
  expect(resolveOwnInterviewDeepLink(own,{applicationId:a})).toEqual({valid:false});
  expect(resolveOwnInterviewDeepLink(own,{applicationId:"other",roundId:b})).toEqual({valid:false});
  expect(resolveOwnInterviewDeepLink(own,{applicationId:a,roundId:b,tenantId:"forged"})).toEqual({valid:false});
  expect(resolveOwnInterviewDeepLink(own,{})).toEqual({valid:true,key:null});
 });
 it("never highlights a non-owned interview even when a forged selectedKey is visible in URL",()=>{
  const own=[{applicationId:a,roundId:b}];
  const selected=a+":"+b;
  expect(learnerInterviewFocusState(own,own,selected))
   .toEqual({highlightedKey:selected,hiddenByFilters:false});
  expect(learnerInterviewFocusState(own,[],selected))
   .toEqual({highlightedKey:selected,hiddenByFilters:true});
  expect(learnerInterviewFocusState(own,own,b+":"+a))
   .toEqual({highlightedKey:null,hiddenByFilters:false});
 });
 it("does not confuse employer assessment and discussion names with actual interview round kinds",()=>{
  expect(isCareerRoundVisible("ASSESSMENT","TEST")).toBe(true);
  expect(isCareerRoundVisible("ASSESSMENT","VENDOR_TEST")).toBe(true);
  expect(isCareerRoundVisible("ASSESSMENT","INTERVIEW")).toBe(false);
  expect(isCareerRoundVisible("INTERVIEW","INTERVIEW")).toBe(true);
  expect(isCareerRoundVisible("INTERVIEW","GD")).toBe(true);
  expect(isCareerRoundVisible("INTERVIEW","TEST")).toBe(false);
 });
 it("classifies IST schedule relative to server time without inventing employer attendance",()=>{
  const interview={scheduledAt:"2026-10-20T04:30:00Z",durationMinutes:30};
  expect(learnerRoundTimeSignal(interview,now)).toBe("UPCOMING");
  expect(learnerInterviewCountdown(interview,now))
   .toEqual({phase:"UPCOMING",label:"Starts in 30 min"});
  expect(learnerRoundTimeSignal(interview,now+40*60_000)).toBe("IN_SCHEDULED_WINDOW");
  expect(learnerInterviewCountdown(interview,now+40*60_000).label).toContain("attendance unconfirmed");
  expect(learnerRoundTimeSignal(interview,now+61*60_000)).toBe("SCHEDULED_TIME_PASSED");
  expect(learnerInterviewCountdown(interview,now+61*60_000).label).toContain("outcome unconfirmed");
  expect(learnerRoundTimeSignal({...interview,durationMinutes:Number.NaN},now+40*60_000))
   .toBe("SCHEDULED_TIME_PASSED");
  expect(learnerRoundTimeSignal({scheduledAt:"invalid",durationMinutes:30},now)).toBe("AWAITING_SCHEDULE");
  expect(learnerRoundTimeLabel("SCHEDULED_TIME_PASSED")).toBe("Scheduled time passed");
 });
 it("reschedule summary only appears when approved and does not claim attendance",()=>{
  const base={companyName:"Example Employer",roleTitle:"Developer",roundName:"Technical",
   originalScheduledAt:"2026-10-20T04:00:00Z",approvedScheduledAt:null,
   venue:" Hall A ",mode:"ON_CAMPUS"} as const;
  expect(learnerInterviewRescheduleSummary(base)).toBeNull();
  const summary=learnerInterviewRescheduleSummary({...base,approvedScheduledAt:"2026-10-21T04:00:00Z"});
  expect(summary?.location).toBe("Hall A");
  expect(summary?.copyText).toContain("not an attendance confirmation");
  expect(summary?.copyText).toContain("IST");
  const mobile=learnerInterviewMobileSummary({scheduledAt:base.originalScheduledAt,
   approvedScheduledAt:"2026-10-21T04:00:00Z"});
  expect(mobile).toContain("Approved reschedule");
  expect(mobile).toContain("IST");
  expect(learnerInterviewMobileSummary({scheduledAt:null,approvedScheduledAt:null})).toContain("Awaiting");
  expect(()=>learnerInterviewMobileSummary({scheduledAt:null,approvedScheduledAt:null,userId:"forged"})).toThrow();
 });
 it("shareable search is bounded, URL-escaped and cannot smuggle another college selector",()=>{
  expect(learnerRoundSearchFromQuery({q:"  Ada  "})).toBe("Ada");
  expect(learnerRoundSearchQuerySchema.safeParse({q:"x".repeat(101)}).success).toBe(false);
  expect(learnerRoundSearchQuerySchema.safeParse({collegeId:b}).success).toBe(false);
  const href=learnerRoundSearchHref("/learn/my-placements/interviews?page=2#up","A & B");
  const url=new URL(href,"https://college.example");
  expect(url.searchParams.get("q")).toBe("A & B");
  expect(url.searchParams.get("page")).toBe("2");
  expect(url.hash).toBe("#up");
  expect(href.startsWith("/learn/my-placements/interviews")).toBe(true);
 });
 it("interview withdrawal is explicit, version checked and limited to owned persisted targets",()=>{
  const targets=[{applicationId:a,roundId:b,expectedUpdatedAt:"2026-10-20T04:00:00Z",pending:false}];
  expect(learnerInterviewWithdrawalTarget(targets,a,b)).toEqual(targets[0]);
  expect(learnerInterviewWithdrawalTarget(targets,b,a)).toBeNull();
  const action={applicationId:a,roundId:b,expectedUpdatedAt:"2026-10-20T04:00:00Z",
   confirmed:true,reason:"I am unable to attend"};
  expect(learnerInterviewWithdrawalInputSchema.safeParse(action).success).toBe(true);
  expect(learnerInterviewWithdrawalInputSchema.safeParse({...action,confirmed:false}).success).toBe(false);
  expect(learnerInterviewWithdrawalInputSchema.safeParse({...action,expectedUpdatedAt:"stale"}).success).toBe(false);
  expect(learnerInterviewWithdrawalInputSchema.safeParse({...action,reason:"x"}).success).toBe(false);
  expect(learnerInterviewWithdrawalInputSchema.safeParse({...action,collegeId:"other"}).success).toBe(false);
 });
});
