import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";

const mocks=vi.hoisted(()=>({scope:vi.fn(),actor:vi.fn(),getDb:vi.fn(),select:vi.fn(),rows:[] as unknown[]}));
vi.mock("@/modules/placements/scope",()=>({requirePlacementManageScope:mocks.scope}));
vi.mock("@/db/client",()=>({getDb:mocks.getDb}));
vi.mock("@/modules/placements/tpo-batch-workspace-read-service",()=>({requireTpoBatchActor:mocks.actor}));
import {listTpoStudentRequests} from "@/modules/placements/tpo-students-service";

const A="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",B="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const ORG="cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const ctx:RequestContext={
 user:{id:"dddddddd-dddd-4ddd-8ddd-dddddddddddd",identityUid:"tpo",
  platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  collegeId:A,organizationId:ORG,status:"ACTIVE",roles:["TPO"]},
};
const date=new Date("2026-10-18T11:00:00.000Z");
const sample=(status:string,id:string)=>({
 id,requestType:"APPLICATION_WITHDRAWAL",status,
 requestedAt:date,updatedAt:date,reason:"Correction needed",
 decisionNote:null,decidedAt:null,decidedBy:null,
 membershipId:B,studentName:"Applicant",rollNumber:"CSE100",
 applicationId:id,jobId:B,jobTitle:"Engineer",companyName:"Example Corp",
 roundId:null,offerId:null,nextRoundAt:null,nextRoundName:null,
});
describe("TPO-BREAK-student-requests-09 safe scope and server filters",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();
  mocks.rows=[];
  mocks.actor.mockResolvedValue(A);
  mocks.scope.mockImplementation(async(_ctx:RequestContext,collegeId:string)=>{
   if(collegeId!==A)throw new Error("FOREIGN_COLLEGE");
   return {id:A,organizationId:ORG};
  });
  mocks.select.mockImplementation(()=>{
   const enrollmentLookup=mocks.select.mock.calls.length>1;
   return {
    from(){return this;},innerJoin(){return this;},leftJoin(){return this;},
    where(){return enrollmentLookup?Promise.resolve([]):this;},
    orderBy(){return Promise.resolve(mocks.rows);},
   };
  });
  mocks.getDb.mockReturnValue({select:mocks.select});
 });
 it("denies foreign college and malformed input before accessing any request or student record",async()=>{
  await expect(listTpoStudentRequests(ctx,{collegeId:B})).rejects.toThrow("FOREIGN_COLLEGE");
  await expect(listTpoStudentRequests(ctx,{collegeId:A,actorId:B})).rejects.toBeDefined();
  await expect(listTpoStudentRequests(ctx,{collegeId:A,page:0})).rejects.toBeDefined();
  expect(mocks.getDb).not.toHaveBeenCalled();
 });
 it("TPO-BREAK-student-read-actor-01 denies a revoked persisted TPO role before reading records",async()=>{
  mocks.actor.mockRejectedValue(new Error("PERSISTED_ROLE_REVOKED"));
  await expect(listTpoStudentRequests(ctx,{collegeId:A})).rejects.toThrow("PERSISTED_ROLE_REVOKED");
  expect(mocks.getDb).not.toHaveBeenCalled();
  expect(mocks.actor).toHaveBeenCalledWith(ctx);
 });
 it("returns honest zero-count state with no fabricated unknown request kinds",async()=>{
  const r=await listTpoStudentRequests(ctx,{collegeId:A});
  expect(r).toMatchObject({collegeId:A,total:0,page:1,pageSize:25,totalPages:0,requests:[],
   summary:{total:0,pending:0,approved:0,rejected:0,cancelled:0}});
  expect(mocks.getDb).toHaveBeenCalledTimes(1);
 });
 it("strict status filter computes totals before pagination and keeps a pending-only filtered list",async()=>{
  mocks.rows=[sample("PENDING",A),sample("APPROVED",B)];
  const r=await listTpoStudentRequests(ctx,{collegeId:A,status:"PENDING",pageSize:1});
  expect(r.summary).toMatchObject({total:2,pending:1,approved:1,rejected:0});
  expect(r.total).toBe(1);
  expect(r.pageSize).toBe(1);
  expect(r.requests.map(x=>x.status)).toEqual(["PENDING"]);
 });
});
