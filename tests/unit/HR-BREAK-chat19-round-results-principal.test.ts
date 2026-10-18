import {beforeEach, describe, expect, it, vi} from "vitest";
import {isValidElement, type ReactNode} from "react";

const deps=vi.hoisted(()=>({
  context:vi.fn(),jobs:vi.fn(),workspace:vi.fn(),redirect:vi.fn(),notFound:vi.fn(),
}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:deps.context}));
vi.mock("@/modules/placements/recruiter-service",()=>({listOwnRecruiterPlacementJobs:deps.jobs}));
vi.mock("@/modules/placements/recruiter-workspace-service",()=>({getRecruiterPlacementWorkspace:deps.workspace}));
vi.mock("next/navigation",()=>({redirect:deps.redirect,notFound:deps.notFound}));

import HrRoundResultsPage from "@/app/(authenticated)/hr/round-results/page";

const jobId="11111111-1111-4111-8111-111111111111";
const roundId="22222222-2222-4222-8222-222222222222";
const principal={
  user:{id:"recruiter-a",identityUid:"auth-a",platformStatus:"ACTIVE",systemRoles:[]},
  membership:null,
  recruiter:{userId:"recruiter-a",status:"ACTIVE",companyId:"employer-a",
    companyName:"Employer A",title:null,grants:[]},
};
type Action={href:string;className:string};
function collect(node:ReactNode,words:string[],actions:Action[]):void{
  if(Array.isArray(node)){for(const child of node)collect(child,words,actions);return;}
  if(typeof node==="string"||typeof node==="number"){words.push(String(node));return;}
  if(!isValidElement(node))return;
  const p=node.props as {children?:ReactNode;title?:ReactNode;description?:ReactNode;
    action?:ReactNode;href?:unknown;className?:unknown};
  if(typeof p.href==="string"&&typeof p.className==="string")
    actions.push({href:p.href,className:p.className});
  for(const child of [p.title,p.description,p.action,p.children])
    collect(child,words,actions);
}
function inspect(node:ReactNode){
  const words:string[]=[],actions:Action[]=[];
  collect(node,words,actions);
  return {text:words.join(" "),actions};
}

describe("HR-BREAK-ROUND-PRINCIPAL-26 and UX-hr-round-results-02 page journey",()=>{
  beforeEach(()=>{
    vi.resetAllMocks();
    deps.redirect.mockImplementation((path:string)=>{throw new Error("REDIRECT "+path);});
    deps.notFound.mockImplementation(()=>{throw new Error("NOT_FOUND");});
    deps.context.mockResolvedValue(principal);
  });

  it("HR-BREAK-ROUND-PRINCIPAL-26 denies recruiter identity mismatch before private reads",async()=>{
    deps.context.mockResolvedValue({...principal,recruiter:{...principal.recruiter,userId:"different-user"}});
    await expect(HrRoundResultsPage({searchParams:Promise.resolve({})}))
      .rejects.toThrow("REDIRECT /dashboard");
    expect(deps.jobs).not.toHaveBeenCalled();
    expect(deps.workspace).not.toHaveBeenCalled();
  });

  it("HR-BREAK-ROUND-PRINCIPAL-26 rejects suspended account before private reads",async()=>{
    deps.context.mockResolvedValue({...principal,user:{...principal.user,platformStatus:"SUSPENDED"}});
    await expect(HrRoundResultsPage({searchParams:Promise.resolve({jobId})}))
      .rejects.toThrow("REDIRECT /dashboard");
    expect(deps.workspace).not.toHaveBeenCalled();
  });

  it.each([{jobId:[jobId,roundId]},{outcome:["PASS","FAIL"]},
    {jobId:"invalid-id"},{outcome:"FOREIGN"}])(
    "UX-hr-round-results-02 recovers from unsafe or repeated filters %j without private reads",
    async filters=>{
      const output=inspect(await HrRoundResultsPage({searchParams:Promise.resolve(filters)}));
      expect(output.text).toContain("Invalid round filters");
      expect(output.actions).toEqual(expect.arrayContaining([
        expect.objectContaining({href:"/hr/round-results"}),
      ]));
      expect(deps.jobs).not.toHaveBeenCalled();
      expect(deps.workspace).not.toHaveBeenCalled();
    },
  );

  it("UX-hr-round-results-02 renders honest no-drives state for authorized recruiter",async()=>{
    deps.jobs.mockResolvedValue([]);
    const output=inspect(await HrRoundResultsPage({searchParams:Promise.resolve({})}));
    expect(output.text).toContain("No hiring drives");
    expect(deps.jobs).toHaveBeenCalledWith(principal);
    expect(deps.workspace).not.toHaveBeenCalled();
  });

  it("UX-hr-round-results-02 keeps filter and round actions accessible on phones",async()=>{
    deps.workspace.mockResolvedValue({
      job:{id:jobId,title:"Software engineer"},
      company:{name:"Employer A"},college:{name:"College A"},
      rounds:[{id:roundId,name:"Technical round",sequence:1,kind:"EVALUATION",
        status:"APPLIED",participants:[{applicationId:"application-a",
          displayName:"Shared candidate",result:{status:"APPLIED",outcome:"PASS",
            scorePercent:88,waitlistRank:null}}]}],
    });
    const output=inspect(await HrRoundResultsPage({
      searchParams:Promise.resolve({jobId,roundId,outcome:"PASS"}),
    }));
    expect(output.text).toContain("Shared candidate");
    expect(output.text).toContain("Score: ");
    expect(deps.workspace).toHaveBeenCalledWith(principal,jobId);
    const targets=output.actions.filter(action=>
      action.href.startsWith("/hr/round-results?") ||
      action.href.includes("?tab=rounds") ||
      action.href==="/hr/round-results");
    expect(targets.length).toBeGreaterThanOrEqual(10);
    for(const action of targets){
      expect(action.className).toContain("min-h-11");
      expect(action.className).toContain("focus-visible:outline-2");
    }
  });
});
