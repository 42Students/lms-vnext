import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";

const mock=vi.hoisted(()=>({db:vi.fn(),tx:vi.fn(),scope:vi.fn(),actor:vi.fn(),
 select:vi.fn(),insert:vi.fn(),prior:[] as unknown[],
}));
vi.mock("server-only",()=>({}));
vi.mock("@/db/client",()=>({getDb:mock.db}));
vi.mock("@/modules/placements/scope",()=>({requirePlacementManageScope:mock.scope}));
vi.mock("@/modules/placements/tpo-job-write-base",()=>({requireTpoJobActor:mock.actor}));
import {recordTpoBulkRequestRun} from "@/modules/placements/tpo-request-bulk-audit-service";

const COLLEGE="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ORG="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const REQUEST="cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const RUN="dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const EVENT="eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const context:RequestContext={
 user:{id:"ffffffff-ffff-4fff-8fff-ffffffffffff",identityUid:"tpo-bulk-review",
  platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"11111111-1111-4111-8111-111111111111",
  collegeId:COLLEGE,organizationId:ORG,status:"ACTIVE",roles:["TPO"]},
};
const input={runId:RUN,action:"APPROVE",requestIds:[REQUEST]};

describe("TPO-requests-verification-13 live-authorized bulk audit idempotency",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();
  mock.prior=[{id:EVENT,metadata:{action:"APPROVE",requestIds:[REQUEST],verifiedCount:1}}];
  mock.scope.mockResolvedValue({id:COLLEGE,organizationId:ORG});
  mock.actor.mockResolvedValue(undefined);
  mock.select.mockImplementation(()=>({
   from(){return this;},where(){return this;},limit:()=>Promise.resolve(mock.prior),
  }));
  mock.tx.mockImplementation(async(fn:(tx:{select:typeof mock.select;insert:typeof mock.insert})=>Promise<unknown>)=>
   fn({select:mock.select,insert:mock.insert}));
  mock.db.mockReturnValue({transaction:mock.tx});
 });
 it("refuses a revoked persisted TPO role before even reading any old run summary",async()=>{
  mock.actor.mockRejectedValue(new AuthorizationError("placements.manage"));
  await expect(recordTpoBulkRequestRun(context,input)).rejects.toBeInstanceOf(AuthorizationError);
  expect(mock.select).not.toHaveBeenCalled();
  expect(mock.insert).not.toHaveBeenCalled();
 });
 it("returns the saved count for an exact committed replay without any second audit",async()=>{
  const result=await recordTpoBulkRequestRun(context,input);
  expect(result).toEqual({eventId:EVENT,replayed:true,verifiedCount:1});
  expect(mock.actor).toHaveBeenCalledTimes(1);
  expect(mock.select).toHaveBeenCalledTimes(1);
  expect(mock.insert).not.toHaveBeenCalled();
 });
 it("never guesses a successful count from malformed, impossible or missing audit metadata",async()=>{
  for(const value of [null,-1,2,1.25,"1"]){
   mock.prior=[{id:EVENT,metadata:{action:"APPROVE",requestIds:[REQUEST],verifiedCount:value}}];
   await expect(recordTpoBulkRequestRun(context,input))
    .rejects.toMatchObject({code:"PLACEMENT_REQUEST_CONFLICT"});
  }
  expect(mock.insert).not.toHaveBeenCalled();
 });
 it("refuses reuse of the same run ID with a different action or selected request set",async()=>{
  await expect(recordTpoBulkRequestRun(context,{...input,action:"REJECT"}))
   .rejects.toMatchObject({code:"PLACEMENT_REQUEST_CONFLICT"});
  await expect(recordTpoBulkRequestRun(context,{...input,requestIds:[
   "22222222-2222-4222-8222-222222222222",
  ]})).rejects.toMatchObject({code:"PLACEMENT_REQUEST_CONFLICT"});
  expect(mock.insert).not.toHaveBeenCalled();
 });
});
