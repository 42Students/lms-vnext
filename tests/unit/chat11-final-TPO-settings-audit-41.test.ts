import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {deriveTpoPrepCourseOutcome} from "@/modules/placements/tpo-prep-readiness-derivation";
const policy={courseIds:["a","b"],minimumCompleted:1,progressThresholdPct:75};
const evidence=[{courseId:"a",totalContent:2,completedContent:2},
                {courseId:"b",totalContent:2,completedContent:1}];
describe("TPO persisted course progress readiness",()=>{
 it("TPO-settings-audit-41 marks a learner prepared when completed-course and average-progress rules pass",()=>{
  expect(deriveTpoPrepCourseOutcome(policy,evidence)).toBe("READY");
  expect(deriveTpoPrepCourseOutcome({...policy,minimumCompleted:2},evidence)).toBe("NEEDS_PREP");
  expect(deriveTpoPrepCourseOutcome({...policy,progressThresholdPct:80},evidence)).toBe("NEEDS_PREP");
 });
 it("TPO-settings-audit-41 does not infer failure from missing completions or unconfigured policy",()=>{
  expect(deriveTpoPrepCourseOutcome({...policy,courseIds:[]},[])).toBe("UNCONFIGURED");
  expect(deriveTpoPrepCourseOutcome(policy,null)).toBe("UNAVAILABLE");
  expect(deriveTpoPrepCourseOutcome(policy,[evidence[0]])).toBe("UNAVAILABLE");
  expect(deriveTpoPrepCourseOutcome(policy,[{courseId:"a",totalContent:0,completedContent:0},evidence[1]])).toBe("UNAVAILABLE");
 });
 it("TPO-settings-audit-41 refuses invalid or contradictory progress evidence",()=>{
  expect(deriveTpoPrepCourseOutcome(policy,[{courseId:"a",totalContent:2,completedContent:4},evidence[1]])).toBe("UNAVAILABLE");
  expect(deriveTpoPrepCourseOutcome({...policy,minimumCompleted:3},evidence)).toBe("UNAVAILABLE");
  expect(deriveTpoPrepCourseOutcome({...policy,progressThresholdPct:101},evidence)).toBe("UNAVAILABLE");
 });
 it("TPO-settings-audit-41 reads only active published college content and completedAt records",()=>{
  const service=readFileSync("src/modules/placements/tpo-prep-readiness-derived-service.ts","utf8");
  const roster=readFileSync("src/modules/placements/tpo-students-service.ts","utf8");
  for(const fragment of ['eq(colleges.organizationId,scope.organizationId)','eq(courseLearningPaths.status,"PUBLISHED")',
   'eq(lessonContents.status,"PUBLISHED")','isNotNull(learnerContentProgress.completedAt)',
   "getTpoPrepReadiness(context)","getTpoCommunicationSettings(context)"])
    expect(service).toContain(fragment);
  expect(roster).toContain("readTpoLearnerPrepOutcomes(context,college.id");
  expect(roster).toContain('journeyState:"NEEDS_READINESS_SUPPORT" as const');
  expect(roster).toContain("prepCourseEvidenceAvailable:prep.available");
 });
});
