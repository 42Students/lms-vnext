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
 it("applies active department and exact college restriction to both catalog and published evidence",()=>{
  const config=readFileSync("src/modules/placements/tpo-configuration-read-service.ts","utf8");
  const derived=readFileSync("src/modules/placements/tpo-prep-readiness-derived-service.ts","utf8");
  const catalog=config.slice(config.indexOf("export async function listTpoPrepCourses("));
  const evidence=derived.slice(derived.indexOf("const contents=await db.select("));
  expect(catalog).toContain("isNull(departments.archivedAt)");
  expect(catalog).toContain('eq(departments.collegeId,collegeId)');
  expect(catalog).toContain('eq(courses.status,"ACTIVE")');
  expect(evidence).toContain("isNull(departments.archivedAt)");
  expect(evidence).toContain('eq(departments.collegeId,collegeId)');
  expect(evidence).toContain('eq(courseOfferings.status,"ACTIVE")');
  expect(evidence).toContain('eq(lessonContents.status,"PUBLISHED")');
  expect(evidence).toContain('inArray(courseOfferings.cohortId,requestedCohortIds)');
  expect(derived).toContain("hasEveryScopedTpoPrepLearner(learners,enrolled)");
 });
});
