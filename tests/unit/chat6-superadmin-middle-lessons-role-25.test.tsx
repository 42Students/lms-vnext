import {beforeEach,describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {listCollegeLessons} from "@/modules/courses/college-learning-directory-service";
import {getSuperAdminLearningFilterOptions} from "@/modules/admin-ui/super-admin-learning-filter-options-service";
import {listSuperAdminLearningPathPicker} from "@/modules/courses/super-admin-learning-path-picker";
import SuperAdminLessonsPage from "@/app/(authenticated)/admin/lessons/page";

vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:vi.fn()}));
vi.mock("@/modules/courses/college-learning-directory-service",()=>({listCollegeLessons:vi.fn()}));
vi.mock("@/modules/admin-ui/super-admin-learning-filter-options-service",()=>({
 getSuperAdminLearningFilterOptions:vi.fn(),
}));
vi.mock("@/modules/courses/super-admin-learning-path-picker",()=>({
 listSuperAdminLearningPathPicker:vi.fn(),
}));
vi.mock("@/components/courses/super-admin-lesson-create",()=>({SuperAdminLessonCreate:()=>null}));
vi.mock("@/components/admin/super-admin-learning-filter-fields",()=>({SuperAdminLearningFilterFields:()=>null}));

const collegeId="11111111-1111-4111-8111-111111111111";
const orgId="22222222-2222-4222-8222-222222222222";
const ctx=(superAdmin=true,college:string|null=collegeId)=>({
 user:{id:"33333333-3333-4333-8333-333333333333",identityUid:"identity",platformStatus:"ACTIVE",
  systemRoles:superAdmin?["SUPER_ADMIN"]:[]},
 membership:null,recruiter:null,adminScope:college?{collegeId:college,organizationId:orgId}:null,
});
const page=(query:Record<string,string|string[]|undefined>={})=>
 SuperAdminLessonsPage({searchParams:Promise.resolve(query)});
beforeEach(()=>{
 vi.resetAllMocks();
 vi.mocked(getCurrentRequestContext).mockResolvedValue(ctx() as never);
 vi.mocked(listCollegeLessons).mockResolvedValue({
  items:[],total:0,totalPages:1,
  query:{q:"",status:"ACTIVE",page:1,courseCode:null,cohortCode:null},
 } as never);
 vi.mocked(getSuperAdminLearningFilterOptions).mockResolvedValue({courses:[],cohorts:[]} as never);
 vi.mocked(listSuperAdminLearningPathPicker).mockResolvedValue([] as never);
});
describe("SA-middle-lessons-25 scoped authoring role journey",()=>{
 it("rejects a College Admin who forges a selected Super Admin college cookie",async()=>{
  vi.mocked(getCurrentRequestContext).mockResolvedValue(ctx(false) as never);
  await expect(page()).rejects.toThrow();
  expect(listCollegeLessons).not.toHaveBeenCalled();
  expect(getSuperAdminLearningFilterOptions).not.toHaveBeenCalled();
  expect(listSuperAdminLearningPathPicker).not.toHaveBeenCalled();
 });
 it("supports an unselected platform scope without reading private lessons",async()=>{
  vi.mocked(getCurrentRequestContext).mockResolvedValue(ctx(true,null) as never);
  const html=renderToStaticMarkup(await page());
  expect(html).toContain("Select a college to continue");
  expect(listCollegeLessons).not.toHaveBeenCalled();
 });
 it("invalid filters show a recovery state without a lessons query",async()=>{
  const html=renderToStaticMarkup(await page({status:["ACTIVE","ARCHIVED"]}));
  expect(html).toContain("Invalid lesson filters");
  expect(listCollegeLessons).not.toHaveBeenCalled();
 });
 it("authorized selected-college listing renders a meaningful empty state",async()=>{
  const html=renderToStaticMarkup(await page());
  expect(html).toContain("Lessons");
  expect(html).toContain("No lessons found");
  expect(listCollegeLessons).toHaveBeenCalledOnce();
  expect(getSuperAdminLearningFilterOptions).toHaveBeenCalledOnce();
  expect(listSuperAdminLearningPathPicker).toHaveBeenCalledOnce();
 });
 it("revoked session prevents every lesson and filter read",async()=>{
  vi.mocked(getCurrentRequestContext).mockRejectedValue(new Error("Revoked session"));
  await expect(page()).rejects.toThrow("Revoked session");
  expect(listCollegeLessons).not.toHaveBeenCalled();
 });
});
