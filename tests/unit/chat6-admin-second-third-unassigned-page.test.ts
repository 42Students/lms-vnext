import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AuthorizationError } from "@/modules/permissions/policy";

const fakes=vi.hoisted(()=>({ctx:vi.fn(),list:vi.fn(),redirect:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:fakes.ctx}));
vi.mock("@/modules/people/admin-unassigned-user-service",()=>({
  listSuperAdminUnassignedUsers:fakes.list,
}));
vi.mock("next/navigation",()=>({redirect:fakes.redirect}));
import UnassignedPage from "@/app/(authenticated)/admin/people/unassigned/page";

const admin={
  user:{id:"user-a",identityUid:"user-a",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
  membership:null,
  adminScope:{collegeId:null,organizationId:null},
};

beforeEach(()=>{
  vi.clearAllMocks();
  fakes.ctx.mockResolvedValue(admin);
  fakes.redirect.mockImplementation((href:string)=>{throw new Error(`REDIRECT:${href}`);});
  fakes.list.mockImplementation(async (_actor:unknown,query:{q:string;page:number})=>({
    items:[],query,page:query.page,totalPages:1,total:0,offset:0,
  }));
});

describe("Super Admin global unassigned people directory: SSR permissions and recovery",()=>{
  it("CHAT6-ADMIN-UNASSIGNED-PAGE-01 redirects a non-platform caller before any global user lookup",async()=>{
    fakes.ctx.mockResolvedValueOnce({...admin,user:{...admin.user,systemRoles:[]}});
    await expect(UnassignedPage({searchParams:Promise.resolve({})}))
      .rejects.toThrow("REDIRECT:/dashboard");
    expect(fakes.list).not.toHaveBeenCalled();
  });

  it("CHAT6-ADMIN-UNASSIGNED-PAGE-02 forbids global user enumeration while a tenant is selected",async()=>{
    fakes.ctx.mockResolvedValueOnce({
      ...admin,adminScope:{collegeId:"another-college",organizationId:"another-org"},
    });
    const html=renderToStaticMarkup(await UnassignedPage({searchParams:Promise.resolve({})}));
    expect(html).toContain("Clear the admin scope");
    expect(html).toContain("Users &amp; Roles");
    expect(fakes.list).not.toHaveBeenCalled();
  });

  it("CHAT6-ADMIN-UNASSIGNED-PAGE-03 keeps forged selectors and repeated values out of the global service",async()=>{
    const html=renderToStaticMarkup(await UnassignedPage({
      searchParams:Promise.resolve({collegeId:"another-college",page:"2"}),
    }));
    expect(html).toContain("Invalid user filters");
    const duplicate=renderToStaticMarkup(await UnassignedPage({
      searchParams:Promise.resolve({page:["2"]}),
    }));
    expect(duplicate).toContain("Invalid user filters");
    expect(fakes.list).not.toHaveBeenCalled();
  });

  it("CHAT6-ADMIN-UNASSIGNED-PAGE-04 shows a true empty state with mobile-friendly filters",async()=>{
    const html=renderToStaticMarkup(await UnassignedPage({
      searchParams:Promise.resolve({q:"Nobody",platformStatus:"DISABLED"}),
    }));
    expect(fakes.list).toHaveBeenCalledWith(admin,expect.objectContaining({
      q:"Nobody",platformStatus:"DISABLED",
    }));
    expect(html).toContain("No matching users");
    expect(html).toContain("min-w-0");
    expect(html).toContain("Users without college memberships");
  });

  it("CHAT6-ADMIN-UNASSIGNED-PAGE-05 never renders contact secrets from an unexpected service row",async()=>{
    fakes.list.mockImplementationOnce(async (_actor:unknown,query:unknown)=>({
      items:[{
        id:"id-a",displayName:"Public name",platformStatus:"ACTIVE",roles:["SUPER_ADMIN"],
        createdAt:new Date("2099-01-01T00:00:00Z"),updatedAt:new Date("2099-01-01T00:00:00Z"),
        phoneE164:"+919999999999",email:"secret@example.edu",token:"SECRET_SESSION_TOKEN",
      }],
      query,page:1,totalPages:1,total:1,offset:0,
    }));
    const html=renderToStaticMarkup(await UnassignedPage({searchParams:Promise.resolve({})}));
    expect(html).toContain("Public name");
    expect(html).toContain("SUPER_ADMIN");
    expect(html).not.toContain("secret@example.edu");
    expect(html).not.toContain("9999999999");
    expect(html).not.toContain("SECRET_SESSION_TOKEN");
  });

  it("CHAT6-ADMIN-UNASSIGNED-PAGE-06 gives a retry preserving only validated filters on an outage",async()=>{
    fakes.list.mockRejectedValueOnce(new Error("DATABASE_PASSWORD_SECRET"));
    const html=renderToStaticMarkup(await UnassignedPage({
      searchParams:Promise.resolve({q:"Faculty",page:"2"}),
    }));
    expect(html).toContain("Unassigned users unavailable");
    expect(html).toContain("Retry loading users");
    expect(html).toContain("q=Faculty");
    expect(html).not.toContain("DATABASE_PASSWORD_SECRET");
  });

  it("CHAT6-ADMIN-UNASSIGNED-PAGE-07 separates a persisted permission loss from transient unavailability",async()=>{
    fakes.list.mockRejectedValueOnce(new AuthorizationError("people.manage"));
    const html=renderToStaticMarkup(await UnassignedPage({searchParams:Promise.resolve({})}));
    expect(html).toContain("Directory access denied");
    expect(html).toContain("Back to dashboard");
    expect(html).not.toContain("Retry loading users");
  });
});
