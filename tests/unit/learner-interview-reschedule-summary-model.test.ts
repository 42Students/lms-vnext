import {describe,expect,it} from "vitest";
import {learnerInterviewRescheduleSummary} from "@/modules/placements/learner-interview-reschedule-summary-model";
const input={
companyName:"Aster",roleTitle:"Engineer",roundName:"Interview",
originalScheduledAt:"2026-10-16T08:00:00Z",
approvedScheduledAt:"2026-10-16T18:45:00Z",
mode:"VIRTUAL" as const,venue:null,
};
describe("copyable approved learner interview reschedule",()=>{
it("shows original and approved IST times and omits private URL",()=>{
const result=learnerInterviewRescheduleSummary(input)!;
expect(result.approved).toContain("17 Oct");
expect(result.previous).toContain("16 Oct");
expect(result.copyText).toContain("personal schedule summary");
expect(result.copyText).not.toContain("https://");
});
it("shows nothing before approval and rejects caller-controlled actor keys",()=>{
expect(learnerInterviewRescheduleSummary({...input,approvedScheduledAt:null})).toBeNull();
expect(()=>learnerInterviewRescheduleSummary({...input,collegeId:"forged"} as unknown as typeof input)).toThrow();
});
});