import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {readFileSync} from "node:fs";
const state=vi.hoisted(()=>({
 rows:[] as Array<{id:string;lessonId:string;status:string;visible:boolean;updatedAt:Date}>,
 write:vi.fn(),acting:vi.fn(),select:vi.fn(),
}));
vi.mock("@/modules/permissions/acting-college",()=>({resolveActingCollege:state.acting}));
vi.mock("@/modules/courses/college-content-visibility-service",()=>({
 updateCollegeContentStudentVisibility:state.write,
}));
vi.mock("@/db/client",()=>({getDb:()=>({select:state.select})}));
import {bulkSuperAdminLessonVisibility} from "@/modules/courses/super-admin-lesson-bulk-visibility";

const lessonId="11111111-1111-4111-8111-111111111111";
const context={user:{id:"test-user"},adminScope:{collegeId:"22222222-2222-4222-8222-222222222222"}} as unknown as RequestContext;
const row=(id:string,status:string,visible=false)=>({id,lessonId,status,visible,
 updatedAt:new Date("2099-01-01T12:00:00.000Z")});
beforeEach(()=>{
 state.rows=[
  row("draft","DRAFT"),
  row("archived","ARCHIVED"),
  row("published-hidden","PUBLISHED"),
  row("published-already-shown","PUBLISHED",true),
 ];
 state.write.mockReset().mockResolvedValue({id:"published-hidden"});
 state.acting.mockReset().mockResolvedValue({collegeId:"22222222-2222-4222-8222-222222222222",
  organizationId:"33333333-3333-4333-8333-333333333333"});
 state.select.mockReset().mockImplementation(()=>({from(){return this;},innerJoin(){return this;},
  where(){return this;},limit:async()=>state.rows}));
});
describe("SA-academics-people-53 bulk course/lesson visibility never alters future content",()=>{
 it("changes only published items whose visibility differs and retains drafts/archived content",async()=>{
  const result=await bulkSuperAdminLessonVisibility(context,{lessonIds:[lessonId],
   visibleToStudents:true,confirmed:true});
  expect(state.write).toHaveBeenCalledTimes(1);
  expect(state.write).toHaveBeenCalledWith(context,{
   lessonContentId:"published-hidden",visibleToStudents:true,
   expectedUpdatedAt:"2099-01-01T12:00:00.000Z",confirmed:true,
  });
  expect(result.matchedContents).toBe(4);
  expect(result.changed).toBe(1);
  expect(result.unchanged).toBe(3);
  expect(result.failures).toEqual([]);
 });
 it("returns accurate partial failures without trying to mutate unpublished records",async()=>{
  state.write.mockRejectedValueOnce(Error("SQL details and secrets"));
  const result=await bulkSuperAdminLessonVisibility(context,{lessonIds:[lessonId],
   visibleToStudents:true,confirmed:true});
  expect(result.changed).toBe(0);
  expect(result.failures).toHaveLength(1);
  expect(result.failures[0]?.id).toBe("published-hidden");
  expect(result.failures[0]?.reason).not.toContain("SQL details");
  expect(state.write).toHaveBeenCalledTimes(1);
 });
 it("limits bulk visibility SQL to published content under active parents and a published path",()=>{
  const source=readFileSync("src/modules/courses/super-admin-lesson-bulk-visibility.ts","utf8");
  for(const condition of [
   'eq(lessonContents.status,"PUBLISHED")',
   'eq(courseLearningPaths.status,"PUBLISHED")',
   'eq(courseLessons.status,"ACTIVE")',
   'eq(courseOfferings.status,"ACTIVE")',
   'eq(courses.status,"ACTIVE")',
   'eq(departments.collegeId,acting.collegeId)',
   'eq(academicPeriods.collegeId,acting.collegeId)',
   'row.status!=="PUBLISHED"',
  ])expect(source).toContain(condition);
 });
 it("never opens database queries when the input is unconfirmed or exceeds the allowed lesson batch",async()=>{
  for(const input of [
   {lessonIds:[lessonId],visibleToStudents:true,confirmed:false},
   {lessonIds:[lessonId,lessonId],visibleToStudents:true,confirmed:true},
   {lessonIds:Array.from({length:26},(_,i)=>"00000000-0000-4000-8000-"+String(i).padStart(12,"0")),
    visibleToStudents:true,confirmed:true},
  ])await expect(bulkSuperAdminLessonVisibility(context,input)).rejects.toThrow();
  expect(state.select).not.toHaveBeenCalled();
  expect(state.write).not.toHaveBeenCalled();
 });
});
