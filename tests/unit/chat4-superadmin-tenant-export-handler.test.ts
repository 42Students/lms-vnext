import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks=vi.hoisted(()=>({
 context:vi.fn(),export:vi.fn(),apiError:vi.fn(),
}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:mocks.context}));
vi.mock("@/modules/colleges/admin-tenant-lifecycle-service",()=>({
 exportSuperAdminTenantDirectory:mocks.export,
}));
vi.mock("@/lib/api-error",()=>({
 apiErrorResponse:(error:unknown)=>mocks.apiError(error),
}));
import { GET } from "@/app/api/admin/tenants/export/route";

const actor={user:{id:"authorized-admin",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]}};
const org="11111111-1111-4111-8111-111111111111";
const request=(query:string)=>new Request("https://lms.example.test/api/admin/tenants/export"+
 (query?"?"+query:""));
beforeEach(()=>{
 for(const fn of Object.values(mocks))fn.mockReset();
 mocks.context.mockResolvedValue(actor);
 mocks.export.mockResolvedValue({
  csv:"\uFEFF\"College\"\r\n\"Safe School\"",truncated:false,cap:1000,exported:1,
 });
 mocks.apiError.mockImplementation(()=>new Response(JSON.stringify({error:"INVALID_REQUEST"}),{
  status:400,headers:{"Content-Type":"application/json"},
 }));
});
describe("SA-tenants-directory-export-01 scoped export handler and cache isolation",()=>{
 it.each([
  "page=2","q=A&q=B","status=ALL&status=ACTIVE",
  "organizationId="+org+"&organizationId="+org,
  "unknown=value","unknown=","q="+encodeURIComponent("x".repeat(101)),
  "organizationId=foreign","status=DELETED",
 ])("rejects ambiguous, unknown, or malformed export filters before private export query: %s",async query=>{
  const result=await GET(request(query));
  expect(result.status).toBe(400);
  expect(result.headers.get("Cache-Control")).toBe("private, no-store");
  expect(result.headers.get("Vary")).toBe("Cookie");
  expect(mocks.export).not.toHaveBeenCalled();
  expect(mocks.apiError).toHaveBeenCalledTimes(1);
 });
 it("passes only validated normalized search, organization and state with the same actor context",async()=>{
  const result=await GET(request("q=%20college%20&organizationId="+org+"&status=ALL"));
  expect(result.status).toBe(200);
  expect(result.headers.get("Cache-Control")).toBe("private, no-store");
  expect(result.headers.get("Vary")).toBe("Cookie");
  expect(result.headers.get("Content-Type")).toContain("text/csv");
  expect(result.headers.get("Content-Disposition")).toContain("tenant-directory-ist.csv");
  expect(result.headers.get("X-Content-Type-Options")).toBe("nosniff");
  expect(result.headers.get("X-Export-Row-Cap")).toBe("1000");
  expect(result.headers.get("X-Export-Truncated")).toBe("false");
  expect(await result.text()).toContain("Safe School");
  expect(mocks.export).toHaveBeenCalledOnce();
  expect(mocks.export).toHaveBeenCalledWith(actor,{
   q:"college",organizationId:org,status:"ALL",
  });
 });
 it("does not leak or cache a denied export response",async()=>{
  mocks.export.mockRejectedValue(new Error("revoked actor secret"));
  const result=await GET(request("q=safe"));
  expect(result.status).toBe(400);
  expect(result.headers.get("Cache-Control")).toBe("private, no-store");
  expect(result.headers.get("Vary")).toBe("Cookie");
  expect(await result.text()).not.toContain("revoked actor secret");
  expect(mocks.export).toHaveBeenCalledOnce();
 });
});
