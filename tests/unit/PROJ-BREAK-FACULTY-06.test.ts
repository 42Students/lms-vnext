import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {updateMentorMeetingNotes} from "@/modules/projects/mentor-meeting-notes-service";
import {decideMentorProjectMeeting} from "@/modules/projects/mentor-meeting-decision-service";

const projectId="11111111-1111-4111-8111-111111111111";
const meetingId="22222222-2222-4222-8222-222222222222";
const collegeId="33333333-3333-4333-8333-333333333333";
const organizationId="44444444-4444-4444-8444-444444444444";
const old="2026-10-18T04:35:00.000Z";
const newer="2026-10-18T04:35:01.000Z";
const state=vi.hoisted(()=>({
 projectStatus:"ACTIVE",status:"COMPLETED",
 outcome:"Old note",updatedAt:new Date("2026-10-18T04:35:01.000Z"),
 reads:0,writes:0,events:0,notifications:0,
}));
vi.mock("server-only",()=>({}));
vi.mock("@/modules/permissions/policy",()=>({can:()=>true}));
vi.mock("@/modules/module-access/service",()=>({
 resolveOptionalModuleAccess:async()=>({projects:{enabled:true}}),
}));
vi.mock("@/modules/projects/access",()=>({
 requireProjectReadAccess:async()=>({
  project:{id:projectId,status:state.projectStatus},collegeId,organizationId,
  access:"MENTOR",
 }),
}));
vi.mock("@/modules/activity/service",()=>({
 recordActivityEventInTransaction:async()=>{state.events++;return {id:"audit-event"};},
}));
vi.mock("@/modules/projects/project-notification-service",()=>({
 notifyActiveProjectMembers:async()=>{state.notifications++;},
}));
vi.mock("@/db/client",()=>({
 getDb:()=>({transaction:async(run:(tx:unknown)=>Promise<unknown>)=>{
  let read=0;
  const tx={
   select:()=>({from:()=>({where:()=>({for:()=>({
    limit:async()=>{
     state.reads++;read++;
     return read===1?[{status:state.projectStatus}]:[{
      id:meetingId,projectId,title:"Research",
      status:state.status,outcome:state.outcome,
      updatedAt:state.updatedAt,
     }];
    },
   })})})}),
   update:()=>({set:(change:{status?:string;outcome?:string|null;
    updatedAt:Date})=>({where:()=>({returning:async()=>{
     state.writes++;
     if(change.status)state.status=change.status;
     if(change.outcome!==undefined)state.outcome=change.outcome??"";
     state.updatedAt=change.updatedAt;
     return [{id:meetingId,title:"Research",status:state.status,
      outcome:state.outcome,updatedAt:state.updatedAt}];
    }})})}),
  };
  return run(tx);
 }}),
}));
const faculty:RequestContext={
 user:{id:"55555555-5555-4555-8555-555555555555",
  identityUid:"faculty",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"66666666-6666-4666-8666-666666666666",
  collegeId,organizationId,status:"ACTIVE",roles:["FACULTY","MENTOR"]},
};
const note=(at:string,content="Old note")=>
 updateMentorMeetingNotes(faculty,{projectId,meetingId},{
  outcome:content,expectedUpdatedAt:at,confirmed:true,
 });
const decide=(at:string)=>
 decideMentorProjectMeeting(faculty,projectId,meetingId,{
  action:"COMPLETE",expectedUpdatedAt:at,confirmed:true,
 });
describe("PROJ-BREAK-FACULTY-06 meeting revisions, duplicate submits and notification integrity",()=>{
 beforeEach(()=>{
  state.projectStatus="ACTIVE";state.status="COMPLETED";state.outcome="Old note";
  state.updatedAt=new Date(newer);state.reads=0;state.writes=0;
  state.events=0;state.notifications=0;
 });
 it("PROJ-BREAK-FACULTY-06-01 stale note replay wins over no-op and cannot write or notify",async()=>{
  await expect(note(old)).rejects.toMatchObject({code:"PROJECT_MEETING_STALE_VERSION"});
  expect(state).toMatchObject({reads:2,writes:0,events:0,notifications:0});
 });
 it("PROJ-BREAK-FACULTY-06-02 same-version no-op is rejected without an audit event",async()=>{
  await expect(note(newer)).rejects.toMatchObject({code:"PROJECT_MEETING_INVALID_STATE"});
  expect(state).toMatchObject({writes:0,events:0,notifications:0});
 });
 it("PROJ-BREAK-FACULTY-06-03 a real confirmed revision audits once and never notifies the entire team",async()=>{
  const result=await note(newer,"Corrected minutes");
  expect(result.outcome).toBe("Corrected minutes");
  expect(state).toMatchObject({writes:1,events:1,notifications:0});
  await expect(note(newer,"Corrected minutes"))
   .rejects.toMatchObject({code:"PROJECT_MEETING_STALE_VERSION"});
  expect(state).toMatchObject({writes:1,events:1,notifications:0});
 });
 it("PROJ-BREAK-FACULTY-06-04 duplicate COMPLETE on a later terminal version is stale, not mistaken for a new action",async()=>{
  await expect(decide(old)).rejects.toMatchObject({code:"PROJECT_MEETING_STALE_VERSION"});
  expect(state).toMatchObject({writes:0,events:0,notifications:0});
 });
 it("PROJ-BREAK-FACULTY-06-05 matching terminal version cannot repeat a meeting decision",async()=>{
  await expect(decide(newer)).rejects.toMatchObject({code:"PROJECT_MEETING_INVALID_STATE"});
  expect(state).toMatchObject({writes:0,events:0,notifications:0});
 });
 it("PROJ-BREAK-FACULTY-06-06 a permitted COMPLETE produces one audit record and exactly two scoped recipient notifications",async()=>{
  state.status="SCHEDULED";state.outcome="";
  const response=await decide(newer);
  expect(response.status).toBe("COMPLETED");
  expect(state).toMatchObject({writes:1,events:1,notifications:2});
  await expect(decide(newer)).rejects.toMatchObject({code:"PROJECT_MEETING_STALE_VERSION"});
  expect(state).toMatchObject({writes:1,events:1,notifications:2});
 });
});
