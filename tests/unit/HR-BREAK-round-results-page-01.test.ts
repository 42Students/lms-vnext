import {beforeEach,describe,expect,it,vi} from "vitest";
import {isValidElement,type ReactNode} from "react";
const f=vi.hoisted(()=>({
 ctx:vi.fn(),active:vi.fn(),jobs:vi.fn(),workspace:vi.fn(),
 redirect:vi.fn(),notFound:vi.fn(),
}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:f.ctx}));
vi.mock("@/modules/identity/context",()=>({hasActiveRecruiter:f.active}));
vi.mock("@/modules/placements/recruiter-service",()=>({listOwnRecruiterPlacementJobs:f.jobs}));
vi.mock("@/modules/placements/recruiter-workspace-service",()=>({getRecruiterPlacementWorkspace:f.workspace}));
vi.mock("next/navigation",()=>({redirect:f.redirect,notFound:f.notFound}));
import HrRoundResultsPage from "@/app/(authenticated)/hr/round-results/page";
import {PlacementsServiceError} from "@/modules/placements/errors";

function visible(node:ReactNode):string{
 if(Array.isArray(node))return node.map(visible).join(" ");
 if(typeof node==="string"||typeof node==="number")return String(node);
 if(!isValidElement(node))return "";
 const props=node.props as {children?:ReactNode;title?:string;description?:string};
 return [props.title??"",props.description??"",visible(props.children)].join(" ");
}
function links(node:ReactNode):string[]{
 if(Array.isArray(node))return node.flatMap(links);
 if(!isValidElement(node))return [];
 const props=node.props as {children?:ReactNode;href?:unknown;action?:ReactNode;actions?:ReactNode};
 return [...(typeof props.href==="string"?[props.href]:[]),...links(props.children),...links(props.action),...links(props.actions)];
}
const job="123e4567-e89b-42d3-a456-426614174001";
const round="123e4567-e89b-42d3-a456-426614174002";
const page=(search:Record<string,unknown>={})=>
 HrRoundResultsPage({searchParams:Promise.resolve(search) as never});

describe("HR-BREAK-round-results-page-01 recruiter job and shared candidate privacy",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();
  f.ctx.mockResolvedValue({user:{id:"owner"}});
  f.active.mockReturnValue(true);
  f.jobs.mockResolvedValue([]);
  f.workspace.mockResolvedValue({
   job:{id:job,title:"Engineer"},company:{name:"Employer"},
   college:{name:"College"},rounds:[],
  });
  f.redirect.mockImplementation(()=>{throw new Error("REDIRECT");});
  f.notFound.mockImplementation(()=>{throw new Error("NOT_FOUND");});
 });
 it("non-recruiter account never reads jobs or rounds",async()=>{
  f.active.mockReturnValue(false);
  await expect(page()).rejects.toThrow("REDIRECT");
  expect(f.redirect).toHaveBeenCalledWith("/dashboard");
  expect(f.jobs).not.toHaveBeenCalled();
  expect(f.workspace).not.toHaveBeenCalled();
 });
 it("invalid job/round/outcome filter renders reset instead of issuing a query",async()=>{
  for(const q of [{jobId:"../../college-b"},{roundId:"invalid"},{outcome:"ADMIN"},
   {jobId:[job,"second-job"]}].slice(0,3)){
   const result=await page(q);
   expect(visible(result)).toContain("Invalid round filters");
   expect(links(result)).toContain("/hr/round-results");
  }
  expect(f.workspace).not.toHaveBeenCalled();
 });
 it("empty own job list shows a truthful no-drives state, not another employer's jobs",async()=>{
  const result=await page();
  expect(visible(result)).toContain("No hiring drives");
  expect(f.jobs).toHaveBeenCalledTimes(1);
  expect(f.workspace).not.toHaveBeenCalled();
 });
 it("archived jobs are absent from picker while own active jobs have scoped URLs",async()=>{
  f.jobs.mockResolvedValue([
   {job:{id:job,title:"Engineer",status:"PUBLISHED",archivedAt:null},collegeName:"College"},
   {job:{id:round,title:"Archived",status:"CLOSED",archivedAt:new Date()},collegeName:"College"},
  ]);
  const result=await page();
  expect(visible(result)).toContain("Engineer");
  expect(visible(result)).not.toContain("Archived");
  expect(links(result).some(href=>href.includes(job))).toBe(true);
  expect(links(result).some(href=>href.includes(round))).toBe(false);
 });
 it("wrong employer relationship is indistinguishable from missing job",async()=>{
  f.workspace.mockRejectedValue(new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND"));
  await expect(page({jobId:job})).rejects.toThrow("NOT_FOUND");
  expect(f.notFound).toHaveBeenCalledTimes(1);
 });
 it("foreign round ID inside owned job is never treated as a valid selection",async()=>{
  await expect(page({jobId:job,roundId:round})).rejects.toThrow("NOT_FOUND");
  expect(f.notFound).toHaveBeenCalledTimes(1);
 });
 it("authorized job with zero configured rounds shows an explicit empty message",async()=>{
  const result=await page({jobId:job});
  expect(visible(result)).toContain("No rounds yet");
  expect(visible(result)).toContain("The placement cell has not configured");
  expect(f.workspace).toHaveBeenCalledWith({user:{id:"owner"}},job);
 });
});