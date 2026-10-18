import {beforeEach,describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {listLectureHalls} from "@/modules/academics/lecture-hall-service";
import {listDepartments} from "@/modules/departments/service";
import {getCollegeHallAvailability} from "@/modules/academics/college-hall-availability-service";
import SuperAdminLectureHallsPage from "@/app/(authenticated)/admin/lecture-halls/page";
import SuperAdminLectureHallAvailability from "@/app/(authenticated)/admin/lecture-halls/[hallId]/page";

vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:vi.fn()}));
vi.mock("@/modules/academics/lecture-hall-service",()=>({listLectureHalls:vi.fn()}));
vi.mock("@/modules/departments/service",()=>({listDepartments:vi.fn()}));
vi.mock("@/modules/academics/college-hall-availability-service",()=>({
 getCollegeHallAvailability:vi.fn(),
 CollegeHallAvailabilityNotFoundError:class CollegeHallAvailabilityNotFoundError extends Error{},
}));
vi.mock("@/components/admin/lecture-hall-manager",()=>({LectureHallManager:()=>null}));

const collegeId="11111111-1111-4111-8111-111111111111";
const organizationId="22222222-2222-4222-8222-222222222222";
const makeContext=(systemRole:"SUPER_ADMIN"|"NONE"="SUPER_ADMIN",college:string|null=collegeId)=>({
 user:{id:"33333333-3333-4333-8333-333333333333",identityUid:"identity",platformStatus:"ACTIVE",
  systemRoles:systemRole==="SUPER_ADMIN"?["SUPER_ADMIN"]:[]},
 membership:null,recruiter:null,
 adminScope:college?{collegeId:college,organizationId}:null,
});
const listPage=(params:Record<string,string|string[]|undefined>={})=>
 SuperAdminLectureHallsPage({searchParams:Promise.resolve(params)});
const detailPage=(params:Record<string,string|string[]|undefined>={})=>
 SuperAdminLectureHallAvailability({
  params:Promise.resolve({hallId:"44444444-4444-4444-8444-444444444444"}),
  searchParams:Promise.resolve(params),
 });
beforeEach(()=>{
 vi.resetAllMocks();
 vi.mocked(getCurrentRequestContext).mockResolvedValue(makeContext() as never);
 vi.mocked(listLectureHalls).mockResolvedValue({
  collegeName:"IIT Dharwad",items:[],pagination:{total:0},
 } as never);
 vi.mocked(listDepartments).mockResolvedValue([] as never);
 vi.mocked(getCollegeHallAvailability).mockResolvedValue({
  hall:{id:"44444444-4444-4444-8444-444444444444",name:"Room A",capacity:35,status:"ACTIVE"},
  sessions:[],truncated:false,conflictCount:0,
 } as never);
});
describe("SA-middle-lecture-halls-24 platform role and selected college",()=>{
 it("denies a College Admin spoofing a selected Super Admin college before any lecture-hall reads",async()=>{
  vi.mocked(getCurrentRequestContext).mockResolvedValue(makeContext("NONE") as never);
  await expect(listPage()).rejects.toThrow();
  expect(listLectureHalls).not.toHaveBeenCalled();
  expect(listDepartments).not.toHaveBeenCalled();
  await expect(detailPage({from:"2026-10-18",to:"2026-10-19"})).rejects.toThrow();
  expect(getCollegeHallAvailability).not.toHaveBeenCalled();
 });
 it("provides safe missing-college recovery with zero private reads",async()=>{
  vi.mocked(getCurrentRequestContext).mockResolvedValue(makeContext("SUPER_ADMIN",null) as never);
  const listing=renderToStaticMarkup(await listPage());
  const detail=renderToStaticMarkup(await detailPage());
  expect(listing).toContain("Select a college to continue");
  expect(detail).toContain("Select a college to continue");
  expect(listLectureHalls).not.toHaveBeenCalled();
  expect(getCollegeHallAvailability).not.toHaveBeenCalled();
 });
 it("scoped Super Admin gets a bounded empty room listing and selected-college loader",async()=>{
  const html=renderToStaticMarkup(await listPage());
  expect(html).toContain("Lecture Halls");
  expect(html).toContain("IIT Dharwad");
  expect(html).toContain("No lecture halls found");
  expect(listLectureHalls).toHaveBeenCalledWith(expect.anything(),
    expect.objectContaining({collegeId,limit:25,offset:0}));
 });
 it("malformed date filters render safe recovery without any room booking query",async()=>{
  const html=renderToStaticMarkup(await detailPage({from:"2026-10-19",to:"yesterday"}));
  expect(html).toContain("Invalid date range");
  expect(getCollegeHallAvailability).not.toHaveBeenCalled();
 });
 it("same-college room schedule is only loaded after the platform actor check",async()=>{
  const html=renderToStaticMarkup(await detailPage({from:"2026-10-18",to:"2026-10-19"}));
  expect(html).toContain("Room A");
  expect(html).toContain("No persisted bookings");
  expect(getCollegeHallAvailability).toHaveBeenCalledWith(expect.anything(),{
   hallId:"44444444-4444-4444-8444-444444444444",from:"2026-10-18",to:"2026-10-19",
  });
  expect(getCurrentRequestContext).toHaveBeenCalledOnce();
 });
});
