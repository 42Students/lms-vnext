import {beforeEach,describe,expect,it,vi} from "vitest";
// Stable mocks survive a module-cache reset, avoiding cross-file test imports
// that bind the auth route to a real database client.
const mocks=vi.hoisted(()=>({
 getCurrentRequestContext:vi.fn(),
 isSameOriginRequest:vi.fn(),
 listAdminScopeChoices:vi.fn(),
 resolveAdminScopeSelection:vi.fn(),
 assertPersistedPlatformPermission:vi.fn(async()=>undefined),
}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:mocks.getCurrentRequestContext}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:mocks.isSameOriginRequest}));
vi.mock("@/db/client",()=>({getDb:()=>({
 transaction:(fn:(tx:object)=>Promise<unknown>)=>fn({}),
})}));
vi.mock("@/modules/permissions/persisted-actor",()=>({
 assertPersistedPlatformPermission:mocks.assertPersistedPlatformPermission,
}));
vi.mock("@/modules/admin-scope/service",()=>({
 listAdminScopeChoices:mocks.listAdminScopeChoices,
 resolveAdminScopeSelection:mocks.resolveAdminScopeSelection,
 AdminScopeServiceError:class AdminScopeServiceError extends Error {
  constructor(public readonly code:string){super(code);}
 },
}));
const handlers=()=>import("@/app/api/auth/admin-scope/route");
const organizationId="11111111-1111-4111-8111-111111111111";
const collegeId="22222222-2222-4222-8222-222222222222";
const scope={organizationId,collegeId};
const context={user:{id:"superadmin"},adminScope:scope};
const request=(method:"POST"|"DELETE")=>new Request("https://platform.test/api/auth/admin-scope",{
 method,headers:{"Content-Type":"application/json"},
 body:method==="POST"?JSON.stringify(scope):undefined,
});
beforeEach(()=>{
 vi.resetModules();
 vi.clearAllMocks();
 mocks.isSameOriginRequest.mockReturnValue(true);
 mocks.getCurrentRequestContext.mockResolvedValue(context as never);
 mocks.listAdminScopeChoices.mockResolvedValue([] as never);
 mocks.resolveAdminScopeSelection.mockResolvedValue(scope as never);
});
describe("AUTH-handoff-16 account scope response cache safety",()=>{
 it("GET never caches selected college identity and role choices",async()=>{
  const response=await (await handlers()).GET();
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(await response.json()).toEqual({
   scope,choices:[],
   navigation:{memberships:"/api/auth/memberships",adminScope:"/api/auth/admin-scope",clearMethod:"DELETE"},
   restoredFrom:"VERIFIED_SERVER_SCOPE",
  });
  expect(mocks.listAdminScopeChoices).toHaveBeenCalledWith(context);
 });
 it("POST returns a private response and only server-resolved scope as a secure cookie",async()=>{
  const response=await (await handlers()).POST(request("POST"));
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(response.cookies.get("lms_admin_scope")?.value).toBe("college:"+organizationId+":"+collegeId);
  expect(mocks.resolveAdminScopeSelection).toHaveBeenCalledWith(context,scope);
 });
 it("cross-origin POST and DELETE do not read private choices",async()=>{
  mocks.isSameOriginRequest.mockReturnValue(false);
  for(const method of ["POST","DELETE"] as const){
   const response=method==="POST"?await (await handlers()).POST(request("POST")):await (await handlers()).DELETE(request("DELETE"));
   expect(response.status).toBe(403);
   expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  }
  expect(mocks.getCurrentRequestContext).not.toHaveBeenCalled();
 });
 it("DELETE clears the admin scope cookie without caching the prior scope",async()=>{
  const response=await (await handlers()).DELETE(request("DELETE"));
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(response.cookies.get("lms_admin_scope")?.value).toBe("");
 });
});
