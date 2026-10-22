import {beforeEach,describe,expect,it,vi} from "vitest";
import {readFileSync} from "node:fs";
import type {RequestContext} from "@/modules/identity/context";

const state=vi.hoisted(()=>({
 delivery:vi.fn(),access:vi.fn(),select:vi.fn(),rows:[] as Array<{
  key:string|null;status:string;scan:string;generation:string|null;
  scanAttestedAt:Date|null;verifiedSize:number|null;
 }>,
}));
vi.mock("@/modules/courses/scope",()=>({loadCourseSectionDeliveryScope:state.delivery}));
vi.mock("@/modules/courses/learning-access",()=>({requireLearningReadAccess:state.access}));
vi.mock("@/db/client",()=>({getDb:()=>({select:state.select})}));
import {getLearnerCourseFileReference} from "@/modules/courses/learner-course-file-reference-service";

const context={} as RequestContext;
const deliveryId="11111111-1111-4111-8111-111111111111";
const contentId="22222222-2222-4222-8222-222222222222";
const offeringId="33333333-3333-4333-8333-333333333333";
const collegeId="44444444-4444-4444-8444-444444444444";
const resourceId="55555555-5555-4555-8555-555555555555";
const storageKey="private/"+collegeId+"/"+resourceId+"/course-resource/"+contentId;
beforeEach(()=>{
 state.delivery.mockReset().mockResolvedValue({id:deliveryId,offeringId,collegeId,endedAt:null});
 state.access.mockReset().mockResolvedValue("LEARNER");
 state.rows=[{key:storageKey,status:"READY",scan:"CLEAN",generation:"object-v1",
  scanAttestedAt:new Date("2026-10-01T00:00:00.000Z"),verifiedSize:1024}];
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
   .toBe(storageKey);
  expect(state.delivery).toHaveBeenCalledWith(deliveryId,true);
  expect(state.access).toHaveBeenCalledWith(context,offeringId,deliveryId,{
   includeHistorical:true,
  });
  expect(state.select).toHaveBeenCalledTimes(1);
 });
 it("rejects an unscanned or foreign-college file even after learner authorization",async()=>{
  state.rows=[{...state.rows[0]!,scan:"PENDING"}];
  expect(await getLearnerCourseFileReference(context,deliveryId,contentId)).toBeNull();
  state.rows=[{...state.rows[0]!,scan:"CLEAN",key:"private/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/"+resourceId+"/course-resource/"+contentId}];
  expect(await getLearnerCourseFileReference(context,deliveryId,contentId)).toBeNull();
 });
 it("reports unavailable storage only as null, not a fabricated file key",async()=>{
  state.rows=[];
  expect(await getLearnerCourseFileReference(context,deliveryId,contentId)).toBeNull();
 });
 it("forbids VIDEO direct R2 download bypass and future startsAt before signing a file",()=>{
  const service=readFileSync("src/modules/courses/learner-course-file-reference-service.ts","utf8");
  for(const gate of [
   'eq(lessonContents.contentType,"RESOURCE")',
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
