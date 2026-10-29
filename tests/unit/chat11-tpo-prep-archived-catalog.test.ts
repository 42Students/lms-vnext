import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {deriveTpoPrepCourseOutcome} from "@/modules/placements/tpo-prep-readiness-derivation";
import {buildTpoPreparationCoursePlan} from "@/modules/placements/tpo-preparation-course-plan-model";
const id="11111111-1111-4111-8111-111111111111";

describe("TPO-settings-audit-PREP-CATALOG-07 archive-safe preparation courses",()=>{
 it("refuses to mark a learner unprepared when their course has no active published content",()=>{
  const result=deriveTpoPrepCourseOutcome({
   courseIds:[id],minimumCompleted:1,progressThresholdPct:60,
  },[{courseId:id,totalContent:0,completedContent:0}]);
  expect(result).toBe("UNAVAILABLE");
  expect(deriveTpoPrepCourseOutcome({
   courseIds:[id],minimumCompleted:1,progressThresholdPct:60,
  },[{courseId:id,totalContent:1,completedContent:1}])).toBe("READY");
 });
 it("keeps an inactive selected course explicitly unresolved, not silently resaved",()=>{
  const result=buildTpoPreparationCoursePlan({
   ready:true,courseIds:[id],minimumCompleted:1,catalog:[],
  });
  expect(result.unresolved).toBe(1);
  expect(result.courses).toEqual([]);
  expect(result.minimumCompleted).toBe(1);
 });
 it("applies active departments and same-organization course scope to catalog and published evidence",()=>{
  const config=readFileSync("src/modules/placements/tpo-configuration-read-service.ts","utf8");
  const derived=readFileSync("src/modules/placements/tpo-prep-readiness-derived-service.ts","utf8");
  const catalog=config.slice(config.indexOf("export async function listTpoPrepCourses("));
  const evidence=derived.slice(derived.indexOf("const contents=await db.select("));
  expect(catalog).toContain("isNull(departments.archivedAt)");
  expect(catalog).toContain('eq(colleges.organizationId,college.organizationId)');
  expect(catalog).toContain('eq(colleges.status,"ACTIVE")');
  expect(catalog).toContain('eq(courses.status,"ACTIVE")');
  expect(evidence).toContain("isNull(departments.archivedAt)");
  expect(evidence).toContain('eq(colleges.organizationId,scope.organizationId)');
  expect(evidence).toContain('eq(colleges.status,"ACTIVE")');
  expect(evidence).toContain('eq(courseOfferings.status,"ACTIVE")');
  expect(evidence).toContain('eq(lessonContents.status,"PUBLISHED")');
  expect(evidence).toContain('inArray(courseOfferings.cohortId,requestedCohortIds)');
  expect(derived).toContain("hasEveryScopedTpoPrepLearner(learners,enrolled)");
 });
 it("rejects an archived department or archived college even when the client submits a valid course UUID",()=>{
  const writer=readFileSync("src/modules/placements/tpo-prep-readiness-write-service.ts","utf8");
  const lock=writer.indexOf('.for("update")');
  const active=writer.indexOf('college.status!=="ACTIVE"',lock);
  const permission=writer.indexOf('assertPersistedPlatformPermission(tx,context,"placements.manage"',lock);
  const course=writer.indexOf('inArray(courses.id,input.courseIds)',permission);
  const insert=writer.indexOf('.onConflictDoUpdate(',course);
  expect(lock).toBeGreaterThan(0);
  expect(active).toBeGreaterThan(lock);
  expect(permission).toBeGreaterThan(active);
  expect(course).toBeGreaterThan(permission);
  expect(insert).toBeGreaterThan(course);
  expect(writer.slice(permission,insert)).toContain("isNull(departments.archivedAt)");
  expect(writer.slice(permission,insert)).toContain("PREP_INVALID_COURSE");
 });
});
