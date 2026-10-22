import {beforeEach,describe,expect,it,vi} from "vitest";
import {AuthorizationError} from "@/modules/permissions/policy";
import {getAdminCourseWorkspace} from "@/modules/courses/admin-course-workspace";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const state=vi.hoisted(()=>({
 academics:vi.fn(),courses:vi.fn(),faculty:vi.fn(),relations:vi.fn(),
}));
vi.mock("@/modules/academics/workspace",()=>({getAcademicsWorkspace:state.academics}));
vi.mock("@/modules/courses/course-service",()=>({listCourses:state.courses}));
vi.mock("@/modules/courses/college-faculty-picker-service",()=>({listCollegeFacultyPicker:state.faculty}));
vi.mock("@/modules/courses/college-course-setup-relations-service",()=>({listCollegeCourseSetupRelations:state.relations}));
const context={} as Parameters<typeof getAdminCourseWorkspace>[0];
beforeEach(()=>{
 Object.values(state).forEach(mock=>mock.mockReset());
 state.academics.mockResolvedValue({departments:[],periods:[],programs:[],cohorts:[],sections:[]});
 state.courses.mockResolvedValue([{id:"authorized-course"}]);
 state.faculty.mockResolvedValue({faculty:[],truncated:false});
 state.relations.mockResolvedValue({offerings:[],deliveries:[],teachingAssignments:[]});
});
describe("admin course independent critical and optional read boundaries",()=>{
 it("preserves the authorized course directory when optional academic pickers fail",async()=>{
  state.academics.mockRejectedValueOnce(new Error("ACADEMICS_TEMPORARILY_UNAVAILABLE"));
  const workspace=await getAdminCourseWorkspace(context,"selected-college");
  expect(workspace.courses).toEqual([{id:"authorized-course"}]);
  expect(workspace.academicStructureAvailable).toBe(false);
  expect(workspace.departments).toEqual([]);
  expect(workspace.loadWarnings).toContain("Academic structure unavailable; course creation is disabled until retry");
 });
 it("never conceals a course scope or permission failure as an empty list",async()=>{
  state.courses.mockRejectedValueOnce(new Error("COURSE_SCOPE_FAILED"));
  await expect(getAdminCourseWorkspace(context,"selected-college")).rejects.toThrow("COURSE_SCOPE_FAILED");
 });
 it("never turns an academic permission denial into a warning-only success",async()=>{
  state.academics.mockRejectedValueOnce(new AuthorizationError("academics.manage"));
  await expect(getAdminCourseWorkspace(context,"selected-college")).rejects.toBeInstanceOf(AuthorizationError);
 });
 it("hides creation while academic structure cannot be verified",()=>{
  const source=readFileSync(join(process.cwd(),"src/components/courses/admin-course-overview.tsx"),"utf8");
  expect(source).toContain("workspace.academicStructureAvailable?<Disclosure");
  expect(source).toContain("course creation is disabled until the data is verified");
  expect(source).toContain("workspace.loadWarnings.join");
 });
});
