import {beforeEach,describe,expect,it,vi} from "vitest";
import {isValidElement,type ReactNode} from "react";
const m=vi.hoisted(()=>({ctx:vi.fn(),read:vi.fn(),notFound:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:m.ctx}));
vi.mock("@/modules/placements/tpo-drive-change-request-service",()=>({
 getDriveChangeRequests:m.read,
}));
vi.mock("next/navigation",()=>({notFound:m.notFound}));
import RecruiterChangeRequestsPage from "@/app/(authenticated)/recruiter/drives/[jobId]/change-requests/page";
import {PlacementsServiceError} from "@/modules/placements/errors";

const id="123e4567-e89b-42d3-a456-426614174001";
const actor={user:{id:"recruiter",platformStatus:"ACTIVE"},recruiter:{status:"ACTIVE"}};
const render=()=>RecruiterChangeRequestsPage({params:Promise.resolve({jobId:id})});
function text(node:ReactNode):string{
 if(Array.isArray(node))return node.map(text).join(" ");
 if(typeof node==="string"||typeof node==="number")return String(node);
 if(!isValidElement(node))return "";
 const p=node.props as {title?:string;description?:string;children?:ReactNode};
 return [p.title??"",p.description??"",text(p.children)].join(" ");
}
function hrefs(node:ReactNode):string[]{
 if(Array.isArray(node))return node.flatMap(hrefs);
 if(!isValidElement(node))return [];
 const p=node.props as {href?:string;children?:ReactNode;actions?:ReactNode};
 return [...(p.href?[p.href]:[]),...hrefs(p.actions),...hrefs(p.children)];
}
describe("HR-RECRUITER-PAGE-68: scoped drive change-request page",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();m.ctx.mockResolvedValue(actor);
  m.notFound.mockImplementation(()=>{throw new Error("NOT_FOUND");});
  m.read.mockResolvedValue({party:"COMPANY",storageReady:false,
   pendingMessage:"Requests unavailable.",job:{title:"Engineering"},requests:[]});
 });
 it("never renders TPO-only change controls for a page resolved as college party",async()=>{
  m.read.mockResolvedValue({party:"COLLEGE",storageReady:true,requests:[],job:{title:"Private"}});
  await expect(render()).rejects.toThrow("NOT_FOUND");
  expect(m.read).toHaveBeenCalledWith(actor,id);
 });
 it("does not disclose another college job on a not-found access error",async()=>{
  m.read.mockRejectedValue(new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND"));
  await expect(render()).rejects.toThrow("NOT_FOUND");
 });
 it("unregistered storage is presented as a truthful unavailable state, not silent success",async()=>{
  const node=await render();
  expect(text(node)).toContain("The college cannot receive changes here until registration is complete.");
  expect(text(node)).toContain("Requests unavailable.");
  expect(hrefs(node)).toContain("/recruiter/drives/"+id);
  expect(text(node)).not.toContain("Request sent");
 });
 it("authorized employer gets a populated component without changing party or acting identity",async()=>{
  m.read.mockResolvedValue({party:"COMPANY",storageReady:true,
   job:{title:"Engineering"},requests:[{id:"request-one"}]});
  const node=await render();
  expect(text(node)).toContain("Engineering · Change requests");
  expect(m.read).toHaveBeenCalledTimes(1);
  expect(JSON.stringify(node)).toContain('"party":"COMPANY"');
 });
});
