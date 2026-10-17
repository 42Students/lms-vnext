import {describe,expect,it} from "vitest";
import {learnerAssessmentAuthorizedCourse,learnerAssessmentCourseHref} from "@/modules/courses/learner-assessment-course-query-model";
const first="11111111-1111-4111-8111-111111111111";
const other="22222222-2222-4222-8222-222222222222";
describe("LEARNER-learning-misc-15 server course scope",()=>{
 it("LEARNER-learning-misc-15 restricts requested query to the learner's already-scoped deliveries",()=>{
  const courses=[{courseId:first}];
  expect(learnerAssessmentAuthorizedCourse(first,courses)).toBe(first);
  expect(learnerAssessmentAuthorizedCourse(other,courses)).toBeNull();
  expect(learnerAssessmentAuthorizedCourse("../admin",courses)).toBeNull();
  expect(learnerAssessmentAuthorizedCourse([first],courses)).toBeNull();
  expect(learnerAssessmentAuthorizedCourse(null,courses)).toBeNull();
 });
 it("LEARNER-learning-misc-15 builds canonical course-filter links for assignment and quiz pages",()=>{
  expect(learnerAssessmentCourseHref("ASSIGNMENT",first)).toBe("/learn/allAssignments?course="+first);
  expect(learnerAssessmentCourseHref("QUIZ",first)).toBe("/learn/allQuizzes?course="+first);
  expect(learnerAssessmentCourseHref("QUIZ",null)).toBe("/learn/allQuizzes");
 });
});
