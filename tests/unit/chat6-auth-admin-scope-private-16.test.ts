import {beforeEach,describe,expect,it,vi} from "vitest";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {listAdminScopeChoices,resolveAdminScopeSelection} from "@/modules/admin-scope/service";
import {GET,POST,DELETE} from "@/app/api/auth/admin-scope/route";
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:vi.fn()}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:vi.fn()}));
vi.mock("@/modules/admin-scope/service",()=>({
 listAdminScopeChoices:vi.fn(),resolveAdminScopeSelection:vi.fn(),
}));
const organizationId="11111111-1111-4111-8111-111111111111";
const collegeId="22222222-2222-4222-8222-222222222222";
const scope={organizationId,collegeId};
const context={user:{id:"superadmin"},adminScope:scope};
const request=(method:"POST"|"DELETE")=>new Request("https://platform.test/api/auth/admin-scope",{
 method,headers:{"Content-Type":"application/json"},
 body:method==="POST"?JSON.stringify(scope):undefined,
});
beforeEach(()=>{
 vi.resetAllMocks();
 vi.mocked(isSameOriginRequest).mockReturnValue(true);
 vi.mocked(getCurrentRequestContext).mockResolvedValue(context as never);
 vi.mocked(listAdminScopeChoices).mockResolvedValue([] as never);
 vi.mocked(resolveAdminScopeSelection).mockResolvedValue(scope as never);
});
describe("AUTH-handoff-16 account scope response cache safety",()=>{
 it("GET never caches selected college identity and role choices",async()=>{
  const response=await GET();
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(await response.json()).toEqual({scope,choices:[]});
  expect(listAdminScopeChoices).toHaveBeenCalledWith(context);
 });
 it("POST returns a private response and only server-resolved scope as a secure cookie",async()=>{
  const response=await POST(request("POST"));
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(response.cookies.get("lms_admin_scope")?.value).toBe("college:"+organizationId+":"+collegeId);
  expect(resolveAdminScopeSelection).toHaveBeenCalledWith(context,scope);
 });
 it("cross-origin POST and DELETE do not read private choices",async()=>{
  vi.mocked(isSameOriginRequest).mockReturnValue(false);
  for(const method of ["POST","DELETE"] as const){
   const response=method==="POST"?await POST(request("POST")):await DELETE(request("DELETE"));
   expect(response.status).toBe(403);
   expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  }
  expect(getCurrentRequestContext).not.toHaveBeenCalled();
 });
 it("DELETE clears the admin scope cookie without caching the prior scope",async()=>{
  const response=await DELETE(request("DELETE"));
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(response.cookies.get("lms_admin_scope")?.value).toBe("");
 });
});
