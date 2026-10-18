import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {commandFacultyQuizResults} from "@/modules/courses/faculty-quiz-results-command-service";

const quizId="11111111-1111-4111-8111-111111111111";
const deliveryId="22222222-2222-4222-8222-222222222222";
const collegeId="33333333-3333-4333-8333-333333333333";
const organizationId="44444444-4444-4444-8444-444444444444";
const timestamp="2026-10-18T04:35:00.000Z";
const state=vi.hoisted(()=>({
 reads:0,writes:0,events:0,scopes:0,accesses:0,guardCalls:0,guardRevoked:false,
 permit:true,teachingRole:"FACULTY",
 quiz:{
  id:"11111111-1111-4111-8111-111111111111",
  deliveryId:"22222222-2222-4222-8222-222222222222",
  title:"Midterm",status:"CLOSED",resultsPublished:false,
  dueAt:null as Date|null,updatedAt:new Date("2026-10-18T04:35:00.000Z"),
 },
}));
vi.mock("server-only",()=>({}));
vi.mock("@/modules/permissions/policy",()=>({
 can:()=>state.permit,
}));
vi.mock("@/modules/courses/scope",()=>({
 loadCourseSectionDeliveryScope:async()=>{
  state.scopes++;
  return {collegeId:"33333333-3333-4333-8333-333333333333",
   organizationId:"44444444-4444-4444-8444-444444444444"};
 },
}));
vi.mock("@/modules/courses/learning-access",()=>({
 requireDeliveryContentMutation:async()=>{
  state.accesses++;
  return state.teachingRole;
 },
}));
vi.mock("@/modules/courses/faculty-persisted-teaching-guard",()=>({
 assertPersistedFacultyTeachingMutation:async()=>{
  state.guardCalls++;
  if(state.guardRevoked)throw Object.assign(new Error("Revoked Faculty"),{
   code:"FACULTY_TEACHING_SCOPE_REQUIRED",
  });
 },
}));
vi.mock("@/modules/activity/service",()=>({
 recordActivityEventInTransaction:async()=>{state.events++;},
}));
vi.mock("@/db/client",()=>({
 getDb:()=>({
  transaction:async(callback:(tx:unknown)=>Promise<unknown>)=>{
   const tx={
    select:()=>({from:()=>({where:()=>({for:()=>({
     limit:async()=>{
      state.reads++;
      return [{...state.quiz}];
     },
    })})})}),
    update:()=>({set:(patch:Partial<typeof state.quiz>)=>({where:()=>({
     returning:async()=>{
      state.writes++;
      state.quiz={...state.quiz,...patch};
      return [{...state.quiz}];
     },
    })})}),
   };
   return callback(tx);
  },
 }),
}));
function faculty():RequestContext{
 return {user:{id:"55555555-5555-4555-8555-555555555555",
   identityUid:"faculty",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:"66666666-6666-4666-8666-666666666666",
   collegeId,organizationId,status:"ACTIVE",roles:["FACULTY"]}};
}
const publish=(context:RequestContext=faculty(),at=timestamp,action:"PUBLISH"|"HIDE"="PUBLISH")=>
 commandFacultyQuizResults(context,quizId,{
  deliveryId,action,expectedUpdatedAt:at,confirmed:true,
 });

