import {beforeEach,describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import AdminNewPlacementPage from "@/app/(authenticated)/admin/placements/new/page";

vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:vi.fn()}));
vi.mock("@/components/placements/placement-job-create-workspace",()=>({
 PlacementJobCreateWorkspace:()=>null,
}));
const collegeId="11111111-1111-4111-8111-111111111111";
const organizationId="22222222-2222-4222-8222-222222222222";
const makeContext=(roles:readonly string[]= ["SUPER_ADMIN"],status="ACTIVE",selected:string|null=collegeId)=>({
 user:{id:"admin",identityUid:"session",platformStatus:status,systemRoles:roles},
 membership:null,adminScope:{organizationId,collegeId:selected},
});
beforeEach(()=>{
 vi.resetAllMocks();
 vi.mocked(getCurrentRequestContext).mockResolvedValue(makeContext() as never);
});

describe("Super Admin create-drive authorization before data lookup",()=>{
 it("SA-admin-middle-new-drive-auth-03 rejects a learner's forged selected-college cookie before building options",async()=>{
  vi.mocked(getCurrentRequestContext).mockResolvedValue(makeContext([]) as never);
  await expect(AdminNewPlacementPage()).rejects.toThrow("Missing permission");
 });
 it("SA-admin-middle-new-drive-auth-03 rejects a disabled system administrator before rendering private form",async()=>{
  vi.mocked(getCurrentRequestContext).mockResolvedValue(makeContext(["SUPER_ADMIN"],"DISABLED") as never);
  await expect(AdminNewPlacementPage()).rejects.toThrow("Missing permission");
 });
 it("SA-admin-middle-new-drive-auth-03 gives a no-college recovery page rather than loading unrelated data",async()=>{
  vi.mocked(getCurrentRequestContext).mockResolvedValue(makeContext(["SUPER_ADMIN"],"ACTIVE",null) as never);
  const html=renderToStaticMarkup(await AdminNewPlacementPage());
  expect(html).toContain("Choose a college");
  expect(html).not.toContain("Build the opportunity students will see");
 });
 it("SA-admin-middle-new-drive-auth-03 passes only selected college to the authorized write workspace",async()=>{
  const element=await AdminNewPlacementPage();
  const child=element.props.children;
  expect(child.props.collegeId).toBe(collegeId);
  expect(child.props.context.adminScope).toEqual({collegeId,organizationId});
  expect(child.props.basePath).toBe("/admin/placements");
  expect(getCurrentRequestContext).toHaveBeenCalledOnce();
 });
});
