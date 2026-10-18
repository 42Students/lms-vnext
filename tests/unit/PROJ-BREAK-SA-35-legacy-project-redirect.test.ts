import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
const mocks=vi.hoisted(()=>({
  getCurrentRequestContext:vi.fn(),
  requireProjectManageAccess:vi.fn(),
  redirect:vi.fn(),
  notFound:vi.fn(),
}));
vi.mock("server-only",()=>({}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:mocks.getCurrentRequestContext}));
vi.mock("@/modules/projects/access",()=>({requireProjectManageAccess:mocks.requireProjectManageAccess}));
vi.mock("next/navigation",()=>({
  redirect:(path:string)=>{mocks.redirect(path);throw new Error("NEXT_REDIRECT");},
  notFound:()=>{mocks.notFound();throw new Error("NEXT_NOT_FOUND");},
}));
import SuperAdminProjectPage from "@/app/(authenticated)/admin/projects/[projectId]/page";

const uuid="44444444-4444-4444-8444-444444444444";
const activeAdmin:RequestContext={
  user:{id:"user-a",identityUid:"identity-a",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
  adminScope:{organizationId:"organization-a",collegeId:"college-a"},
  membership:null,
};

describe("PROJ-BREAK-SA-35 legacy Super Admin project redirect hardening",()=>{
  beforeEach(()=>{
    for(const fn of Object.values(mocks))fn.mockReset();
    mocks.getCurrentRequestContext.mockResolvedValue(activeAdmin);
    mocks.requireProjectManageAccess.mockResolvedValue({project:{id:uuid},organizationId:"organization-a",collegeId:"college-a"});
  });
  const request=(projectId:string)=>({params:Promise.resolve({projectId})});

  it("refuses a learner and disabled system actor before reading private project IDs",async()=>{
    for(const user of [
      {...activeAdmin.user,systemRoles:[]},
      {...activeAdmin.user,platformStatus:"DISABLED" as const},
    ]){
      mocks.getCurrentRequestContext.mockResolvedValueOnce({...activeAdmin,user});
      await expect(SuperAdminProjectPage(request(uuid))).rejects.toMatchObject({
        code:"PROJECT_ACCESS_DENIED",
      });
    }
    expect(mocks.requireProjectManageAccess).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("invalid UUID routes go to not-found, without querying the project",async()=>{
    for(const input of ["../../college-b","", "x".repeat(1000)]){
      await expect(SuperAdminProjectPage(request(input))).rejects.toThrow("NEXT_NOT_FOUND");
    }
    expect(mocks.notFound).toHaveBeenCalledTimes(3);
    expect(mocks.requireProjectManageAccess).not.toHaveBeenCalled();
  });

  it("a forged foreign-college project never produces a successful redirect",async()=>{
    mocks.requireProjectManageAccess.mockRejectedValueOnce(new Error("PROJECT_ACCESS_DENIED"));
    await expect(SuperAdminProjectPage(request(uuid))).rejects.toThrow("PROJECT_ACCESS_DENIED");
    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(mocks.requireProjectManageAccess).toHaveBeenCalledWith(activeAdmin,uuid);
  });

  it("redirects only a selected-college authorized UUID to its canonical summary",async()=>{
    await expect(SuperAdminProjectPage(request(uuid))).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.redirect).toHaveBeenCalledWith("/admin/projects/"+uuid+"/summary");
    expect(mocks.requireProjectManageAccess).toHaveBeenCalledTimes(1);
  });
});
