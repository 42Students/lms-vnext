import {describe,expect,it} from "vitest";
import {learnerInterviewMobileSummary} from "@/modules/placements/learner-interview-mobile-model";
describe("mobile interview summary from authorized schedule",()=>{
  it("shows effective approved date in IST, never stale original date",()=>{
    const text=learnerInterviewMobileSummary({
      scheduledAt:"2026-10-16T08:00:00Z",approvedScheduledAt:"2026-10-16T18:45:00Z",
    });
    expect(text).toContain("Approved reschedule");
    expect(text).toContain("17 Oct");
    expect(text).toContain("IST");
  });
  it("does not treat missing schedule as attended or completed",()=>{
    expect(learnerInterviewMobileSummary({scheduledAt:null,approvedScheduledAt:null}))
      .toContain("Awaiting");
    expect(()=>learnerInterviewMobileSummary({scheduledAt:null,approvedScheduledAt:null,collegeId:"forged"}))
      .toThrow();
  });
});
