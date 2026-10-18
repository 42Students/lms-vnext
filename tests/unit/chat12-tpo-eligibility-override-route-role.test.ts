import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";

const mock=vi.hoisted(()=>({
 context:vi.fn(),actor:vi.fn(),origin:vi.fn(),
 evaluation:vi.fn(),set:vi.fn(),revoke:vi.fn(),
}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:mock.context}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:mock.origin}));
vi.mock("@/modules/placements/tpo-batch-workspace-read-service",()=>({
 requireTpoBatchActor:mock.actor,
}));
vi.mock("@/modules/placements/eligibility-service",()=>({
 evaluatePlacementEligibility:mock.evaluation,
 setEligibilityOverride:mock.set,
 revokeEligibilityOverride:mock.revoke,
}));
import {GET,PUT,DELETE} from "@/app/api/placements/jobs/[jobId]/eligibility/[membershipId]/route";

const COLLEGE="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const JOB="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const LEARNER="cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const TOKEN="dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const ctx:RequestContext={
 user:{id:"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",identityUid:"role-check",
  platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"ffffffff-ffff-4fff-8fff-ffffffffffff",
  collegeId:COLLEGE,organizationId:"11111111-1111-4111-8111-111111111111",
  status:"ACTIVE",roles:["TPO"]},
};
const route={params:Promise.resolve({jobId:JOB,membershipId:LEARNER})};
const request=(verb:string,payload?:unknown)=>new Request("https://example.edu/api/placements/jobs/"+JOB+"/eligibility/"+LEARNER,{
 method:verb,...(payload===undefined?{}:{
  headers:{"content-type":"application/json"},body:JSON.stringify(payload),
 }),
});

describe("TPO-students-12 direct route role, origin and stale override handling",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();
  mock.context.mockResolvedValue(ctx);
  mock.actor.mockResolvedValue(COLLEGE);
  mock.origin.mockReturnValue(true);
  mock.evaluation.mockResolvedValue({status:"ELIGIBLE",override:null,checks:[]});
  mock.set.mockResolvedValue({id:TOKEN});
  mock.revoke.mockResolvedValue({id:TOKEN});
 });
 it("GET refuses removed active role before querying student academic facts",async()=>{
  mock.actor.mockRejectedValueOnce(new AuthorizationError("placements.manage"));
  const result=await GET(request("GET"),route);
  expect(result.status).toBe(403);
  expect(mock.evaluation).not.toHaveBeenCalled();
 });
 it("GET for an authorized TPO returns the real scoped eligibility projection",async()=>{
  const response=await GET(request("GET"),route);
  expect(response.status).toBe(200);
  expect(mock.actor).toHaveBeenCalledWith(ctx);
  expect(mock.evaluation).toHaveBeenCalledWith(ctx,JOB,LEARNER);
  expect((await response.json()).eligibility.status).toBe("ELIGIBLE");
 });
 it("PUT and DELETE reject cross-origin request before reading session or modifying overrides",async()=>{
  mock.origin.mockReturnValue(false);
  expect((await PUT(request("PUT",{decision:"INCLUDE",reason:"College review"}),route)).status).toBe(403);
  expect((await DELETE(request("DELETE",{expectedOverrideId:TOKEN}),route)).status).toBe(403);
  expect(mock.context).not.toHaveBeenCalled();
  expect(mock.set).not.toHaveBeenCalled();
  expect(mock.revoke).not.toHaveBeenCalled();
 });
 it("PUT forwards the caller's exact previewed override version into the guarded writer",async()=>{
  const payload={decision:"EXCLUDE",reason:"Placement-cell review",expectedOverrideId:TOKEN};
  const response=await PUT(request("PUT",payload),route);
  expect(response.status).toBe(200);
  expect(mock.set).toHaveBeenCalledWith(ctx,JOB,LEARNER,payload);
 });
 it("DELETE forwards exact override token and audit reason to the revoke writer",async()=>{
  const payload={expectedOverrideId:TOKEN,reason:"Undo previous TPO bulk change"};
  const response=await DELETE(request("DELETE",payload),route);
  expect(response.status).toBe(200);
  expect(mock.revoke).toHaveBeenCalledWith(ctx,JOB,LEARNER,payload);
 });
 it("DELETE rejects malformed tokens at route boundary without mutating persisted state",async()=>{
  const response=await DELETE(request("DELETE",{expectedOverrideId:"../other-college"}),route);
  expect(response.status).toBeGreaterThanOrEqual(400);
  expect(mock.revoke).not.toHaveBeenCalled();
 });
});
