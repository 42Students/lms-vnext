import {describe,expect,it} from "vitest";
import {learnerCourseNextItemHref} from "@/modules/courses/learner-course-next-action-model";
const a="11111111-1111-4111-8111-111111111111";
const b="22222222-2222-4222-8222-222222222222";
const row={readOnly:false,learningPathReady:true,course:{deliveryId:a},
  nextItem:{lessonId:b,itemId:a,kind:"QUIZ" as const}};
describe("Course next action deep link",()=>{
 it("links directly to the exact published next assessment",()=>{
  expect(learnerCourseNextItemHref(row)).toBe(
   `/learn/courses/${a}/roadmap?filter=assessments&lesson=${b}&content=${a}`);
 });
 it("hides shortcuts for archived, unpublished and malformed items",()=>{
  expect(learnerCourseNextItemHref({...row,readOnly:true})).toBeNull();
  expect(learnerCourseNextItemHref({...row,learningPathReady:false})).toBeNull();
  expect(learnerCourseNextItemHref({...row,nextItem:null})).toBeNull();
  expect(learnerCourseNextItemHref({...row,course:{deliveryId:"../../foreign"}})).toBeNull();
 });
});
