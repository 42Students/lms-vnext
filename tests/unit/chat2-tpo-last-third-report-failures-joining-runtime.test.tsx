import {beforeEach,describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
const state=vi.hoisted(()=>({
  context:vi.fn(),failure:vi.fn(),joining:vi.fn(),roleAllowed:true,
}));
vi.mock("next/navigation",()=>({
  redirect:(path:string)=>{throw new Error("NEXT_REDIRECT:"+path);},
}));
vi.mock("next/link",async()=>{
  const {createElement}=await import("react");
  return {default:({href,children}:{href:string;children:import("react").ReactNode})=>
    createElement("a",{href},children)};
});
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:state.context}));
vi.mock("@/modules/identity/context",()=>({
  hasMembershipRole:(_ctx:unknown,role:string)=>state.roleAllowed&&role==="TPO",
}));
vi.mock("@/modules/placements/report-extra-service",()=>({
  getPlacementFailureReasonsReport:state.failure,
  FAILURE_KIND_LABELS:{ROUND:"Round",SCREENING:"Screening",OFFER:"Offer",APPLICATION:"Application"},
}));
vi.mock("@/modules/placements/report-service",()=>({
  getPlacementReportDetails:state.joining,
}));
vi.mock("@/components/placements/tpo-report-invalid-filters",async()=>{
  const {createElement}=await import("react");
  return {TpoReportInvalidFilters:({path}:{path:string})=>
    createElement("section",{role:"alert"},createElement("a",{href:path},"Clear ambiguous filters"))};
});
vi.mock("@/components/placements/tpo-report-presentation",async()=>{
  const {createElement}=await import("react");
  return {TpoReportPresentation:()=>createElement("div",{},"Presentation")};
});
vi.mock("@/components/placements/tpo-report-saved-filters",async()=>{
  const {createElement}=await import("react");
  return {TpoReportSavedFilters:()=>createElement("div",{},"Saved filters")};
});
vi.mock("@/components/placements/tpo-report-record-links",async()=>{
  const {createElement}=await import("react");
  return {TpoReportRecordLinks:()=>createElement("nav",{},"Recorded evidence links")};
});
vi.mock("@/components/placements/report-bar-chart",async()=>{
  const {createElement}=await import("react");
  return {ReportBarChart:({title}:{title:string})=>
    createElement("div",{role:"img","aria-label":title})};
});
vi.mock("@/components/placements/placement-report-ui",async()=>{
  const {createElement}=await import("react");
  const plain=()=>createElement("div",{},"Report UI");
  return {
    ReportCsvLink:()=>createElement("a",{href:"/tpo/reports/export"},"Download CSV"),
    ReportFilters:plain,ReportNavigation:plain,
    ReportScopeNote:({note}:{note:string})=>createElement("p",{},note),
    ReportTable:({title,rows,emptyDescription}:{
      title:string;rows:readonly (readonly unknown[])[];emptyDescription:string;
    })=>createElement("section",{"aria-label":title},
      createElement("h2",{},title),
      rows.length?rows.map((row,index)=>createElement("p",{key:index},row.join(" / "))):
        createElement("p",{},emptyDescription)),
    reportNumber:(n:number)=>String(n),
  };
});

import TpoFailureReasonsPage from "@/app/(authenticated)/tpo/reports/failure-reasons/page";
import TpoJoiningStatusReportPage from "@/app/(authenticated)/tpo/reports/joining-status/page";

const collegeId="11111111-1111-4111-8111-111111111111";
const seasonId="22222222-2222-4222-8222-222222222222";
const context={user:{id:"tpo"},membership:{collegeId}};
const failureBase={
  selectedSeasonId:seasonId,selectedJobId:null,
  failures:{total:0,byKind:[],byReason:[],byDrive:[]},
  roundFailureShares:[],roundBranchFailureShares:[],
};
const joiningBase={
  selectedSeasonId:seasonId,selectedJobId:null,detailScopeNote:"No acceptance evidence means no joining outcome",
  details:{joining:{
    totals:{accepted:0,joined:0,deferred:0,didNotJoin:0,pending:0},
    byDrive:[],byCompany:[],
  }},
};
const params=(q:Record<string,string|string[]>={})=>({searchParams:Promise.resolve(q)});

