import {beforeEach,describe,expect,it,vi} from "vitest";

const m=vi.hoisted(()=>({
 threads:vi.fn(),jobs:vi.fn(),getDb:vi.fn(),select:vi.fn(),
 distinct:vi.fn(),distinctOn:vi.fn(),rows:[] as unknown[][],
}));
vi.mock("server-only",()=>({}));
vi.mock("@/db/client",()=>({getDb:m.getDb}));
vi.mock("@/modules/placements/tpo-messaging-service",()=>({listMessageThreads:m.threads}));
vi.mock("@/modules/placements/recruiter-service",()=>({listOwnRecruiterPlacementJobs:m.jobs}));
import {listHrConversations} from "@/modules/placements/hr-conversation-inbox-service";

const college="123e4567-e89b-42d3-a456-426614174001";
const company="123e4567-e89b-42d3-a456-426614174002";
const context={user:{id:"actor",platformStatus:"ACTIVE"},
 recruiter:{userId:"actor",status:"ACTIVE",companyId:company,grants:[
  {collegeId:college,companyRelationshipId:"relationship"},
 ]}};
const thread=(id:string,jobId:string|null=null)=>({
 id,jobId,collegeId:college,recruiterUserId:"actor",
 createdAt:new Date("2099-01-01T00:00:00Z"),lastMessageAt:null,
});
function query(rows:unknown[]){
 return {from(){return this;},innerJoin(){return this;},where(){return this;},
  groupBy(){return Promise.resolve(rows);},
  orderBy(){return Promise.resolve(rows);},
  then(ok:(value:unknown[])=>unknown,bad?:(reason:unknown)=>unknown){
   return Promise.resolve(rows).then(ok,bad);
  }};
}
describe("HR-MESSAGING-DEPTH-63: thread allowlist before unread message lookup",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();m.rows=[];m.threads.mockResolvedValue([]);
  m.jobs.mockResolvedValue([]);
  m.select.mockImplementation(()=>query(m.rows.shift()??[]));
  m.distinct.mockImplementation(()=>query(m.rows.shift()??[]));
  m.distinctOn.mockImplementation(()=>query(m.rows.shift()??[]));
  m.getDb.mockReturnValue({select:m.select,selectDistinct:m.distinct,selectDistinctOn:m.distinctOn});
 });
 it("does not query any message body when no accessible job or general thread exists",async()=>{
  m.threads.mockResolvedValue([thread("hidden","foreign-job")]);
  const result=await listHrConversations(context as never,{unreadOnly:"true"});
  expect(result).toMatchObject({status:"READY",items:[],total:0});
  expect(m.getDb).not.toHaveBeenCalled();
  expect(m.jobs).toHaveBeenCalledWith(context,college,{jobIds:["foreign-job"]});
 });
 it("accepts a general thread only if it belongs to this recruiter and college",async()=>{
  m.threads.mockResolvedValue([
   {...thread("foreign-college"),collegeId:"other"},
   {...thread("foreign-actor"),recruiterUserId:"other"},
  ]);
  const result=await listHrConversations(context as never,{unreadOnly:"true"});
  expect(result).toMatchObject({status:"READY",items:[],total:0});
  expect(m.getDb).not.toHaveBeenCalled();
 });
 it("reads unread information only for an actually owned thread",async()=>{
  m.threads.mockResolvedValue([thread("own")]);
  m.rows=[[{threadId:"own"}],[{threadId:"own",unread:2}],
   [{threadId:"own",body:"Hello",senderType:"TPO"}]];
  const result=await listHrConversations(context as never,{unreadOnly:"true"});
  expect(result.status).toBe("READY");
  if(result.status==="READY"){
   expect(result.items).toHaveLength(1);
   expect(result.items[0]).toMatchObject({id:"own",unread:2});
   expect(result.unreadInView).toBe(2);
  }
  expect(m.distinct).toHaveBeenCalledTimes(1);
  expect(m.select).toHaveBeenCalledTimes(1);
  expect(m.distinctOn).toHaveBeenCalledTimes(1);
 });
 it("does not run a cross-college inbox search for an inactive or swapped recruiter",async()=>{
  for(const invalid of [
   {...context,user:{...context.user,platformStatus:"SUSPENDED"}},
   {...context,recruiter:{...context.recruiter,userId:"imposter"}},
  ]){
   await expect(listHrConversations(invalid as never,{unreadOnly:"true"}))
    .rejects.toThrow();
  }
  expect(m.threads).not.toHaveBeenCalled();
  expect(m.getDb).not.toHaveBeenCalled();
 });
});
