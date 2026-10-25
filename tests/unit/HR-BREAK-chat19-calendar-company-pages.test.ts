import {beforeEach,describe,expect,it,vi} from "vitest";
import {isValidElement,type ReactNode} from "react";
import type {RequestContext} from "@/modules/identity/context";
const m=vi.hoisted(()=>({ctx:vi.fn(),calendar:vi.fn(),team:vi.fn(),
 jobs:vi.fn(),counts:vi.fn(),redirect:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:m.ctx}));
vi.mock("@/modules/placements/recruiter-calendar-service",()=>({listRecruiterCalendarEvents:m.calendar}));
vi.mock("@/modules/placements/recruiter-company-team-service",()=>({getRecruiterCompanyTeam:m.team}));
vi.mock("@/modules/placements/recruiter-service",()=>({listOwnRecruiterPlacementJobs:m.jobs}));
vi.mock("@/modules/placements/recruiter-team-drive-count-service",()=>({recruiterTeamAttributedDriveCounts:m.counts}));
vi.mock("next/navigation",()=>({redirect:m.redirect}));
import HrCalendarPage from "@/app/(authenticated)/hr/calendar/page";
import HrCompanyPage from "@/app/(authenticated)/hr/company/page";

const college="11111111-1111-4111-8111-111111111111";
const actor:RequestContext={
 user:{id:"recruiter",identityUid:"identity",platformStatus:"ACTIVE",systemRoles:[]},
 membership:null,recruiter:{userId:"recruiter",companyId:"employer",companyName:"Employer",
  title:null,status:"ACTIVE",grants:[{id:"grant",collegeId:college,organizationId:"org",
   collegeName:"College A",companyRelationshipId:"rel"}]},
};
const calendar=(q:Record<string,unknown>={})=>HrCalendarPage({searchParams:Promise.resolve(q) as never});
const company=(q:Record<string,unknown>={})=>HrCompanyPage({searchParams:Promise.resolve(q) as never});
function readText(n:ReactNode):string{
 if(Array.isArray(n))return n.map(readText).join(" ");
 if(typeof n==="number"||typeof n==="string")return String(n);
 if(!isValidElement(n))return "";
 const p=n.props as {title?:string;description?:string;children?:ReactNode};
 return [p.title??"",p.description??"",readText(p.children)].join(" ");
}
describe("HR-BREAK-chat19-calendar-company: account-deny and stable navigation",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();m.ctx.mockResolvedValue(actor);
  m.calendar.mockResolvedValue({events:[],resultsDue:[],days:[],summary:{rounds:0,deadlines:0},authorizedJobCount:0});
  m.team.mockResolvedValue({status:"NO_ACCESS",choices:[]});
  m.redirect.mockImplementation(()=>{throw new Error("REDIRECT");});
 });
 it("expired and revoked recruiters cannot reach calendar or company team reads",async()=>{
  m.ctx.mockResolvedValue({...actor,user:{...actor.user,platformStatus:"DISABLED"}});
  await expect(calendar()).rejects.toThrow("REDIRECT");
  await expect(company()).rejects.toThrow("REDIRECT");
  m.ctx.mockResolvedValue({...actor,recruiter:null});
  await expect(calendar()).rejects.toThrow("REDIRECT");
  await expect(company()).rejects.toThrow("REDIRECT");
  expect(m.calendar).not.toHaveBeenCalled();
  expect(m.team).not.toHaveBeenCalled();
 });
 it("malformed calendar day, view and category use bounded fallback rather than DB exceptions",async()=>{
  await calendar({date:"2026-99-99",view:"admin",category:"PRIVATE"});
  expect(m.calendar).toHaveBeenCalledWith(actor,expect.objectContaining({
   from:expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
   to:expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
  }),college);
 });
 it.each([
  {date:["2026-10-18","2026-10-19"]},
  {view:["week","month"]},
  {category:["ALL","PRIVATE"]},
 ])("refuses repeated calendar filters %j without reading authorized events",async raw=>{
  const rendered=await calendar(raw);
  expect(readText(rendered)).toContain("Invalid calendar filters");
  expect(m.calendar).not.toHaveBeenCalled();
 });
 it("calendar blocks a stale recruiter identity before even reading event aggregates",async()=>{
  m.ctx.mockResolvedValue({...actor,recruiter:{...actor.recruiter!,userId:"another-person"}});
  await expect(calendar()).rejects.toThrow("REDIRECT");
  expect(m.calendar).not.toHaveBeenCalled();
 });
 it("no active grant displays explicit calendar recovery even if event feed is empty",async()=>{
  m.ctx.mockResolvedValue({...actor,recruiter:{...actor.recruiter!,grants:[]}});
  const result=await calendar({view:"agenda"});
  expect(readText(result)).toMatch(/college access|college/i);
  expect(m.calendar).toHaveBeenCalledOnce();
 });
 it.each([{collegeId:"not-uuid"},{q:"x".repeat(121)},{teamPage:"0"}])(
  "invalid company view %j prevents roster query",async query=>{
   expect(readText(await company(query))).toMatch(/Invalid college selection|Invalid team filter/);
   expect(m.team).not.toHaveBeenCalled();
  });
 it.each([
  {collegeId:[college,"22222222-2222-4222-8222-222222222222"]},
  {collegeId:[college,college]},
  {tab:["company","reports"]},
  {q:["safe","forged"]},
  {teamPage:["1","100"]},
 ])("does not silently accept repeated company/team query values %j",async query=>{
  expect(readText(await company(query))).toContain("Invalid college selection");
  expect(m.team).not.toHaveBeenCalled();
  expect(m.jobs).not.toHaveBeenCalled();
 });
 it("company/team rejects recruiter identity belonging to another logged-in account",async()=>{
  m.ctx.mockResolvedValue({...actor,recruiter:{...actor.recruiter!,userId:"another-recruiter"}});
  await expect(company()).rejects.toThrow("REDIRECT");
  expect(m.team).not.toHaveBeenCalled();
  expect(m.jobs).not.toHaveBeenCalled();
 });
 it("retired Reports tab redirects to company-scoped reporting without reading team data",async()=>{
  await expect(company({collegeId:college,tab:"reports"})).rejects.toThrow("REDIRECT");
  expect(m.redirect).toHaveBeenCalledWith("/hr/company/reports?collegeId="+college);
  expect(m.team).not.toHaveBeenCalled();
 });
 it("no grants provides clear company access recovery without roster/drive reads",async()=>{
  const result=await company();
  expect(readText(result)).toContain("no active college session");
  // The current company page requests the verified full Team response even
  // when no college is selected; NO_ACCESS still blocks drive/team reads.
  expect(m.team).toHaveBeenCalledWith(actor,null,true);
  expect(m.jobs).not.toHaveBeenCalled();
  expect(m.counts).not.toHaveBeenCalled();
 });
});