describe("chat-2 last-third failure and joining outcome report pages",()=>{
  beforeEach(()=>{
    vi.clearAllMocks();state.roleAllowed=true;state.context.mockResolvedValue(context);
    state.failure.mockResolvedValue(failureBase);
    state.joining.mockResolvedValue(joiningBase);
  });

  it("TPO-failures-01 rejects absent membership and wrong role before any adverse outcome query",async()=>{
    for(const fn of [TpoFailureReasonsPage,TpoJoiningStatusReportPage]){
      state.context.mockResolvedValueOnce({...context,membership:null});
      await expect(fn(params())).rejects.toThrow("NEXT_REDIRECT:/dashboard");
      state.roleAllowed=false;
      await expect(fn(params())).rejects.toThrow("NEXT_REDIRECT:/dashboard");
      state.roleAllowed=true;
    }
    expect(state.failure).not.toHaveBeenCalled();
    expect(state.joining).not.toHaveBeenCalled();
  });

  it("TPO-failures-02 denies repeated job filters rather than silently using first supplied value",async()=>{
    for(const fn of [TpoFailureReasonsPage,TpoJoiningStatusReportPage]){
      const html=renderToStaticMarkup(await fn(params({jobId:[seasonId,seasonId]})));
      expect(html).toContain('role="alert"');
      expect(html).toContain("Clear ambiguous filters");
    }
    expect(state.failure).not.toHaveBeenCalled();
    expect(state.joining).not.toHaveBeenCalled();
  });

  it("TPO-failures-03 explains absent outcomes and denominator rather than treating missing decisions as rejections",async()=>{
    const html=renderToStaticMarkup(await TpoFailureReasonsPage(params()));
    expect(state.failure).toHaveBeenCalledWith(context,{
      collegeId,seasonId:undefined,jobId:undefined,
    });
    expect(html).toContain("Failure reasons");
    expect(html).toContain("No placement season or matching drive data is available");
    expect(html).toContain("No applied round decisions were recorded");
    expect(html).toContain("not a share of registered students");
    expect(html).toContain("No recorded adverse outcomes match");
    expect(html).toContain("min-h-11");
  });

  it("TPO-failures-04 reports only applied recorded evidence with explicit unknown branch",async()=>{
    state.failure.mockResolvedValueOnce({
      ...failureBase,failures:{
        total:2,
        byKind:[{kind:"ROUND",count:2}],
        byReason:[{kind:"ROUND",reason:"Insufficient score",count:2}],
        byDrive:[{jobTitle:"Engineer",companyName:"Test employer",kind:"ROUND",
          reason:"Insufficient score",count:2}],
      },
      failureScopeNote:"Current recorded decisions only",
      roundFailureShares:[{roundName:"Technical",failed:1,decisions:2,shareOfRoundPercent:50}],
      roundBranchFailureShares:[{roundName:"Technical",branchName:"Not recorded",
        failed:1,decisions:1,shareOfRoundPercent:100}],
    });
    const html=renderToStaticMarkup(await TpoFailureReasonsPage(params({seasonId})));
    expect(state.failure).toHaveBeenCalledWith(context,{collegeId,seasonId,jobId:undefined});
    expect(html).toContain("Current recorded decisions only");
    expect(html).toContain("Technical");
    expect(html).toContain("50%");
    expect(html).toContain("Not recorded");
    expect(html).toContain("Insufficient score");
    expect(html).toContain("Download round-and-branch failures CSV");
  });

  it("TPO-joining-05 distinguishes pending or unrecorded acceptance from did-not-join events",async()=>{
    const html=renderToStaticMarkup(await TpoJoiningStatusReportPage(params()));
    expect(state.joining).toHaveBeenCalledWith(context,{
      collegeId,seasonId:undefined,jobId:undefined,
    });
    expect(html).toContain("Joining outcomes");
    expect(html).toContain("Pending / unrecorded");
    expect(html).toContain("No currently accepted offers have joining outcomes");
    expect(html).toContain("No acceptance evidence means no joining outcome");
    expect(html).toContain("Review joining follow-ups");
    expect(html).toContain("sm:grid-cols-2");
  });

  it("TPO-joining-06 renders persisted company and drive counts without exposing student contact fields",async()=>{
    state.joining.mockResolvedValueOnce({...joiningBase,details:{joining:{
      totals:{accepted:5,joined:2,deferred:1,didNotJoin:0,pending:2},
      byDrive:[{label:"Campus job",companyName:"Acme",
        accepted:5,joined:2,deferred:1,didNotJoin:0,pending:2}],
      byCompany:[{label:"Acme",accepted:5,joined:2,deferred:1,didNotJoin:0,pending:2}],
    }}});
    const html=renderToStaticMarkup(await TpoJoiningStatusReportPage(params({seasonId})));
    expect(html).toContain("Campus job");
    expect(html).toContain("Acme");
    expect(html).toContain("Recorded evidence links");
    expect(html).not.toContain("@example.com");
    expect(html).not.toContain("+91");
  });

  it("TPO-last-third-report-07 propagates database failure to report error boundary instead of returning fabricated zeroes",async()=>{
    state.failure.mockRejectedValueOnce(new Error("db connection secret"));
    await expect(TpoFailureReasonsPage(params())).rejects.toThrow("db connection secret");
    state.joining.mockRejectedValueOnce(new Error("db connection secret"));
    await expect(TpoJoiningStatusReportPage(params())).rejects.toThrow("db connection secret");
  });
});
