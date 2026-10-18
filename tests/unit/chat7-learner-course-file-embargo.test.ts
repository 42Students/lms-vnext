import {beforeEach,describe,expect,it,vi} from "vitest";
import {readFileSync} from "node:fs";
import type {RequestContext} from "@/modules/identity/context";

const state=vi.hoisted(()=>({
 delivery:vi.fn(),access:vi.fn(),select:vi.fn(),rows:[] as Array<{storageKey:string|null}>,
}));
vi.mock("@/modules/courses/scope",()=>({loadCourseSectionDeliveryScope:state.delivery}));
vi.mock("@/modules/courses/learning-access",()=>({requireLearningReadAccess:state.access}));
vi.mock("@/db/client",()=>({getDb:()=>({select:state.select})}));
import {getLearnerCourseFileReference} from "@/modules/courses/learner-course-file-reference-service";

const context={} as RequestContext;
const deliveryId="11111111-1111-4111-8111-111111111111";
const contentId="22222222-2222-4222-8222-222222222222";
const offeringId="33333333-3333-4333-8333-333333333333";
beforeEach(()=>{
 state.delivery.mockReset().mockResolvedValue({id:deliveryId,offeringId,endedAt:null});
 state.access.mockReset().mockResolvedValue("LEARNER");
 state.rows=[{storageKey:"courses/tenant/lesson/resource.pdf"}];
 state.select.mockReset().mockImplementation(()=>({
  from(){return this;},innerJoin(){return this;},where(){return this;},
  limit:async()=>state.rows,
 }));
});
describe("LEARNER-COURSE-FILE-EMBARGO-01 private course file read boundary",()=>{
 it("rejects malformed Section/content IDs before consulting the database or granting access",async()=>{
  await expect(getLearnerCourseFileReference(context,"invalid",contentId)).rejects.toThrow();
  await expect(getLearnerCourseFileReference(context,deliveryId,"invalid")).rejects.toThrow();
  expect(state.delivery).not.toHaveBeenCalled();
  expect(state.select).not.toHaveBeenCalled();
 });
 it("denies faculty or revoked learner before loading any storage reference",async()=>{
  for(const mode of ["FACULTY","ADMIN"]){
   state.access.mockResolvedValueOnce(mode);
   await expect(getLearnerCourseFileReference(context,deliveryId,contentId)).rejects.toThrow();
  }
  state.access.mockRejectedValueOnce(Error("Enrollment revoked"));
  await expect(getLearnerCourseFileReference(context,deliveryId,contentId)).rejects.toThrow();
  expect(state.select).not.toHaveBeenCalled();
 });
 it("returns a private object key only after scoped learner authorization",async()=>{
  expect(await getLearnerCourseFileReference(context,deliveryId,contentId))
   .toBe("courses/tenant/lesson/resource.pdf");
  expect(state.delivery).toHaveBeenCalledWith(deliveryId,true);
  expect(state.access).toHaveBeenCalledWith(context,offeringId,deliveryId,{
   includeHistorical:true,
  });
  expect(state.select).toHaveBeenCalledTimes(1);
 });
 it("reports unavailable storage only as null, not a fabricated file key",async()=>{
  state.rows=[];
  expect(await getLearnerCourseFileReference(context,deliveryId,contentId)).toBeNull();
 });
 it("ensures a future startsAt is excluded by PostgreSQL time before any signed URL can be minted",()=>{
  const service=readFileSync("src/modules/courses/learner-course-file-reference-service.ts","utf8");
  for(const gate of [
   "eq(courseLearningPaths.offeringId,delivery.offeringId)",
   'inArray(courseLearningPaths.status,delivery.endedAt?["PUBLISHED","ARCHIVED"]:["PUBLISHED"])',
   'eq(courseLessons.visibleToStudents,true)',
   'eq(lessonContents.status,"PUBLISHED")',
   'eq(lessonContents.visibleToStudents,true)',
   'or(isNull(lessonContents.startsAt),lte(lessonContents.startsAt,',
   'sql`now()`',
   "or(isNull(lessonContents.deliveryId),eq(lessonContents.deliveryId,deliveryId))",
  ])expect(service).toContain(gate);
  const route=readFileSync("src/app/api/courses/deliveries/[deliveryId]/contents/[contentId]/file/route.ts","utf8");
  expect(route.indexOf("getLearnerCourseFileReference")).toBeLessThan(route.indexOf("headObject(config,key)"));
  expect(route.indexOf("headObject(config,key)")).toBeLessThan(route.indexOf("presignUrl(config,"));
  expect(route).toContain('expiresSeconds:900');
  expect(route).toContain('"Cache-Control":"private, no-store"');
 });
});