describe("COURSES-BREAK-FACULTY-03 published-result write boundaries",()=>{
 beforeEach(()=>{
  state.reads=0;state.writes=0;state.events=0;state.scopes=0;state.accesses=0;
  state.permit=true;state.teachingRole="FACULTY";state.guardCalls=0;state.guardRevoked=false;
  state.quiz={id:quizId,deliveryId,title:"Midterm",status:"CLOSED",
   resultsPublished:false,dueAt:null,updatedAt:new Date(timestamp)};
 });
 it("FAC-assessments quiz results: one authorized publish changes state and emits one activity",async()=>{
  const updated=await publish();
  expect(updated).toMatchObject({id:quizId,status:"CLOSED",resultsPublished:true});
  expect(state).toMatchObject({reads:1,writes:1,events:1,scopes:1,accesses:1});
 });
 it("FAC-assessments quiz results: duplicate and stale-tab submit never audit or overwrite again",async()=>{
  const first=await publish();
  expect(first.resultsPublished).toBe(true);
  await expect(publish()).rejects.toMatchObject({code:"QUIZ_RESULTS_STALE_VERSION"});
  await expect(publish(faculty(),timestamp,"HIDE")).rejects.toMatchObject({
   code:"QUIZ_RESULTS_STALE_VERSION",
  });
  expect(state).toMatchObject({writes:1,events:1});
 });
 it("FAC-assessments quiz results: valid hide is a separate versioned action",async()=>{
  const first=await publish();
  const hidden=await publish(faculty(),first.updatedAt.toISOString(),"HIDE");
  expect(hidden.resultsPublished).toBe(false);
  expect(state).toMatchObject({writes:2,events:2});
  await expect(publish(faculty(),hidden.updatedAt.toISOString(),"HIDE"))
   .rejects.toMatchObject({code:"INVALID_QUIZ_TRANSITION"});
 });
 it("FAC-assessments quiz results: wrong college, role, disabled user and expired membership fail before DB",async()=>{
  const cases=[
   (ctx:RequestContext)=>{ctx.membership!.collegeId="77777777-7777-4777-8777-777777777777";},
   (ctx:RequestContext)=>{ctx.membership!.roles=["MENTOR"];},
   (ctx:RequestContext)=>{ctx.membership!.roles=["LEARNER"];},
   (ctx:RequestContext)=>{ctx.membership!.status="ENDED";},
   (ctx:RequestContext)=>{ctx.user.platformStatus="DISABLED";},
   (ctx:RequestContext)=>{ctx.membership=null;},
  ];
  for(const mutate of cases){
   const ctx=faculty();mutate(ctx);
   await expect(publish(ctx)).rejects.toThrow();
  }
  expect(state.writes).toBe(0);
  expect(state.reads).toBe(0);
  expect(state.events).toBe(0);
 });
 it("FAC-assessments quiz results: revoked teaching assignment and read permission deny before transaction",async()=>{
  state.teachingRole="MENTOR";
  await expect(publish()).rejects.toMatchObject({code:"FACULTY_TEACHING_SCOPE_REQUIRED"});
  state.teachingRole="FACULTY";state.permit=false;
  await expect(publish()).rejects.toMatchObject({code:"FACULTY_TEACHING_SCOPE_REQUIRED"});
  expect(state).toMatchObject({reads:0,writes:0,events:0});
 });
 it("FAC-assessments quiz results: malformed selectors, confirmation and extra fields fail before scope read",async()=>{
  const invalid=[
   {deliveryId,action:"PUBLISH",expectedUpdatedAt:timestamp,confirmed:false},
   {deliveryId:"foreign",action:"PUBLISH",expectedUpdatedAt:timestamp,confirmed:true},
   {deliveryId,action:"PUBLISH",expectedUpdatedAt:"yesterday",confirmed:true},
   {deliveryId,action:"PUBLISH",expectedUpdatedAt:timestamp,confirmed:true,force:true},
  ];
  for(const data of invalid)
   await expect(commandFacultyQuizResults(faculty(),quizId,data)).rejects.toThrow();
  await expect(commandFacultyQuizResults(faculty(),"foreign",{
   deliveryId,action:"PUBLISH",expectedUpdatedAt:timestamp,confirmed:true,
  })).rejects.toThrow();
  expect(state).toMatchObject({scopes:0,reads:0,writes:0,events:0});
 });
 it("FAC-assessments quiz results: revoked user or teaching grant during transaction cannot publish or audit",async()=>{
  state.guardRevoked=true;
  await expect(publish()).rejects.toMatchObject({code:"FACULTY_TEACHING_SCOPE_REQUIRED"});
  expect(state).toMatchObject({reads:1,guardCalls:1,writes:0,events:0});
  state.guardRevoked=false;
  await publish();
  expect(state).toMatchObject({guardCalls:2,writes:1,events:1});
 });
 it("FAC-assessments quiz results: draft, archived and future-deadline quizzes cannot publish",async()=>{
  for(const status of ["DRAFT","ARCHIVED","PUBLISHED"]){
   state.quiz.status=status;
   state.quiz.dueAt=status==="PUBLISHED"?new Date("2030-01-01T00:00:00.000Z"):null;
   await expect(publish()).rejects.toMatchObject({code:"INVALID_QUIZ_TRANSITION"});
  }
  expect(state).toMatchObject({writes:0,events:0});
 });
});
