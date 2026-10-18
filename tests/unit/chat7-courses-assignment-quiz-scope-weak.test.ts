import {beforeEach,describe,expect,it,vi} from "vitest";
const state=vi.hoisted(()=>({
 rows:[] as unknown[][],select:vi.fn(),lesson:vi.fn(),delivery:vi.fn(),
}));
vi.mock("@/db/client",()=>({getDb:()=>({select:state.select})}));
vi.mock("@/modules/courses/scope",()=>({
 loadCourseLessonScope:state.lesson,loadCourseSectionDeliveryScope:state.delivery,
}));
import {loadCourseAssignmentScope,loadAssignmentSubmissionScope} from "@/modules/courses/assignment-scope";
import {loadCourseQuizScope,loadQuizAttemptScope} from "@/modules/courses/quiz-scope";

const assignmentId="11111111-1111-4111-8111-111111111111";
const submissionId="22222222-2222-4222-8222-222222222222";
const deliveryId="33333333-3333-4333-8333-333333333333";
const otherDelivery="44444444-4444-4444-8444-444444444444";
const lesson={offeringId:"course-offering",learningPathId:"learning-path",learningPathStatus:"PUBLISHED",
 visibleToStudents:true,collegeId:"college",organizationId:"organization"};
const assignment={id:assignmentId,lessonId:"lesson",deliveryId:null,status:"PUBLISHED",maxPoints:10};
const quiz={id:assignmentId,lessonId:"lesson",deliveryId:null,status:"PUBLISHED",resultsPublished:false,maxAttempts:2};
beforeEach(()=>{
 state.select.mockReset();state.lesson.mockReset();state.delivery.mockReset();
 state.rows=[];state.lesson.mockResolvedValue(lesson);
 state.delivery.mockResolvedValue({id:deliveryId,offeringId:lesson.offeringId});
 state.select.mockImplementation(()=>({
  from(){return this;},where(){return this;},limit(){return Promise.resolve(state.rows.shift()??[]);},
 }));
});
describe("COURSES-WEAK-SCOPE-01 assignment and quiz object-delivery ancestry, archived reads and tenant separation",()=>{
 for(const [kind,load,row,errorCode] of [
  ["assignment",loadCourseAssignmentScope,assignment,"ASSIGNMENT_DELIVERY_MISMATCH"],
  ["quiz",loadCourseQuizScope,quiz,"QUIZ_DELIVERY_MISMATCH"],
 ] as const){
  it(`${kind} returns only scope inherited from authorized lesson ancestry`,async()=>{
   state.rows=[[row]];
   const result=await load(assignmentId);
   expect(result).toMatchObject({offeringId:lesson.offeringId,
    collegeId:lesson.collegeId,organizationId:lesson.organizationId});
   expect(state.lesson).toHaveBeenCalledWith("lesson",false);
   expect(state.delivery).not.toHaveBeenCalled();
  });
  it(`${kind} rejects its delivery when the current offering does not match its lesson`,async()=>{
   state.rows=[[{...row,deliveryId}]];
   state.delivery.mockResolvedValueOnce({id:deliveryId,offeringId:"other-college-offering"});
   await expect(load(assignmentId)).rejects.toMatchObject({code:errorCode});
  });
  it(`${kind} reports missing entity without reading a foreign lesson`,async()=>{
   state.rows=[[]];
   await expect(load(assignmentId)).rejects.toMatchObject({code:kind==="quiz"?"QUIZ_NOT_FOUND":"ASSIGNMENT_NOT_FOUND"});
   expect(state.lesson).not.toHaveBeenCalled();
  });
  it(`${kind} allows deliberate includeArchived=true only on scoped administrative readers`,async()=>{
   state.rows=[[row]];
   await load(assignmentId,true);
   expect(state.lesson).toHaveBeenCalledWith("lesson",true);
  });
 }
 it("submission read refuses related delivery from another offering, even when assignment itself is valid",async()=>{
  state.rows=[[{id:submissionId,assignmentId,deliveryId}], [assignment]];
  state.delivery.mockResolvedValueOnce({id:deliveryId,offeringId:"other-offering"});
  await expect(loadAssignmentSubmissionScope(submissionId)).rejects.toMatchObject({code:"ASSIGNMENT_DELIVERY_MISMATCH"});
 });
 it("submission read refuses different section for a section-specific assignment",async()=>{
  state.rows=[[{id:submissionId,assignmentId,deliveryId:otherDelivery}], [{...assignment,deliveryId}]];
  state.delivery.mockResolvedValueOnce({id:deliveryId,offeringId:lesson.offeringId});
  state.delivery.mockResolvedValueOnce({id:otherDelivery,offeringId:lesson.offeringId});
  await expect(loadAssignmentSubmissionScope(submissionId)).rejects.toMatchObject({code:"ASSIGNMENT_DELIVERY_MISMATCH"});
 });
 it("quiz attempt read denies cross-offering or wrong-section attempts without exposing published answer keys",async()=>{
  state.rows=[[{id:submissionId,quizId:assignmentId,deliveryId}], [quiz]];
  state.delivery.mockResolvedValueOnce({id:deliveryId,offeringId:"foreign-offering"});
  await expect(loadQuizAttemptScope(submissionId)).rejects.toMatchObject({code:"QUIZ_DELIVERY_MISMATCH"});
  expect(state.lesson).toHaveBeenCalled();
 });
 it("authorized quiz attempt metadata carries resultsPublished without bypassing scoped parent course",async()=>{
  state.rows=[[{id:submissionId,quizId:assignmentId,deliveryId}], [quiz]];
  const result=await loadQuizAttemptScope(submissionId);
  expect(result).toMatchObject({collegeId:"college",organizationId:"organization",
   quizResultsPublished:false,maxAttempts:2});
 });
});
