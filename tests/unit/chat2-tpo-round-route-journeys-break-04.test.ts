import {beforeEach,afterEach,describe,expect,it,vi} from "vitest";
import {NextResponse} from "next/server";
const state=vi.hoisted(()=>({
 origin:vi.fn(),context:vi.fn(),error:vi.fn(),
 reschedule:vi.fn(),confirm:vi.fn(),bulk:vi.fn(),
}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:state.origin}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:state.context}));
vi.mock("@/lib/api-error",()=>({apiErrorResponse:state.error}));
vi.mock("@/modules/placements/tpo-interview-reschedule-service",()=>({rescheduleTpoInterview:state.reschedule}));
vi.mock("@/modules/placements/tpo-confirmed-round-result-service",()=>({confirmTpoRoundResult:state.confirm}));
vi.mock("@/modules/placements/tpo-bulk-round-result-service",()=>({confirmTpoBulkRoundResults:state.bulk}));
import {POST as reschedule} from "@/app/api/placements/tpo/interviews/[roundId]/reschedule/route";
import {POST as confirm} from "@/app/api/placements/tpo/rounds/[roundId]/confirmed-results/route";
import {POST as bulk} from "@/app/api/placements/tpo/rounds/[roundId]/bulk-confirmed-results/route";

const roundId="00000000-0000-4000-8000-000000000001";
const actor={user:{id:"signed-user",platformStatus:"ACTIVE"},
 membership:{id:"signed-tpo-membership",collegeId:"college-a",status:"ACTIVE",roles:["TPO"]}};
const ctx={params:Promise.resolve({roundId})};
const specs=[
 {name:"interview reschedule",handler:reschedule,service:state.reschedule,status:200},
 {name:"single round decision",handler:confirm,service:state.confirm,status:201},
 {name:"bulk round decision",handler:bulk,service:state.bulk,status:200},
] as const;
function req(body:unknown):Request{
 return new Request("https://college.example/api/placements/tpo/rounds",{
  method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body),
 });
}
beforeEach(()=>{
 for(const mock of Object.values(state))mock.mockReset();
 vi.stubEnv("DB09_TPO_API_READY","DB09_VERIFIED");
 state.origin.mockReturnValue(true);
 state.context.mockResolvedValue(actor);
 state.error.mockImplementation(()=>NextResponse.json({error:"SAFE_FAILURE",
  message:"Refresh the page and retry."},{status:409}));
 state.reschedule.mockResolvedValue({id:roundId});
 state.confirm.mockResolvedValue({id:"result-id"});
 state.bulk.mockResolvedValue({staged:1,skipped:0});
});
afterEach(()=>vi.unstubAllEnvs());

describe("TPO-BREAK-round-route-04 actual handlers: hostile origins, spoofed identities and stale tabs",()=>{
 for(const spec of specs){
  it(`denies forged cross-origin ${spec.name} before looking up a TPO session`,async()=>{
   state.origin.mockReturnValueOnce(false);
   const response=await spec.handler(req({collegeId:"other-college",userId:"attacker"}),ctx);
   expect(response.status).toBe(403);
   expect(await response.json()).toEqual({error:"INVALID_ORIGIN"});
   expect(state.context).not.toHaveBeenCalled();
   expect(spec.service).not.toHaveBeenCalled();
  });
  it(`uses persisted session identity and scoped round params for ${spec.name}`,async()=>{
   const body={confirmed:true,expectedUpdatedAt:"2026-10-18T04:00:00Z",
    collegeId:"spoofed-college",userId:"spoofed-user",entries:[]};
   const response=await spec.handler(req(body),ctx);
   expect(response.status).toBe(spec.status);
   expect(state.context).toHaveBeenCalledTimes(1);
   expect(spec.service).toHaveBeenCalledTimes(1);
   expect(spec.service.mock.calls[0][0]).toBe(actor);
   expect(spec.service.mock.calls[0][1]).toBe(roundId);
   expect(spec.service.mock.calls[0][2]).toEqual(body);
   expect(JSON.stringify(await response.json())).not.toContain("spoofed-user");
  });
  it(`does not leak service or DB details on expired/stale/wrong-tenant ${spec.name}`,async()=>{
   spec.service.mockRejectedValueOnce(new Error("postgres internal access_token secret"));
   const response=await spec.handler(req({confirmed:true}),ctx);
   expect(response.status).toBe(409);
   const json=await response.json();
   expect(json.message).toContain("Refresh");
   expect(JSON.stringify(json)).not.toMatch(/postgres|access_token|secret/i);
   expect(state.error).toHaveBeenCalledTimes(1);
  });
 }
 it("reschedule storage gate fails without invoking request-scoped identity or mutation",async()=>{
  vi.stubEnv("DB09_TPO_API_READY","PENDING");
  const response=await reschedule(req({confirmed:true}),ctx);
  expect(response.status).toBe(503);
  expect(response.headers.get("cache-control")).toContain("no-store");
  expect(state.context).not.toHaveBeenCalled();
  expect(state.reschedule).not.toHaveBeenCalled();
 });
});
