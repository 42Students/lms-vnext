import {beforeEach,describe,expect,it,vi} from "vitest";
const m=vi.hoisted(()=>({ctx:vi.fn(),origin:vi.fn(),edit:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:m.ctx}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:m.origin}));
vi.mock("@/modules/placements/hr-round-editor-service",()=>({editHrJobRound:m.edit}));
import {POST} from "@/app/api/placements/recruiter/drives/[jobId]/rounds/route";
import {PlacementsServiceError} from "@/modules/placements/errors";

const jobId="123e4567-e89b-42d3-a456-426614174001";
const roundId="123e4567-e89b-42d3-a456-426614174002";
const actor={user:{id:"owner",platformStatus:"ACTIVE"}};
const request=(fields:Record<string,string>)=>new Request(
 "https://lms.example/api/placements/recruiter/drives/"+jobId+"/rounds",{
 method:"POST",body:new URLSearchParams(fields),
});
const post=(fields:Record<string,string>)=>POST(request(fields),{
 params:Promise.resolve({jobId}),
});
describe("HR-ROUND-API-73: recruiter round command HTTP boundaries",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();m.origin.mockReturnValue(true);m.ctx.mockResolvedValue(actor);
  m.edit.mockResolvedValue({id:roundId,action:"CREATED"});
 });
 it("rejects cross-origin request before form read, actor lookup or DB mutation",async()=>{
  m.origin.mockReturnValue(false);
  const response=await post({action:"CREATE",kind:"TEST",name:"Interview"});
  expect(response.status).toBe(403);
  expect(m.ctx).not.toHaveBeenCalled();
  expect(m.edit).not.toHaveBeenCalled();
 });
 it("invalid or forged round fields never reach the database service",async()=>{
  for(const fields of [
   {action:"CREATE",kind:"TEST",name:""},
   {action:"REMOVE",roundId},
   {action:"UPDATE",roundId,expectedUpdatedAt:"2099-01-01T00:00:00Z",name:""},
   {action:"CREATE",kind:"UNSUPPORTED",name:"Round"},
   {action:"CREATE",kind:"TEST",name:"Round",durationMinutes:"0"},
  ]){
   const result=await post(fields);
   expect(result.status).toBe(400);
  }
  expect(m.edit).not.toHaveBeenCalled();
 });
 it("authorized create redirects to the exact job round editor without leaking candidate results",async()=>{
  const result=await post({action:"CREATE",kind:"TEST",name:"Stage one"});
  expect(result.status).toBe(303);
  expect(result.headers.get("location")).toBe(
   "https://lms.example/recruiter/drives/"+jobId+"/rounds/editor?changed=CREATED");
  expect(m.edit).toHaveBeenCalledWith(actor,jobId,expect.objectContaining({
   action:"CREATE",kind:"TEST",name:"Stage one",
  }));
 });
 it("stale version and used-round conflict return 409 without false success redirect",async()=>{
  m.edit.mockRejectedValue(new PlacementsServiceError("PLACEMENT_ROUND_STALE"));
  const result=await post({action:"UPDATE",roundId,
   expectedUpdatedAt:"2099-01-01T00:00:00.000Z",name:"Changed"});
  expect(result.status).toBe(409);
  expect(await result.json()).toMatchObject({error:"STALE_OR_USED_ROUND"});
  expect(result.headers.get("location")).toBeNull();
 });
 it("a foreign or deleted round maps to non-enumerating 404",async()=>{
  m.edit.mockRejectedValue(new PlacementsServiceError("PLACEMENT_ROUND_NOT_FOUND"));
  const result=await post({action:"REMOVE",roundId,expectedUpdatedAt:"2099-01-01T00:00:00.000Z"});
  expect(result.status).toBe(404);
  expect(await result.json()).toMatchObject({error:"NOT_FOUND"});
 });
});
