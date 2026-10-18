import {beforeEach,describe,expect,it,vi} from "vitest";

vi.mock("server-only",()=>({}));
const stubs=vi.hoisted(()=>({
 redirect:vi.fn(),notFound:vi.fn(),context:vi.fn(),corrections:vi.fn(),notices:vi.fn(),
}));
vi.mock("next/navigation",()=>({
 redirect:stubs.redirect,notFound:stubs.notFound,
}));
vi.mock("@/auth/request-context",()=>({
 getCurrentRequestContext:stubs.context,
}));
vi.mock("@/modules/attendance/faculty-correction-service",()=>({
 getFacultyCorrectionAvailability:stubs.corrections,
}));
vi.mock("@/modules/courses/faculty-notices-service",()=>({
 getFacultySectionNotices:stubs.notices,
}));
import FacultyContactsIndexPage from "@/app/(authenticated)/teacher/contacts/page";
import FacultyCourseDefaultPage from "@/app/(authenticated)/teacher/courses/[deliveryId]/page";
import FacultyAttendanceCorrectionsPage from "@/app/(authenticated)/teacher/courses/[deliveryId]/attendance-corrections/page";
import FacultySectionNoticesPage from "@/app/(authenticated)/teacher/courses/[deliveryId]/notices/page";

const deliveryId="11111111-1111-4111-8111-111111111111";
const context={user:{id:"faculty"}};
const params=(id=deliveryId)=>({params:Promise.resolve({deliveryId:id})});
beforeEach(()=>{
 vi.resetAllMocks();
 stubs.redirect.mockImplementation((path:string)=>{throw new Error("REDIRECT:"+path);});
 stubs.notFound.mockImplementation(()=>{throw new Error("NOT_FOUND");});
 stubs.context.mockResolvedValue(context);
 stubs.corrections.mockResolvedValue({});
 stubs.notices.mockResolvedValue({});
});
describe("UX-teacher-no-shared-01 secure redirect-only legacy routes",()=>{
 it("keeps legacy Contacts index as a zero-render same-origin redirect",()=>{
  expect(()=>FacultyContactsIndexPage())
   .toThrow("REDIRECT:/teacher/contacts/allContacts");
  expect(stubs.context).not.toHaveBeenCalled();
 });
 it("rejects invalid Faculty course IDs before rendering or requesting private course data",async()=>{
  await expect(FacultyCourseDefaultPage(params("../../college"))).rejects.toThrow("NOT_FOUND");
  expect(stubs.redirect).not.toHaveBeenCalled();
  await expect(FacultyCourseDefaultPage(params())).rejects.toThrow("REDIRECT:");
  expect(stubs.redirect.mock.calls[0]?.[0]).toContain(deliveryId);
 });
 it("verifies current teaching correction scope before redirecting old bookmarks",async()=>{
  await expect(FacultyAttendanceCorrectionsPage(params("bad-id"))).rejects.toThrow("NOT_FOUND");
  expect(stubs.context).not.toHaveBeenCalled();
  expect(stubs.corrections).not.toHaveBeenCalled();
  await expect(FacultyAttendanceCorrectionsPage(params()))
   .rejects.toThrow("REDIRECT:/teacher/courses/"+deliveryId+"/attendanceDetail");
  expect(stubs.corrections).toHaveBeenCalledWith(context,
   expect.objectContaining({deliveryId,window:"ALL",page:1}));
 });
 it("verifies notice Section scope and sends old bookmarks to Discussions, not an error page",async()=>{
  await expect(FacultySectionNoticesPage(params("not-uuid"))).rejects.toThrow("NOT_FOUND");
  expect(stubs.context).not.toHaveBeenCalled();
  expect(stubs.notices).not.toHaveBeenCalled();
  await expect(FacultySectionNoticesPage(params()))
   .rejects.toThrow("REDIRECT:/teacher/courses/"+deliveryId+"/discussions");
  expect(stubs.notices).toHaveBeenCalledWith(context,{deliveryId});
 });
 it("never redirects to a private Section when its verification service denies current Faculty",async()=>{
  stubs.corrections.mockRejectedValueOnce(new Error("Teaching grant revoked"));
  await expect(FacultyAttendanceCorrectionsPage(params()))
   .rejects.toThrow("Teaching grant revoked");
  expect(stubs.redirect).not.toHaveBeenCalled();
  stubs.notices.mockRejectedValueOnce(new Error("No current teaching access"));
  await expect(FacultySectionNoticesPage(params()))
   .rejects.toThrow("No current teaching access");
  expect(stubs.redirect).not.toHaveBeenCalled();
 });
});
