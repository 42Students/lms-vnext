import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AuthorizationError } from "@/modules/permissions/policy";

const fakes=vi.hoisted(()=>({ctx:vi.fn(),operations:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:fakes.ctx}));
vi.mock("@/modules/placements/tpo-operations-service",()=>({getPlacementTpoOperations:fakes.operations}));
vi.mock("@/components/placements/super-admin-bulk-drive-actions",()=>({
  SuperAdminBulkDriveActions:({drives}:{drives:readonly unknown[]})=>`Bulk actions for ${drives.length} drives`,
}));
vi.mock("@/components/ui/data-table",()=>({
  DataTable:({rows}:{rows:readonly unknown[]})=>`Visible drive rows: ${rows.length}`,
}));
import DrivesPage from "@/app/(authenticated)/admin/placements/drives/page";

const collegeId="11111111-1111-4111-8111-111111111111";
const admin={
  user:{id:"user-a",identityUid:"user-a",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
  membership:null,
  adminScope:{collegeId,organizationId:"org-a"},
};
const ops={
  jobs:[{
    job:{
      id:"22222222-2222-4222-8222-222222222222",
      title:"Graduate software trainee",status:"PUBLISHED",
      applicationDeadline:new Date("2099-02-01T00:00:00.000Z"),
      publishedAt:new Date("2099-01-01T00:00:00.000Z"),
      employmentType:"FULL_TIME",locations:["Bengaluru"],
      company:{id:"33333333-3333-4333-8333-333333333333",name:"Example Technology"},
    },
    metrics:{submittedApplications:5},
  }],
};
beforeEach(()=>{
  vi.resetAllMocks();
  fakes.ctx.mockResolvedValue(admin);
  fakes.operations.mockResolvedValue(ops);
});

describe("Super Admin drives: page-level behavior, denial and friendly recovery",()=>{
  it("CHAT6-ADMIN-DRIVES-PAGE-01 refuses to fetch tenant data without a selected college",async()=>{
    fakes.ctx.mockResolvedValueOnce({...admin,adminScope:{collegeId:null,organizationId:null}});
    const html=renderToStaticMarkup(await DrivesPage({searchParams:Promise.resolve({})}));
    expect(html).toContain("Choose a college");
    expect(fakes.operations).not.toHaveBeenCalled();
  });

  it("CHAT6-ADMIN-DRIVES-PAGE-02 rejects non-Super-Admin role before any list call",async()=>{
    fakes.ctx.mockResolvedValueOnce({...admin,user:{...admin.user,systemRoles:[]}});
    await expect(DrivesPage({searchParams:Promise.resolve({})}))
      .rejects.toBeInstanceOf(AuthorizationError);
    expect(fakes.operations).not.toHaveBeenCalled();
  });

  it("CHAT6-ADMIN-DRIVES-PAGE-03 rejects non-decimal and duplicate paging with a recovery link",async()=>{
    const html=renderToStaticMarkup(await DrivesPage({
      searchParams:Promise.resolve({page:"0x10",pageSize:"5e1"}),
    }));
    expect(html).toContain("Invalid drive filters");
    expect(html).toContain("Clear filters");
    expect(fakes.operations).not.toHaveBeenCalled();
    const duplicate=renderToStaticMarkup(await DrivesPage({
      searchParams:Promise.resolve({page:["2"]}),
    }));
    expect(duplicate).toContain("Invalid drive filters");
    expect(fakes.operations).not.toHaveBeenCalled();
  });

  it("CHAT6-ADMIN-DRIVES-PAGE-04 passes only authenticated college and displays visible results/actions",async()=>{
    const html=renderToStaticMarkup(await DrivesPage({
      searchParams:Promise.resolve({status:"ACTIVE",pageSize:"20"}),
    }));
    expect(fakes.operations).toHaveBeenCalledWith(admin,collegeId);
    expect(html).toContain("1 matching drives");
    expect(html).toContain("Visible drive rows: 1");
    expect(html).toContain("Bulk actions for 1 drives");
    expect(html).toContain("Create drive");
    expect(html).toContain("min-w-0");
  });

  it("CHAT6-ADMIN-DRIVES-PAGE-05 preserves validated filters and hides backend errors on an outage",async()=>{
    fakes.operations.mockRejectedValueOnce(new Error("connection password=private-value"));
    const html=renderToStaticMarkup(await DrivesPage({
      searchParams:Promise.resolve({q:"software",status:"ACTIVE",pageSize:"20"}),
    }));
    expect(html).toContain("Drives unavailable");
    expect(html).toContain("Retry loading drives");
    expect(html).toContain("q=software");
    expect(html).toContain("status=ACTIVE");
    expect(html).not.toContain("password=private-value");
  });

  it("CHAT6-ADMIN-DRIVES-PAGE-06 shows a distinct role-revocation denial instead of retrying private data",async()=>{
    fakes.operations.mockRejectedValueOnce(new AuthorizationError("placements.manage"));
    const html=renderToStaticMarkup(await DrivesPage({searchParams:Promise.resolve({})}));
    expect(html).toContain("Drive access denied");
    expect(html).toContain("Back to dashboard");
    expect(html).not.toContain("Retry loading drives");
  });
});
