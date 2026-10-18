import {beforeEach,describe,expect,it,vi} from "vitest";
const state=vi.hoisted(()=>({
 academic:vi.fn(),courses:vi.fn(),faculty:vi.fn(),relations:vi.fn(),
 paths:vi.fn(),lessons:vi.fn(),contents:vi.fn(),assignments:vi.fn(),quizzes:vi.fn(),
 offering:vi.fn(),permission:vi.fn(),
}));
vi.mock("@/modules/academics/workspace",()=>({getAcademicsWorkspace:state.academic}));
vi.mock("@/modules/courses/course-service",()=>({listCourses:state.courses}));
vi.mock("@/modules/courses/college-faculty-picker-service",()=>({listCollegeFacultyPicker:state.faculty}));
vi.mock("@/modules/courses/college-course-setup-relations-service",()=>({listCollegeCourseSetupRelations:state.relations}));
vi.mock("@/modules/courses/learning-path-service",()=>({listLearningPaths:state.paths}));
vi.mock("@/modules/courses/lesson-service",()=>({listCourseLessons:state.lessons}));
vi.mock("@/modules/courses/lesson-content-service",()=>({listLessonContents:state.contents}));
vi.mock("@/modules/courses/assignment-service",()=>({listCourseAssignments:state.assignments}));
vi.mock("@/modules/courses/quiz-service",()=>({listCourseQuizzes:state.quizzes}));
vi.mock("@/modules/courses/scope",()=>({loadCourseOfferingScope:state.offering}));
vi.mock("@/modules/permissions/policy",()=>({requirePermission:state.permission}));
import {getAdminCourseWorkspace} from "@/modules/courses/admin-course-workspace";
import {getAdminOfferingLearningWorkspace} from "@/modules/courses/admin-offering-learning-workspace";
const context={} as Parameters<typeof getAdminCourseWorkspace>[0];
const academic={departments:[],periods:[{id:"period",name:"Term 1",code:"T1"}],
 programs:[],cohorts:[{id:"cohort",name:"Cohort",code:"C"}],sections:[]};
const course={id:"course",name:"Course",code:"CS",departmentName:"Department"};
const offering={id:"offering",collegeId:"college",organizationId:"org",
 courseId:"course",cohortId:"cohort",academicPeriodId:"period"};
beforeEach(()=>{
 for(const mock of Object.values(state))mock.mockReset();
 state.academic.mockResolvedValue(academic);
 state.courses.mockResolvedValue([course]);
 state.faculty.mockResolvedValue({faculty:[{membershipId:"person"}],truncated:false});
 state.relations.mockResolvedValue({offerings:[{status:"ACTIVE"},{status:"ARCHIVED"}],
  deliveries:[{id:"delivery"}],teachingAssignments:[]});
 state.offering.mockResolvedValue(offering);
 state.paths.mockResolvedValue([]);
 state.lessons.mockResolvedValue([{id:"lesson1",name:"Week 1"}]);
 state.contents.mockResolvedValue([{sequence:2},{sequence:6}]);
 state.assignments.mockResolvedValue([{sequence:4}]);
 state.quizzes.mockResolvedValue([{sequence:0}]);
});
describe("COURSES-WEAK-WORKSPACES-01 explicit authorized course and offering workspace orchestration",()=>{
 it("College/Admin course workspace reads all four scoped sources once with the same actor and college",async()=>{
  const workspace=await getAdminCourseWorkspace(context,"college",true);
  expect(workspace.collegeId).toBe("college");
  expect(workspace.summary).toEqual({courses:1,offerings:1,deliveries:1,teachingAssignments:0});
  expect(workspace.facultyTruncated).toBe(false);
  for(const mock of [state.academic,state.courses,state.faculty])expect(mock).toHaveBeenCalledWith(context,"college");
  expect(state.relations).toHaveBeenCalledWith(context,"college",true);
 });
 it("offering page resolves the persisted offering and grants courses.manage before assembling scoped data",async()=>{
  const workspace=await getAdminOfferingLearningWorkspace(context,"offering");
  expect(state.offering).toHaveBeenCalledWith("offering");
  expect(state.permission).toHaveBeenCalledWith(context,"courses.manage",{
   collegeId:"college",organizationId:"org",
  });
  expect(workspace.offering).toMatchObject({courseName:"Course",academicPeriodName:"Term 1"});
  expect(workspace.learningPath).toBeNull();
  expect(workspace.lessons).toEqual([]);
  expect(state.lessons).not.toHaveBeenCalled();
 });
 it("fetches published lesson content, assignments and quizzes only after offering ancestry is verified",async()=>{
  state.paths.mockResolvedValueOnce([{id:"path"}]);
  const workspace=await getAdminOfferingLearningWorkspace(context,"offering");
  expect(state.paths).toHaveBeenCalledWith(context,"offering");
  expect(state.lessons).toHaveBeenCalledWith(context,"path");
  expect(state.contents).toHaveBeenCalledWith(context,"lesson1",null);
  expect(state.assignments).toHaveBeenCalledWith(context,"lesson1",null);
  expect(state.quizzes).toHaveBeenCalledWith(context,"lesson1",null);
  expect(workspace.lessons[0]).toMatchObject({
   nextContentSequence:7,nextAssignmentSequence:5,nextQuizSequence:1,
  });
 });
 it("cannot render partial/cross-college offering with absent course, cohort or period",async()=>{
  state.courses.mockResolvedValueOnce([]);
  await expect(getAdminOfferingLearningWorkspace(context,"offering")).rejects.toThrow("incomplete");
  expect(state.lessons).not.toHaveBeenCalled();
  expect(state.contents).not.toHaveBeenCalled();
 });
 it("failing persisted offering resolution does not return any course or learner content",async()=>{
  state.offering.mockRejectedValueOnce(new Error("OFFERING_NOT_FOUND"));
  await expect(getAdminOfferingLearningWorkspace(context,"foreign-offering")).rejects.toThrow();
  expect(state.permission).not.toHaveBeenCalled();
  expect(state.courses).not.toHaveBeenCalled();
  expect(state.paths).not.toHaveBeenCalled();
 });
});
