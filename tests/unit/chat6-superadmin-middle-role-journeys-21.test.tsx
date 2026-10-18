import {beforeEach,describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {getSuperAdminPlacementRetentionReport} from "@/modules/admin-ui/super-admin-placement-retention-service";
import SuperAdminPlacementInterviewCalendarPage from "@/app/(authenticated)/admin/placements/calendar/page";
import SuperAdminRetentionPage from "@/app/(authenticated)/admin/placements/retention/page";

vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:vi.fn()}));
vi.mock("@/modules/admin-ui/super-admin-placement-retention-service",()=>({
 getSuperAdminPlacementRetentionReport:vi.fn(),
}));
vi.mock("@/components/placements/placement-calendar-workspace",()=>({
 PlacementCalendarWorkspace:({collegeId,audience}:{collegeId:string;audience:string})=>
  <p data-college={collegeId} data-audience={audience}>Scoped interview calendar</p>,
}));
const college="11111111-1111-4111-8111-111111111111";
const org="22222222-2222-4222-8222-222222222222";
const identity="33333333-3333-4333-8333-333333333333";
const context=(role:"SUPER_ADMIN"|"LEARNER"="SUPER_ADMIN",selected=true)=>({
 user:{id:identity,identityUid:"identity-1",platformStatus:"ACTIVE",systemRoles:role==="SUPER_ADMIN"?["SUPER_ADMIN"]:[]},
 membership:null,recruiter:null,
 adminScope:selected?{collegeId:college,organizationId:org}:null,
});
beforeEach(()=>{
 vi.resetAllMocks();
 vi.mocked(getCurrentRequestContext).mockResolvedValue(context() as never);
 vi.mocked(getSuperAdminPlacementRetentionReport).mockResolvedValue({
   cutoff:new Date("2026-10-18T17:00:00Z"),rows:[],truncated:false,
 } as never);
});
describe("SA-admin-middle-role-journeys-21 private placement pages",()=>{
 it("calendar denies a forged learner scope before displaying private appointments",async()=>{
  vi.mocked(getCurrentRequestContext).mockResolvedValue(context("LEARNER") as never);
  await expect(SuperAdminPlacementInterviewCalendarPage({searchParams:Promise.resolve({})})).rejects.toThrow();
 });
 it("calendar recovers without an exact college, even for a valid global administrator",async()=>{
  vi.mocked(getCurrentRequestContext).mockResolvedValue(context("SUPER_ADMIN",false) as never);
  const html=renderToStaticMarkup(await SuperAdminPlacementInterviewCalendarPage({searchParams:Promise.resolve({})}));
  expect(html).toContain("Select a college scope");
  expect(html).not.toContain("Scoped interview calendar");
 });
 it("calendar passes the exact selected college and platform audience after authorization",async()=>{
  const html=renderToStaticMarkup(await SuperAdminPlacementInterviewCalendarPage({searchParams:Promise.resolve({})}));
  expect(html).toContain('data-college="'+college+'"');
  expect(html).toContain('data-audience="SUPER_ADMIN"');
  expect(html).toContain("Scoped interview calendar");
  expect(getCurrentRequestContext).toHaveBeenCalledOnce();
 });
 it("retention report denies forged learner scope before loading any applicant names",async()=>{
  vi.mocked(getCurrentRequestContext).mockResolvedValue(context("LEARNER") as never);
  await expect(SuperAdminRetentionPage()).rejects.toThrow();
  expect(getSuperAdminPlacementRetentionReport).not.toHaveBeenCalled();
 });
 it("retention report displays recovery without a college and makes no private query",async()=>{
  vi.mocked(getCurrentRequestContext).mockResolvedValue(context("SUPER_ADMIN",false) as never);
  const html=renderToStaticMarkup(await SuperAdminRetentionPage());
  expect(html).toContain("Select a college");
  expect(getSuperAdminPlacementRetentionReport).not.toHaveBeenCalled();
 });
 it("expired session aborts both role journeys without a private report read",async()=>{
  vi.mocked(getCurrentRequestContext).mockRejectedValue(new Error("Revoked session"));
  await expect(SuperAdminRetentionPage()).rejects.toThrow("Revoked session");
  await expect(SuperAdminPlacementInterviewCalendarPage({searchParams:Promise.resolve({})})).rejects.toThrow("Revoked session");
  expect(getSuperAdminPlacementRetentionReport).not.toHaveBeenCalled();
 });
});
