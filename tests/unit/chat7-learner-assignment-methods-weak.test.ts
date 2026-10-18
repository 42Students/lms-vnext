import {beforeEach,describe,expect,it,vi} from "vitest";
const id="11111111-1111-4111-8111-111111111111";
const delivery="22222222-2222-4222-8222-222222222222";
const wrong="33333333-3333-4333-8333-333333333333";
const base={
 status:"PUBLISHED",lessonVisibleToStudents:true,learningPathStatus:"PUBLISHED",
 offeringId:"offering-1",deliveryId:null as string|null,
};
const state=vi.hoisted(()=>({
 load:vi.fn(),access:vi.fn(),select:vi.fn(),methods:[] as unknown,rows:1,
}));
vi.mock("@/modules/courses/assignment-scope",()=>({loadCourseAssignmentScope:state.load}));
vi.mock("@/modules/courses/learning-access",()=>({requireLearningReadAccess:state.access}));
vi.mock("@/db/client",()=>({getDb:()=>({select:state.select})}));
import {getLearnerAssignmentMethods} from "@/modules/courses/learner-assignment-methods-service";
import {ALL_ASSIGNMENT_METHODS} from "@/modules/courses/assignment-submission-methods";
const context=(roles:string[]=["LEARNER"])=>({membership:{roles}} as Parameters<typeof getLearnerAssignmentMethods>[0]);
beforeEach(()=>{
 state.load.mockReset();state.access.mockReset();state.select.mockReset();
 state.load.mockResolvedValue({...base});
 state.access.mockResolvedValue("LEARNER");
 state.methods=["PDF_UPLOAD","REPOSITORY_LINK"];
 state.rows=1;
 state.select.mockImplementation(()=>({
  from(){return this;},where(){return this;},
  limit(){return Promise.resolve(state.rows?[{methods:state.methods}]:[]);},
 }));
});
describe("COURSES-WEAK-LEARNER-METHODS-02 assignment submission method entitlement",()=>{
 it("rejects malformed IDs at boundary before touching persisted assignment or access reader",async()=>{
  for(const raw of [null,"not-uuid",{},123]){
   await expect(getLearnerAssignmentMethods(context(),raw,delivery)).rejects.toThrow();
  }
  expect(state.load).not.toHaveBeenCalled();
 });
 it("returns only the persisted authorized submission methods for the selected learner delivery",async()=>{
  await expect(getLearnerAssignmentMethods(context(),id,delivery)).resolves.toEqual(["PDF_UPLOAD","REPOSITORY_LINK"]);
  expect(state.load).toHaveBeenCalledWith(id);
  expect(state.access).toHaveBeenCalledWith(context(),base.offeringId,delivery);
  expect(state.select).toHaveBeenCalledTimes(1);
 });
 it("rejects hidden, draft and delivery-scoped assessment before DB methods may be read",async()=>{
  const denied=[
   {status:"DRAFT"},{status:"ARCHIVED"},{lessonVisibleToStudents:false},
   {learningPathStatus:"DRAFT"},{deliveryId:wrong},
  ];
  for(const override of denied){
   state.load.mockResolvedValueOnce({...base,...override});
   await expect(getLearnerAssignmentMethods(context(),id,delivery)).rejects.toThrow();
  }
  expect(state.select).not.toHaveBeenCalled();
 });
 it("does not disclose methods to Faculty, outsider or course-history-only reader",async()=>{
  state.access.mockResolvedValueOnce("FACULTY");
  await expect(getLearnerAssignmentMethods(context(),id,delivery)).rejects.toThrow();
  await expect(getLearnerAssignmentMethods(context(["FACULTY"]),id,delivery)).rejects.toThrow();
  expect(state.select).not.toHaveBeenCalled();
 });
 it("rejects missing published policy row rather than synthesizing another assignment",async()=>{
  state.rows=0;
  await expect(getLearnerAssignmentMethods(context(),id,delivery)).rejects.toThrow();
 });
 it("preserves every legacy permitted submission type if migrating DB method list is malformed",async()=>{
  state.methods=["WRITTEN_RESPONSE","WRITTEN_RESPONSE"];
  await expect(getLearnerAssignmentMethods(context(),id,delivery)).resolves.toEqual(ALL_ASSIGNMENT_METHODS);
  state.methods=null;
  await expect(getLearnerAssignmentMethods(context(),id,delivery)).resolves.toEqual(ALL_ASSIGNMENT_METHODS);
 });
});
