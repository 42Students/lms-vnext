import {describe,expect,it} from "vitest";
import {
  matchesMentorPortfolioSegment,mentorPortfolioSegmentHref,
} from "@/modules/projects/mentor-portfolio-segment-model";
import {mentorProjectListQuerySchema} from
  "@/modules/projects/mentor-project-list-query";
import {singleValueMentorFilters} from
  "@/modules/projects/mentor-filter-query";

const facts=(overrides:Partial<Parameters<typeof matchesMentorPortfolioSegment>[1]>={})=>({
  status:"ACTIVE",blocker:null,attentionKinds:new Set<string>(),
  hasFinalSubmission:false,planFullyDelivered:false,...overrides,
});
describe("Mentor portfolio prototype status chips",()=>{
  it("separates current from archived teams without inferring hidden records",()=>{
    const archived=facts({status:"ARCHIVED",attentionKinds:new Set(["REVIEW"]),
      hasFinalSubmission:true});
    expect(matchesMentorPortfolioSegment("CURRENT",facts())).toBe(true);
    expect(matchesMentorPortfolioSegment("CURRENT",archived)).toBe(false);
    expect(matchesMentorPortfolioSegment("ARCHIVED",archived)).toBe(true);
    for(const selected of ["NEEDS_YOU","AT_RISK","FINAL_SUBMISSION"] as const)
      expect(matchesMentorPortfolioSegment(selected,archived)).toBe(false);
    expect(matchesMentorPortfolioSegment(undefined,archived)).toBe(true);
  });

  it("needs a recorded actionable event, not merely an upcoming meeting",()=>{
    for(const kind of ["REVIEW","TASK_REVIEW","TASK_BLOCKED",
      "SPRINT_SIGN_OFF","REQUESTED","UNASSIGNED_NEXT"]){
      expect(matchesMentorPortfolioSegment("NEEDS_YOU",facts({
        attentionKinds:new Set([kind]),
      })),kind).toBe(true);
    }
    expect(matchesMentorPortfolioSegment("NEEDS_YOU",facts({
      attentionKinds:new Set(["MEETING_SOON"]),
    }))).toBe(false);
    expect(matchesMentorPortfolioSegment("NEEDS_YOU",facts())).toBe(false);
  });

  it("uses saved blocker, stall or blocked task for at-risk state",()=>{
    expect(matchesMentorPortfolioSegment("AT_RISK",facts({blocker:" Waiting on API " }))).toBe(true);
    expect(matchesMentorPortfolioSegment("AT_RISK",facts({blocker:"   "}))).toBe(false);
    expect(matchesMentorPortfolioSegment("AT_RISK",facts({
      attentionKinds:new Set(["STALLED"]),
    }))).toBe(true);
    expect(matchesMentorPortfolioSegment("AT_RISK",facts({
      attentionKinds:new Set(["TASK_BLOCKED"]),
    }))).toBe(true);
  });

  it("includes saved final-delivery drafts and genuinely shipped/sign-off plans only",()=>{
    expect(matchesMentorPortfolioSegment("FINAL_SUBMISSION",facts({
      hasFinalSubmission:true,
    }))).toBe(true);
    expect(matchesMentorPortfolioSegment("FINAL_SUBMISSION",facts({
      planFullyDelivered:true,
    }))).toBe(true);
    expect(matchesMentorPortfolioSegment("FINAL_SUBMISSION",facts())).toBe(false);
    expect(matchesMentorPortfolioSegment("FINAL_SUBMISSION",facts({
      status:"PLANNED",
    }))).toBe(false);
  });

  it("does not lose search/sort or carry conflicting status and cursor on chip change",()=>{
    const href=mentorPortfolioSegmentHref("FINAL_SUBMISSION",{
      search:"test API",assignment:"PRIMARY",sort:"TITLE",pageSize:50,
      work:"HAS_OPEN_TASKS",
    });
    const url=new URL(href,"https://example.edu");
    expect(url.pathname).toBe("/mentor/projects");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      segment:"FINAL_SUBMISSION",search:"test API",assignment:"PRIMARY",
      work:"HAS_OPEN_TASKS",sort:"TITLE",pageSize:"50",
    });
    expect(mentorPortfolioSegmentHref(undefined,{})).toBe("/mentor/projects");
  });

  it("validates the segment and rejects duplicate selectors instead of guessing one",()=>{
    const valid=singleValueMentorFilters({segment:"AT_RISK",search:"A"});
    expect(mentorProjectListQuerySchema.parse(valid).segment).toBe("AT_RISK");
    expect(mentorProjectListQuerySchema.safeParse({segment:"CROSS_COLLEGE"}).success)
      .toBe(false);
    expect(singleValueMentorFilters({segment:["CURRENT","ARCHIVED"]})).toBeNull();
  });
});
