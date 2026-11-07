import { beforeEach, describe, expect, it, vi } from "vitest";
import { redirect, notFound } from "next/navigation";
import { renderToStaticMarkup } from "react-dom/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSuperAdmin } from "@/modules/identity/context";
import { requirePermission, AuthorizationError } from "@/modules/permissions/policy";
import { getDb } from "@/db/client";
import LegacySuperAdminRedirect from "@/app/(authenticated)/superadmin/[...legacy]/page";

vi.mock("server-only",()=>({}));
vi.mock("next/navigation",()=>({
  redirect:vi.fn((path:string)=>{throw new Error("REDIRECT:"+path);}),
  notFound:vi.fn(()=>{throw new Error("NOT_FOUND");}),
}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:vi.fn()}));
vi.mock("@/modules/identity/context",()=>({isSuperAdmin:vi.fn()}));
vi.mock("@/modules/permissions/policy",()=>({
  requirePermission:vi.fn(), AuthorizationError:class AuthorizationError extends Error {},
}));
vi.mock("@/db/client",()=>({getDb:vi.fn()}));

const context={user:{id:"super-admin-user"},adminScope:{collegeId:"00000000-0000-4000-8000-000000000111"}};
const render=(legacy:string[],query:Record<string,string|string[]|undefined>={})=>
  LegacySuperAdminRedirect({params:Promise.resolve({legacy}),searchParams:Promise.resolve(query)});
const template="21fba51e-bd58-4b64-93a3-370ddc01d6a9";
beforeEach(()=>{
  vi.resetAllMocks();
  vi.mocked(getCurrentRequestContext).mockResolvedValue(context as never);
  vi.mocked(isSuperAdmin).mockReturnValue(true);
  vi.mocked(requirePermission).mockImplementation(()=>undefined);
});

describe("UX-G088 legacy Super Admin project template browser bookmarks",()=>{
  it("routes old templates index to canonical directory without database read",async()=>{
    await expect(render(["projects","templates"])).rejects.toThrow("REDIRECT:/admin/projects/templates");
    expect(getDb).not.toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/admin/projects/templates");
  });
  it("opens the new-template form only after stronger create/manage permission",async()=>{
    await expect(render(["projects","templates","new"],{tab:"secret",return:"https://evil.invalid",collegeId:"elsewhere"}))
      .rejects.toThrow("REDIRECT:/admin/projects/templates/new");
    expect(requirePermission).toHaveBeenCalledExactlyOnceWith(context,"project-template.manage");
    expect(getDb).not.toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/admin/projects/templates/new");
  });
  it("rejects new-template permission denial without looking up a template slug",async()=>{
    vi.mocked(requirePermission).mockImplementation(()=>{throw new AuthorizationError("denied");});
    await expect(render(["projects","templates","new"])).rejects.toBeInstanceOf(AuthorizationError);
    expect(getDb).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });
  it("never accepts a forged project-template path for a non-Super Admin",async()=>{
    vi.mocked(isSuperAdmin).mockReturnValue(false);
    await expect(render(["projects","templates","new"])).rejects.toThrow("REDIRECT:/dashboard");
    expect(requirePermission).not.toHaveBeenCalled();
    expect(getDb).not.toHaveBeenCalled();
  });
  it("matches a known stored UUID to the canonical template and preserves only bounded filters",async()=>{
    const select=vi.fn().mockReturnValue({from:vi.fn().mockReturnValue({
      where:vi.fn().mockReturnValue({limit:vi.fn().mockResolvedValue([{id:template}])}),
    })});
    vi.mocked(getDb).mockReturnValue({select} as never);
    await expect(render(["projects","templates",template,"overview"],{
      q:"Search",tab:"overview",version:"2",view:"details",
      return:"/admin/projects/templates",redirect:"https://evil.invalid",collegeId:"other",
    })).rejects.toThrow("REDIRECT:/admin/projects/templates/");
    const target=vi.mocked(redirect).mock.calls[0]?.[0];
    const url=new URL(target!,"https://lms.invalid");
    expect(url.pathname).toBe("/admin/projects/templates/"+template);
    expect(url.searchParams.get("q")).toBe("Search");
    expect(url.searchParams.get("tab")).toBe("overview");
    expect(url.searchParams.get("version")).toBe("2");
    expect(url.searchParams.get("return")).toBe("/admin/projects/templates");
    expect(url.searchParams.has("redirect")).toBe(false);
    expect(url.searchParams.has("collegeId")).toBe(false);
    expect(requirePermission).toHaveBeenCalledWith(context,"project-template.read");
  });
  it("does not map an unrecognized numeric legacy ID to an unrelated row",async()=>{
    const select=vi.fn().mockReturnValue({from:vi.fn().mockReturnValue({
      where:vi.fn().mockReturnValue({limit:vi.fn().mockResolvedValue([])}),
    })});
    vi.mocked(getDb).mockReturnValue({select} as never);
    const node=await render(["projects","templates","123","overview"]);
    const html=renderToStaticMarkup(node as never);
    expect(html).toContain("No template in this link");
    expect(html).toContain("Back to templates");
    expect(redirect).not.toHaveBeenCalled();
  });
  it("rejects traversal and unsupported template subroutes without database access",async()=>{
    for(const segments of [
      ["projects","templates","bad.token"],
      ["projects","templates",".."],
      ["projects","templates","slug","unknown"],
    ]){
      await expect(render(segments)).rejects.toThrow("NOT_FOUND");
    }
    expect(notFound).toHaveBeenCalledTimes(3);
    expect(getDb).not.toHaveBeenCalled();
  });
});
