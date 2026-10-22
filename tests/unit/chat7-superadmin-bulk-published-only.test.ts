import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {readFileSync} from "node:fs";

/** The bulk command now edits lesson records, not published content rows.
 * Test its transactional lesson CAS, college scope and partial-failure policy.
 */
const lessonId="11111111-1111-4111-8111-111111111111";
const collegeId="22222222-2222-4222-8222-222222222222";
const organizationId="33333333-3333-4333-8333-333333333333";
const state=vi.hoisted(()=>({
 row:{id:"11111111-1111-4111-8111-111111111111",name:"Lesson",
  sequence:1,status:"ACTIVE",visible:false,version:7} as {
  id:string;name:string;sequence:number;status:"ACTIVE"|"ARCHIVED";
  visible:boolean;version:number;
 }|null,
 writeSucceeds:true,
 transactions:vi.fn(),writes:vi.fn(),audits:vi.fn(),
 persisted:vi.fn(),acting:vi.fn(),
}));
vi.mock("@/modules/permissions/acting-college",()=>({resolveActingCollege:state.acting}));
vi.mock("@/modules/permissions/persisted-actor",()=>({
 assertPersistedPlatformPermission:state.persisted,
}));
vi.mock("@/modules/activity/service",()=>({recordActivityEvent:state.audits}));
vi.mock("@/db/client",()=>({
 getDb:()=>({
  select:()=>({
   from(){return this;},where(){return this;},limit:async()=>[],
  }),
  transaction:async (work:(tx:unknown)=>Promise<unknown>)=>{
   state.transactions();
   const tx={
    select:()=>({
     from(){return this;},innerJoin(){return this;},where(){return this;},
     for(){return this;},limit:async()=>state.row?[state.row]:[],
    }),
    update:()=>{
     state.writes();
     return {
      set(){return this;},where(){return this;},
      returning:async()=>state.writeSucceeds?[{id:lessonId}]:[],
     };
    },
   };
   return work(tx);
  },
 }),
}));
import {bulkSuperAdminLessonVisibility} from "@/modules/courses/super-admin-lesson-bulk-visibility";

const context={
 user:{id:"test-user",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:{collegeId,organizationId},
} as unknown as RequestContext;
beforeEach(()=>{
 state.row={id:lessonId,name:"Lesson",sequence:1,status:"ACTIVE",visible:false,version:7};
 state.writeSucceeds=true;
 state.transactions.mockReset();state.writes.mockReset();state.audits.mockReset();
 state.persisted.mockReset().mockResolvedValue({userId:"test-user"});
 state.acting.mockReset().mockResolvedValue({collegeId,organizationId});
});
describe("SA-academics-people-53: college-scoped lesson bulk status and visibility",()=>{
 it("changes an authorized active lesson with a persisted permission and version CAS",async()=>{
  const result=await bulkSuperAdminLessonVisibility(context,{
   lessonIds:[lessonId],visibleToStudents:true,confirmed:true,
   expectedVersions:{[lessonId]:7},
  });
  expect(state.acting).toHaveBeenCalledWith(context,"courses.manage");
  expect(state.persisted).toHaveBeenCalledWith(expect.anything(),context,
   "courses.manage",{collegeId,organizationId});
  expect(state.transactions).toHaveBeenCalledTimes(1);
  expect(state.writes).toHaveBeenCalledTimes(1);
  expect(result).toMatchObject({requested:1,updatedCount:1,changed:1,unchanged:0,failed:[]});
  expect(state.audits).toHaveBeenCalledTimes(1);
 });
 it("preserves an already matching lesson and does not generate a write or audit",async()=>{
  state.row={id:lessonId,name:"Lesson",sequence:1,status:"ACTIVE",visible:true,version:7};
  const result=await bulkSuperAdminLessonVisibility(context,{
   lessonIds:[lessonId],visibleToStudents:true,confirmed:true,
  });
  expect(result).toMatchObject({updatedCount:1,changed:0,unchanged:1,failed:[]});
  expect(state.writes).not.toHaveBeenCalled();
  expect(state.audits).toHaveBeenCalledTimes(1);
 });
 it("returns a sanitized partial failure when the CAS write loses a race",async()=>{
  state.writeSucceeds=false;
  const result=await bulkSuperAdminLessonVisibility(context,{
   lessonIds:[lessonId],visibleToStudents:true,confirmed:true,
  });
  expect(result).toMatchObject({requested:1,updatedCount:0,changed:0});
  expect(result.failures).toHaveLength(1);
  expect(result.failures[0]).toMatchObject({id:lessonId,reason:"Lesson was updated by someone else. Refresh and retry."});
  expect(state.audits).not.toHaveBeenCalled();
 });
 it("rejects invalid lesson identifiers per-row without querying lesson records",async()=>{
  const result=await bulkSuperAdminLessonVisibility(context,{
   lessonIds:["not-a-uuid"],visibleToStudents:true,confirmed:true,
  });
  expect(result).toMatchObject({requested:1,updatedCount:0,changed:0});
  expect(result.failures[0]?.reason).toBe("Invalid lesson id");
  expect(state.transactions).not.toHaveBeenCalled();
 });
 it("rejects missing changes and unconfirmed commands before storage access",async()=>{
  for(const raw of [
   {lessonIds:[lessonId],confirmed:true},
   {lessonIds:[lessonId],visibleToStudents:true,confirmed:false},
   {lessonIds:[],visibleToStudents:true},
   {lessonIds:Array.from({length:501},(_,i)=>
    "00000000-0000-4000-8000-"+String(i).padStart(12,"0")),visibleToStudents:true},
  ]){
   await expect(bulkSuperAdminLessonVisibility(context,raw)).rejects.toThrow();
  }
  expect(state.acting).not.toHaveBeenCalled();
  expect(state.transactions).not.toHaveBeenCalled();
 });
 it("retains tenant, active-parent, role and CAS fencing on each lesson",()=>{
  const source=readFileSync("src/modules/courses/super-admin-lesson-bulk-visibility.ts","utf8");
  for(const guard of [
   'resolveActingCollege(context,"courses.manage")',
   'eq(departments.collegeId,acting.collegeId)',
   'eq(academicPeriods.collegeId,acting.collegeId)',
   'eq(courseOfferings.status,"ACTIVE")',
   'eq(courses.status,"ACTIVE")',
   'assertPersistedPlatformPermission(tx,context,"courses.manage"',
   'eq(courseLessons.version,lesson.version)',
   'for("update",{of:courseLessons})',
  ])expect(source).toContain(guard);
 });
});
