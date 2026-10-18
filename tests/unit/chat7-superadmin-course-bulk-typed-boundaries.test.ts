import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {CoursesServiceError} from "@/modules/courses/errors";
import {apiErrorResponse} from "@/lib/api-error";

const state=vi.hoisted(()=>({
 selected:[] as Array<{id:string}>,
 lessons:[] as Array<{id:string;courseId:string}>,
 select:vi.fn(),acting:vi.fn(),lessonBulk:vi.fn(),
}));
vi.mock("@/db/client",()=>({getDb:()=>({select:state.select})}));
vi.mock("@/modules/permissions/acting-college",()=>({resolveActingCollege:state.acting}));
vi.mock("@/modules/courses/super-admin-lesson-bulk-visibility",()=>({
 bulkSuperAdminLessonVisibility:state.lessonBulk,
}));
import {bulkSuperAdminCourseVisibility} from "@/modules/courses/super-admin-course-bulk-visibility";

const courseId="11111111-1111-4111-8111-111111111111";
const lessonId="22222222-2222-4222-8222-222222222222";
const context={user:{id:"acting-superadmin"}} as unknown as RequestContext;
beforeEach(()=>{
 state.selected=[{id:courseId}];state.lessons=[{id:lessonId,courseId}];
 state.select.mockReset();state.acting.mockReset().mockResolvedValue({
  collegeId:"33333333-3333-4333-8333-333333333333",
  organizationId:"44444444-4444-4444-8444-444444444444",
 });
 state.lessonBulk.mockReset().mockResolvedValue({
  matchedContents:1,changed:1,unchanged:0,failures:[],
 });
 let call=0;
 state.select.mockImplementation(()=>{
  const rows=(call++%2===0)?state.selected:state.lessons;
  return {from(){return this;},innerJoin(){return this;},where(){return this;},
   limit:async()=>rows,then(resolve:(value:unknown)=>unknown,reject:(reason:unknown)=>unknown){
    return Promise.resolve(rows).then(resolve,reject);
   }};
 });
});
const input={courseIds:[courseId],visibleToStudents:true,confirmed:true};
describe("SA-academics-people-53 scoped bulk course visibility and recoverable input errors",()=>{
 it("never discloses another college's Course existence as a generic 500",async()=>{
  state.selected=[];
  await expect(bulkSuperAdminCourseVisibility(context,input)).rejects.toMatchObject({
   name:"CoursesServiceError",code:"COURSE_NOT_FOUND",
  });
  expect(state.lessonBulk).not.toHaveBeenCalled();
 });
 it("returns typed 400-class size conflict before opening any content mutation",async()=>{
  state.lessons=Array.from({length:501},(_,i)=>({id:"lesson-"+i,courseId}));
  await expect(bulkSuperAdminCourseVisibility(context,input)).rejects.toMatchObject({
   name:"CoursesServiceError",code:"COURSE_VISIBILITY_BULK_TOO_LARGE",
  });
  expect(state.lessonBulk).not.toHaveBeenCalled();
 });
 it("executes only selected scoped lessons and returns precise partial success totals",async()=>{
  const result=await bulkSuperAdminCourseVisibility(context,input);
  expect(state.lessonBulk).toHaveBeenCalledWith(context,{lessonIds:[lessonId],
   visibleToStudents:true,confirmed:true});
  expect(result).toEqual({
   selectedCourses:1,matchedLessons:1,matchedContents:1,
   changed:1,unchanged:0,failures:[],failedCourseIds:[],
  });
 });
 it("keeps per-course retry IDs when published content updates fail",async()=>{
  state.lessonBulk.mockResolvedValueOnce({
   matchedContents:1,changed:0,unchanged:0,
   failures:[{id:"content-id",lessonId,reason:"This content could not be updated."}],
  });
  const result=await bulkSuperAdminCourseVisibility(context,input);
  expect(result.failedCourseIds).toEqual([courseId]);
  expect(result.failures).toHaveLength(1);
  expect(result.changed).toBe(0);
 });
 it("rejects repeated, forged or unconfirmed course IDs before resolving a tenant",async()=>{
  for(const invalid of [
   {...input,confirmed:false},
   {...input,courseIds:[courseId,courseId]},
   {...input,courseIds:["invalid"]},
   {...input,collegeId:courseId},
  ]){
   await expect(bulkSuperAdminCourseVisibility(context,invalid)).rejects.toThrow();
  }
  expect(state.acting).not.toHaveBeenCalled();
 });
 it("maps huge visibility requests to friendly HTTP 400 and foreign course IDs to HTTP 404",async()=>{
  for(const [code,status] of [
   ["COURSE_VISIBILITY_BULK_TOO_LARGE",400],
   ["COURSE_NOT_FOUND",404],
  ] as const){
   const response=apiErrorResponse(new CoursesServiceError(code));
   expect(response.status).toBe(status);
   expect(response.headers.get("x-request-id")).toBeTruthy();
   const body=await response.json();
   expect(body.error).toBe(code);
   expect(typeof body.message).toBe("string");
   expect(body.message.length).toBeGreaterThan(0);
  }
 });
 it("keeps typed limit errors in the standard customer-safe API mapper",()=>{
  expect(new CoursesServiceError("COURSE_VISIBILITY_BULK_TOO_LARGE").code)
   .toBe("COURSE_VISIBILITY_BULK_TOO_LARGE");
 });
});
