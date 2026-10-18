import {beforeEach,describe,expect,it,vi} from "vitest";
import {readFileSync} from "node:fs";
import type {RequestContext} from "@/modules/identity/context";

const mock=vi.hoisted(()=>({college:vi.fn(),actor:vi.fn(),db:vi.fn(),
 transaction:vi.fn(),candidate:vi.fn(),update:vi.fn(),insert:vi.fn(),
}));
vi.mock("server-only",()=>({}));
vi.mock("@/db/client",()=>({getDb:mock.db}));
vi.mock("@/modules/placements/tpo-job-write-base",()=>({
 requireTpoJobCollege:mock.college,requireTpoJobActor:mock.actor,
}));
import {sendTpoBulkApplicationMessage,tpoApplicantBulkMessageSchema}
 from "@/modules/placements/tpo-bulk-applicant-message-service";

const COLLEGE="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const APPLICATION="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const JOB="cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const USER="dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const context:RequestContext={
 user:{id:"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",identityUid:"tpo-message",
  platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"ffffffff-ffff-4fff-8fff-ffffffffffff",
  collegeId:COLLEGE,organizationId:"11111111-1111-4111-8111-111111111111",
  status:"ACTIVE",roles:["TPO"]},
};
const request={jobId:JOB,applicationId:APPLICATION,
 expectedVersion:"2099-01-01T00:00:00.000Z",body:"Please review your next placement step."};

describe("TPO-BREAK-bulk-message-replay-01 CAS, role and recipient integrity",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();
  mock.college.mockResolvedValue(COLLEGE);
  mock.actor.mockResolvedValue(undefined);
  mock.candidate.mockResolvedValue([{appId:APPLICATION,version:new Date(request.expectedVersion),
   recipient:USER,jobTitle:"Software Engineer",organizationId:context.membership!.organizationId}]);
  mock.update.mockReturnValue({set(){return this;},where(){return Promise.resolve([]);}});
  let inserts=0;
  mock.insert.mockImplementation(()=>{
   inserts++;
   if(inserts%2===1)return {values(){return this;},returning:()=>Promise.resolve([{id:JOB}])};
   return {values(){return Promise.resolve(undefined);}};
  });
  const tx={
   select:()=>({from(){return this;},innerJoin(){return this;},where(){return this;},
    for(){return this;},limit:()=>mock.candidate()}),
   update:mock.update,insert:mock.insert,
  };
  mock.transaction.mockImplementation(async(fn:(client:typeof tx)=>Promise<unknown>)=>fn(tx));
  mock.db.mockReturnValue({transaction:mock.transaction});
 });
 it("sends a single authorized message with an actor check, audited event and recipient notification",async()=>{
  await expect(sendTpoBulkApplicationMessage(context,request)).resolves.toEqual({
   applicationId:APPLICATION,delivered:true,
  });
  expect(mock.actor).toHaveBeenCalledTimes(1);
  expect(mock.update).toHaveBeenCalledTimes(1);
  expect(mock.insert).toHaveBeenCalledTimes(2);
 });
 it("denies an old signed-preview version without committing another update, audit or notification",async()=>{
  mock.candidate.mockResolvedValueOnce([{appId:APPLICATION,
   version:new Date("2099-01-01T00:00:00.001Z"),recipient:USER,
   jobTitle:"Software Engineer",organizationId:context.membership!.organizationId}]);
  await expect(sendTpoBulkApplicationMessage(context,request)).rejects.toBeDefined();
  expect(mock.update).not.toHaveBeenCalled();
  expect(mock.insert).not.toHaveBeenCalled();
 });
 it("rejects absent, other-tenant or deactivated candidate results before side effects",async()=>{
  mock.candidate.mockResolvedValueOnce([]);
  await expect(sendTpoBulkApplicationMessage(context,request)).rejects.toBeDefined();
  expect(mock.update).not.toHaveBeenCalled();
  expect(mock.insert).not.toHaveBeenCalled();
 });
 it("never starts a transaction for invalid body, forged job ID or wrong college",async()=>{
  expect(tpoApplicantBulkMessageSchema.safeParse({...request,body:"hi"}).success).toBe(false);
  expect(tpoApplicantBulkMessageSchema.safeParse({...request,jobId:"../../job"}).success).toBe(false);
  await expect(sendTpoBulkApplicationMessage(context,{...request,body:"hi"})).rejects.toBeDefined();
  mock.college.mockRejectedValueOnce(new Error("ROLE_REVOKED"));
  await expect(sendTpoBulkApplicationMessage(context,request)).rejects.toThrow("ROLE_REVOKED");
  expect(mock.transaction).not.toHaveBeenCalled();
 });
 it("holds a locked application row until CAS update, activity and notification complete",()=>{
  const src=readFileSync(new URL("../../src/modules/placements/tpo-bulk-applicant-message-service.ts",import.meta.url),"utf8");
  expect(src).toContain('.for("update",{of:placementApplications}).limit(1)');
  expect(src).toContain("requireTpoJobActor(tx,ctx)");
  expect(src).toContain("date_trunc('milliseconds'");
  expect(src).toContain("await tx.insert(inAppNotifications).values(");
 });
});
