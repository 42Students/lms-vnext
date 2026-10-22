import {beforeEach,describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {listPlacementOperationsJobPage} from "@/modules/placements/tpo-operations-service";
import {getSuperAdminDrivePipeline} from "@/modules/placements/super-admin-drive-pipeline-service";
import {getPlacementJob} from "@/modules/placements/job-service";
import {getSuperAdminDriveAttention} from "@/modules/placements/super-admin-drive-attention-service";
import SuperAdminDrivesPage from "@/app/(authenticated)/admin/placements/drives/page";
import AdminPlacementDrivePage from "@/app/(authenticated)/admin/placements/jobs/[jobId]/page";

vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:vi.fn()}));
vi.mock("@/modules/placements/tpo-operations-service",()=>({listPlacementOperationsJobPage:vi.fn()}));
vi.mock("@/modules/placements/super-admin-drive-pipeline-service",()=>({getSuperAdminDrivePipeline:vi.fn()}));
vi.mock("@/modules/placements/job-service",()=>({getPlacementJob:vi.fn()}));
vi.mock("@/modules/placements/super-admin-drive-attention-service",()=>({getSuperAdminDriveAttention:vi.fn()}));
vi.mock("@/components/placements/super-admin-bulk-drive-actions",()=>({SuperAdminBulkDriveActions:()=>null}));
vi.mock("@/components/placements/placement-drive-workspace",()=>({
 PlacementDriveWorkspace:({jobId}:{jobId:string})=><p data-job-id={jobId}>Authorized drive overview</p>,
}));
vi.mock("@/components/placements/super-admin-drive-pipeline",()=>({SuperAdminDrivePipeline:()=>null}));
vi.mock("@/components/placements/super-admin-drive-tabs",()=>({SuperAdminDriveTabs:()=>null}));
const collegeId="11111111-1111-4111-8111-111111111111";
const orgId="22222222-2222-4222-8222-222222222222";
const jobId="33333333-3333-4333-8333-333333333333";
const ctx=(admin=true,college:string|null=collegeId)=>({
 user:{id:"44444444-4444-4444-8444-444444444444",identityUid:"identity",platformStatus:"ACTIVE",
  systemRoles:admin?["SUPER_ADMIN"]:[]},
 membership:null,recruiter:null,adminScope:college?{collegeId:college,organizationId:orgId}:null,
});
const listing=(params:Record<string,string|string[]|undefined>={})=>
 SuperAdminDrivesPage({searchParams:Promise.resolve(params)});
const overview=()=>AdminPlacementDrivePage({params:Promise.resolve({jobId})});
beforeEach(()=>{
 vi.resetAllMocks();
 vi.mocked(getCurrentRequestContext).mockResolvedValue(ctx() as never);
 vi.mocked(listPlacementOperationsJobPage).mockResolvedValue({items:[],total:0,page:1,pageSize:20,totalPages:1} as never);
 vi.mocked(getPlacementJob).mockResolvedValue({id:jobId,title:"Authorized job"} as never);
 vi.mocked(getSuperAdminDriveAttention).mockResolvedValue([] as never);
 vi.mocked(getSuperAdminDrivePipeline).mockResolvedValue([] as never);
});
describe("SA-middle-drives-27 platform administrator drive route isolation",()=>{
 it("rejects forged admin scope on a College Admin before any private drive read",async()=>{
  vi.mocked(getCurrentRequestContext).mockResolvedValue(ctx(false) as never);
  await expect(listing()).rejects.toThrow();
  await expect(overview()).rejects.toThrow();
  expect(listPlacementOperationsJobPage).not.toHaveBeenCalled();
  expect(getSuperAdminDrivePipeline).not.toHaveBeenCalled();
 });
 it("missing college scope displays a recovery state without fetching private jobs",async()=>{
  vi.mocked(getCurrentRequestContext).mockResolvedValue(ctx(true,null) as never);
  const list=renderToStaticMarkup(await listing());
  const detail=renderToStaticMarkup(await overview());
  expect(list).toContain("Select a College to manage Jobs");
  expect(detail).toContain("Choose a college");
  expect(listPlacementOperationsJobPage).not.toHaveBeenCalled();
  expect(getSuperAdminDrivePipeline).not.toHaveBeenCalled();
 });
 it("invalid repeated filters are denied before obtaining drive metrics",async()=>{
  const html=renderToStaticMarkup(await listing({status:["ACTIVE","CLOSED"]}));
  expect(html).toContain("Invalid drive filters");
  expect(listPlacementOperationsJobPage).not.toHaveBeenCalled();
 });
 it("authorized zero-row drive list renders truthful empty state with same-college loader",async()=>{
  const html=renderToStaticMarkup(await listing());
  expect(html).toContain("No jobs yet");
  expect(listPlacementOperationsJobPage).toHaveBeenCalledWith(expect.anything(),collegeId,expect.anything());
 });
 it("authorized job overview passes the route ID into a scoped detail workspace",async()=>{
  const html=renderToStaticMarkup(await overview());
  expect(html).toContain("Authorized drive overview");
  expect(html).toContain(jobId);
  expect(getSuperAdminDrivePipeline).toHaveBeenCalledWith(expect.anything(),jobId);
 });
 it("revoked session rejects both routes before reading any private record",async()=>{
  vi.mocked(getCurrentRequestContext).mockRejectedValue(new Error("SESSION_REVOKED"));
  await expect(listing()).rejects.toThrow("SESSION_REVOKED");
  await expect(overview()).rejects.toThrow("SESSION_REVOKED");
  expect(listPlacementOperationsJobPage).not.toHaveBeenCalled();
  expect(getSuperAdminDrivePipeline).not.toHaveBeenCalled();
 });
});
