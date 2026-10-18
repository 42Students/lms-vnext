import {describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import type {ComponentProps} from "react";

vi.mock("@/components/placements/tpo-round-check-in",()=>({
  TpoRoundCheckIn:({displayName}:{displayName:string})=>
    <button type="button" data-action="check-in">{displayName} · Check in</button>,
}));
vi.mock("@/components/placements/tpo-round-result-recorder",()=>({
  TpoRoundResultRecorder:()=> <button type="button" data-action="stage-result">Stage result</button>,
}));
vi.mock("@/components/placements/tpo-bulk-round-result-recorder",()=>({
  TpoBulkRoundResultRecorder:()=> <button type="button" data-action="bulk-stage">Bulk stage</button>,
}));
import {TpoRoundDriveDayReadOnly} from "@/components/placements/tpo-round-drive-day-read-only";

type RoundData=ComponentProps<typeof TpoRoundDriveDayReadOnly>["data"];
const jobId="11111111-1111-4111-8111-111111111111";
const roundId="22222222-2222-4222-8222-222222222222";
const fixture=():RoundData=>({
  companyName:"College-verified employer",
  job:{id:jobId,title:"Software Engineer"},
  round:{id:roundId,name:"Technical interview",kind:"INTERVIEW",
    status:"IN_PROGRESS",scheduledAt:null,venue:null},
  counts:{total:1,waiting:0,present:1,inInterview:0,done:0,
    absent:0,stagedResults:0,appliedResults:0,unknownAttendance:0,noResult:1},
  rows:[{
    applicationId:"33333333-3333-4333-8333-333333333333",
    displayName:"Authorized learner",rollNumber:"IITD-42",
    applicationStatus:"SUBMITTED",attendance:"PRESENT",
    resultStatus:null,resultOutcome:null,
  }],
} as unknown as RoundData);
describe("UX-SPILL-TPO-ROUND-01: responsive IIT Dharwad roster keeps critical operator actions",()=>{
  it("shows candidate identity and both check-in/result actions on mobile cards and desktop columns",()=>{
    const html=renderToStaticMarkup(<TpoRoundDriveDayReadOnly data={fixture()}/>);
    expect(html).toContain('data-slot="data-table"');
    expect(html).toContain("Applicants in this round");
    expect(html).toContain("Authorized learner");
    expect(html).toContain("IITD-42");
    expect(html).toContain("Roll number");
    expect(html).toContain("Round attendance");
    expect(html).toContain("Latest result");
    expect(html).toContain('data-action="check-in"');
    expect(html).toContain('data-action="stage-result"');
    expect(html).toContain('data-action="bulk-stage"');
    expect(html).toContain("No result recorded");
    expect(html).not.toContain("min-w-[46rem]");
    expect(html).not.toContain("scroll horizontally for more columns");
  });
  it("preserves a clear empty roster without fabricating an applicant or stage result",()=>{
    const data=fixture();
    const html=renderToStaticMarkup(<TpoRoundDriveDayReadOnly data={{...data,rows:[]}}/>);
    expect(html).toContain("No eligible applicants currently appear");
    expect(html).not.toContain("Authorized learner");
    expect(html).not.toContain('data-action="check-in"');
    expect(html).not.toContain('data-action="stage-result"');
  });
});
