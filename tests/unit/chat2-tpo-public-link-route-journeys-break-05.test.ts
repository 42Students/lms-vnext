import {beforeEach,describe,expect,it,vi} from "vitest";
import {NextResponse} from "next/server";
const state=vi.hoisted(()=>({
 origin:vi.fn(),context:vi.fn(),error:vi.fn(),change:vi.fn(),toggle:vi.fn(),status:vi.fn(),
}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:state.origin}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:state.context}));
vi.mock("@/lib/api-error",()=>({apiErrorResponse:state.error}));
vi.mock("@/modules/placements/tpo-public-join-link-service",()=>({
 TpoPublicJoinLinkError:class TpoPublicJoinLinkError extends Error{},
 changeTpoPublicJoinLink:state.change,
 setTpoPublicJoinLinkEnabled:state.toggle,
 getTpoPublicJoinLinkStatus:state.status,
}));
import {POST as create} from "@/app/api/placements/tpo/public-join-links/route";
import {POST as enabled} from "@/app/api/placements/tpo/public-join-links/enabled/route";
import {GET as read} from "@/app/api/placements/tpo/public-join-links/status/route";

const id="00000000-0000-4000-8000-000000000001";
const actor={user:{id:"persisted-user"},membership:{id:"persisted-member",collegeId:"college-a"}};
const request=(method:string,data:unknown):Request=>new Request(
 "https://college.example/api/placements/tpo/public-join-links",{
 method,headers:{"Content-Type":"application/json"},
 ...(method==="GET"?{}:{body:JSON.stringify(data)}),
 });
beforeEach(()=>{
 for(const mock of Object.values(state))mock.mockReset();
 state.origin.mockReturnValue(true);
 state.context.mockResolvedValue(actor);
 state.error.mockImplementation(()=>NextResponse.json({
  error:"LINK_UNAVAILABLE",message:"Refresh the page and retry.",
 },{status:409}));
 state.change.mockResolvedValue({path:"/college-join/new-secret",status:{ready:true,link:{id}}});
 state.toggle.mockResolvedValue({enabled:false});
 state.status.mockResolvedValue({ready:true,domain:null,link:{id,enabled:false}});
});

describe("TPO-BREAK-public-link-05 actual route authorization and stale-token prevention",()=>{
 for(const action of [{name:"create or rotate",handle:create,service:state.change,status:201},
  {name:"disable or enable",handle:enabled,service:state.toggle,status:200}] as const){
  it(`rejects a forged origin for ${action.name} without evaluating caller identity`,async()=>{
   state.origin.mockReturnValueOnce(false);
   const response=await action.handle(request("POST",{scope:"COLLEGE",enabled:false,expectedLinkId:id}));
   expect(response.status).toBe(403);
   expect(state.context).not.toHaveBeenCalled();
   expect(action.service).not.toHaveBeenCalled();
  });
  it(`uses authenticated college context rather than spoofed IDs for ${action.name}`,async()=>{
   const body={scope:"COLLEGE",action:"REPLACE",confirmed:true,expectedLinkId:id,
    collegeId:"attacker",actorUserId:"attacker",enabled:false};
   const response=await action.handle(request("POST",body));
   expect(response.status).toBe(action.status);
   expect(action.service).toHaveBeenCalledWith(actor,body);
   expect(JSON.stringify(await response.json())).not.toContain("attacker");
  });
  it(`maps expired session or tenant mismatch in ${action.name} to friendly retry response`,async()=>{
   action.service.mockRejectedValueOnce(new Error("db-password private host"));
   const response=await action.handle(request("POST",{scope:"COLLEGE",expectedLinkId:id}));
   expect(response.status).toBe(409);
   expect(JSON.stringify(await response.json())).not.toMatch(/db-password|private host/);
   expect(state.error).toHaveBeenCalledTimes(1);
  });
 }
 it("GET denies duplicated and smuggled status selectors before loading the TPO identity",async()=>{
  for(const query of [
   "scope=COLLEGE&scope=COMPANY",
   "scope=COLLEGE&companyId="+id,
   "scope=COMPANY&companyId="+id+"&companyId="+id,
   "scope=COLLEGE&collegeId="+id,
   "scope=COLLEGE&unexpected=1",
  ]){
   const response=await read(new Request("https://college.example/api/placements/tpo/public-join-links/status?"+query));
   expect(response.status,query).toBe(400);
   expect(await response.json()).toEqual({error:"INVALID_QUERY"});
   expect(state.context).not.toHaveBeenCalled();
   expect(state.status).not.toHaveBeenCalled();
  }
 });
 it("rejects arbitrary status read scopes and returns no secret bearer token",async()=>{
  const invalid=await read(new Request("https://college.example/api/placements/tpo/public-join-links/status?scope=FORGED"));
  expect(invalid.status).toBe(400);
  expect(state.status).not.toHaveBeenCalled();
  const response=await read(new Request("https://college.example/api/placements/tpo/public-join-links/status?scope=COLLEGE"));
  expect(response.status).toBe(200);
  expect(state.status).toHaveBeenCalledWith(actor,"COLLEGE",undefined);
  const json=await response.json();
  expect(json).toMatchObject({ready:true,link:{id,enabled:false}});
  expect(JSON.stringify(json)).not.toContain("new-secret");
  expect(response.headers.get("cache-control")).toBe("no-store");
 });
});
