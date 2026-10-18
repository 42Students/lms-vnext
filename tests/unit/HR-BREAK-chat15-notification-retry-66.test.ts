import {beforeEach,describe,expect,it,vi} from "vitest";
import {markHrNotificationRead} from "@/modules/placements/hr-notification-read-service";

const m=vi.hoisted(()=>({
 getDb:vi.fn(),jobs:vi.fn(),select:vi.fn(),update:vi.fn(),
 rows:[] as unknown[][],updated:[] as unknown[],
}));
vi.mock("server-only",()=>({}));
vi.mock("@/db/client",()=>({getDb:m.getDb}));
vi.mock("@/modules/placements/recruiter-service",()=>({
 listOwnRecruiterPlacementJobs:m.jobs,
}));
const id="123e4567-e89b-42d3-a456-426614174001";
const jobId="123e4567-e89b-42d3-a456-426614174002";
const college="123e4567-e89b-42d3-a456-426614174003";
const createdAt=new Date("2099-04-01T00:00:00.000Z");
const readAt=new Date("2099-04-01T01:00:00.000Z");
const actor={user:{id:"recruiter",platformStatus:"ACTIVE",systemRoles:[]},
 recruiter:{userId:"recruiter",status:"ACTIVE",companyId:"firm-a",grants:[]}};
const input={expectedCreatedAt:createdAt.toISOString()};
function query(rows:unknown[]){
 return {from(){return this;},innerJoin(){return this;},where(){return this;},
  for(){return this;},limit(){return Promise.resolve(rows);},
 };
}
describe("HR-NOTIFY-DEPTH-66: mark-read is idempotent without bypassing owner/version",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();m.rows=[];m.updated=[];
  m.jobs.mockResolvedValue([{collegeId:college,companyId:"firm-a",
   job:{id:jobId,title:"Authorized drive"}}]);
  m.select.mockImplementation(()=>query(m.rows.shift()??[]));
  m.update.mockImplementation(()=>({
   set(){return this;},where(){return this;},
   returning(){return Promise.resolve(m.updated);},
  }));
  m.getDb.mockReturnValue({transaction:(fn:(tx:unknown)=>Promise<unknown>)=>
   fn({select:m.select,update:m.update})});
 });
 it("first acknowledgement writes exactly once and returns the committed receipt",async()=>{
  m.rows=[[{id,createdAt,readAt:null}]];m.updated=[{id,readAt}];
  await expect(markHrNotificationRead(actor as never,id,input)).resolves.toEqual({
   id,readAt:readAt.toISOString(),
  });
  expect(m.update).toHaveBeenCalledTimes(1);
 });
 it("retry after lost response returns the already committed time without a second write",async()=>{
  m.rows=[[{id,createdAt,readAt}]];
  await expect(markHrNotificationRead(actor as never,id,input)).resolves.toEqual({
   id,readAt:readAt.toISOString(),
  });
  expect(m.update).not.toHaveBeenCalled();
 });
 it("stale expected creation token cannot acknowledge even an already-read record",async()=>{
  m.rows=[[{id,createdAt,readAt}]];
  await expect(markHrNotificationRead(actor as never,id,{
   expectedCreatedAt:"2099-04-01T00:00:00.001Z",
  })).rejects.toThrow("PLACEMENT_RECRUITER_NOTIFICATION_STALE");
  expect(m.update).not.toHaveBeenCalled();
 });
 it("unknown notification fails closed before any write",async()=>{
  m.rows=[[]];
  await expect(markHrNotificationRead(actor as never,id,input)).rejects.toThrow();
  expect(m.update).not.toHaveBeenCalled();
 });
 it("swapped recruiter or missing employer jobs cannot acknowledge another user's notification",async()=>{
  await expect(markHrNotificationRead({...actor,recruiter:{...actor.recruiter,userId:"swapped"}} as never,
   id,input)).rejects.toThrow();
  expect(m.jobs).not.toHaveBeenCalled();
  m.jobs.mockResolvedValue([]);
  await expect(markHrNotificationRead(actor as never,id,input)).rejects.toThrow();
  expect(m.getDb).not.toHaveBeenCalled();
 });
});
