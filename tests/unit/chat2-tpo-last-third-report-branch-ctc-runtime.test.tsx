import {beforeEach,describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";

const state=vi.hoisted(()=>({
  context:vi.fn(),workspace:vi.fn(),details:vi.fn(),roleAllowed:true,
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
  hasMembershipRole:(_ctx:unknown,role:string)=>state.roleAllowed && role==="TPO",
}));
vi.mock("@/modules/placements/report-service",()=>({
  getPlacementReportWorkspace:state.workspace,
  getPlacementReportDetails:state.details,
}));
vi.mock("@/components/placements/tpo-report-invalid-filters",async()=>{
  const {createElement}=await import("react");
  return {TpoReportInvalidFilters:({path}:{path:string})=>
    createElement("section",{role:"alert"},
      createElement("a",{href:path},"Clear filters"))};
});
vi.mock("@/components/placements/tpo-report-presentation",async()=>{
  const {createElement}=await import("react");
  return {TpoReportPresentation:()=>createElement("div",{"data-testid":"presentation"})};
});
vi.mock("@/components/placements/tpo-report-saved-filters",async()=>{
  const {createElement}=await import("react");
  return {TpoReportSavedFilters:()=>createElement("div",{},"Saved filters")};
});
vi.mock("@/components/placements/report-bar-chart",async()=>{
  const {createElement}=await import("react");
  return {ReportBarChart:({title}:{title:string})=>createElement("div",{role:"img","aria-label":title})};
});
vi.mock("@/components/placements/placement-report-ui",async()=>{
  const {createElement}=await import("react");
  const plain=({children}:{children?:import("react").ReactNode})=>createElement("div",{},children);
  return {
    ReportCsvLink:()=>createElement("a",{href:"/tpo/reports/export"},"Export CSV"),
    ReportFilters:plain,ReportNavigation:plain,ReportMetrics:plain,ReportScopeNote:plain,
    ReportTable:({title,rows,emptyDescription}:{
      title:string;rows:readonly (readonly unknown[])[];emptyDescription:string;
    })=>createElement("section",{"aria-label":title},
      createElement("h2",{},title),
      rows.length ? rows.map((row,index)=>createElement("p",{key:index},row.join(" | "))) :
        createElement("p",{},emptyDescription)),
    reportCurrency:(v:number|null|undefined)=>v==null?"Not recorded":"INR "+v,
    reportNumber:(v:number)=>String(v),
  };
});

import TpoByBranchReportPage from "@/app/(authenticated)/tpo/reports/by-branch/page";
import TpoCtcReportPage from "@/app/(authenticated)/tpo/reports/ctc/page";

const collegeId="11111111-1111-4111-8111-111111111111";
const seasonId="22222222-2222-4222-8222-222222222222";
const context={user:{id:"tpo-user"},membership:{collegeId}};
const base={
  selectedSeasonId:seasonId,selectedJobId:null,noSeason:false,
  report:{
    metrics:{
      studentsWithPackage:0,highestPackageInr:null,medianPackageInr:null,
      averagePackageInr:null,
    },
    byBranch:[] as unknown[],
  },
  registrationScopeNote:"No registration evidence available",
  detailScopeNote:"Only persisted accepted offers count",
  details:{ctc:{
    acceptedFullTimeOffers:0,knownCtcOffers:0,unknownCtcOffers:0,
    averageInr:null,medianInr:null,highestInr:null,
    bands:[] as {label:string;offers:number}[],
  }},
};
const params=(query:Record<string,string|string[]>={})=>({searchParams:Promise.resolve(query)});

describe("chat-2 last-third report runtime SSR contract: by-branch and CTC",()=>{
  beforeEach(()=>{
    vi.clearAllMocks();state.roleAllowed=true;
    state.context.mockResolvedValue(context);
    state.workspace.mockResolvedValue(base);
    state.details.mockResolvedValue(base);
  });

  it("TPO-last-third-report-01 denies learner/anonymous actors before touching any placement metrics",async()=>{
    for(const call of [TpoByBranchReportPage,TpoCtcReportPage]){
      state.context.mockResolvedValueOnce({...context,membership:null});
      await expect(call(params())).rejects.toThrow("NEXT_REDIRECT:/dashboard");
      state.roleAllowed=false;
      await expect(call(params())).rejects.toThrow("NEXT_REDIRECT:/dashboard");
      state.roleAllowed=true;
    }
    expect(state.workspace).not.toHaveBeenCalled();
    expect(state.details).not.toHaveBeenCalled();
  });

  it("TPO-last-third-report-02 rejects repeated season/job selectors before either scoped service executes",async()=>{
    for(const call of [TpoByBranchReportPage,TpoCtcReportPage]){
      const html=renderToStaticMarkup(await call(params({
        seasonId:[seasonId,seasonId],
      })));
      expect(html).toContain('role="alert"');
      expect(html).toContain("Clear filters");
    }
    expect(state.workspace).not.toHaveBeenCalled();
    expect(state.details).not.toHaveBeenCalled();
  });

  it("TPO-by-branch-03 shows truthful no-season empty state without inferring zero placement",async()=>{
    state.workspace.mockResolvedValueOnce({...base,noSeason:true});
    const html=renderToStaticMarkup(await TpoByBranchReportPage(params()));
    expect(state.workspace).toHaveBeenCalledWith(context,{
      collegeId,seasonId:undefined,jobId:undefined,
    });
    expect(html).toContain("By branch");
    expect(html).toContain("No placement season available");
    expect(html).toContain("Branch placement outcomes require a selected placement season");
    expect(html).not.toContain("Branch performance");
    expect(html).toContain("sm:px-6");
  });

  it("TPO-by-branch-04 renders recorded branch evidence and old heading with no fabricated package",async()=>{
    state.workspace.mockResolvedValueOnce({
      ...base,report:{...base.report,byBranch:[{
        departmentName:"Computer Science",registered:10,placed:2,placementRatePercent:20,
        offers:3,averagePackageInr:null,highestPackageInr:null,
        applicants:8,applications:9,acceptedOffers:2,
      }]},
    });
    const html=renderToStaticMarkup(await TpoByBranchReportPage(params({seasonId})));
    expect(state.workspace).toHaveBeenCalledWith(context,{collegeId,seasonId,jobId:undefined});
    expect(html).toContain("Branch performance");
    expect(html).toContain("Computer Science");
    expect(html).toContain("20%");
    expect(html).toContain("Placement rate by branch");
    expect(html).toContain("/tpo/reports/branch-season");
  });

  it("TPO-packages-05 keeps student-best-offer metrics distinct from offer histogram, including unknown CTC",async()=>{
    state.details.mockResolvedValueOnce({...base,details:{ctc:{
      acceptedFullTimeOffers:3,knownCtcOffers:2,unknownCtcOffers:1,
      averageInr:850000,medianInr:800000,highestInr:1000000,
      bands:[{label:"8–10 LPA",offers:2}],
    }}});
    const html=renderToStaticMarkup(await TpoCtcReportPage(params({seasonId})));
    expect(state.details).toHaveBeenCalledWith(context,{collegeId,seasonId,jobId:undefined});
    expect(html).toContain("Packages");
    expect(html).toContain("Offers without CTC");
    expect(html).toContain("Accepted full-time offers by annual package band");
    expect(html).toContain("8–10 LPA");
    expect(html).toContain("contributes twice");
    expect(html).toContain("sm:grid-cols-2");
  });

  it("TPO-packages-06 displays actual empty states and propagates backend faults to route recovery",async()=>{
    const html=renderToStaticMarkup(await TpoCtcReportPage(params()));
    expect(html).toContain("No compensation distribution is available.");
    expect(html).toContain("Only persisted accepted offers count");
    state.details.mockRejectedValueOnce(new Error("backend unavailable; secret=private"));
    await expect(TpoCtcReportPage(params())).rejects.toThrow("backend unavailable");
  });
});
