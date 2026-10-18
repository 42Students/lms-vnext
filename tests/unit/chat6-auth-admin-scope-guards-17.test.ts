import {beforeEach,describe,expect,it,vi} from "vitest";
import {scopeSelectionSchema} from "@/modules/admin-scope/service";
import {getCurrentRequestContext} from "@/auth/request-context";
import {listAdminScopeChoices,resolveAdminScopeSelection} from "@/modules/admin-scope/service";
import {GET,POST,DELETE} from "@/app/api/auth/admin-scope/route";
import {isSameOriginRequest} from "@/auth/origin";

vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:vi.fn()}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:vi.fn()}));
vi.mock("@/modules/admin-scope/service",async importOriginal=>{
 const original=await importOriginal<typeof import("@/modules/admin-scope/service")>();
 return {
   ...original,
   listAdminScopeChoices:vi.fn(),
   resolveAdminScopeSelection:vi.fn(),
 };
});
const org="11111111-1111-4111-8111-111111111111";
const college="22222222-2222-4222-8222-222222222222";
const request=(method:"POST"|"DELETE")=>new Request("https://platform.test/api/auth/admin-scope",{
 method,headers:{"content-type":"application/json"},
 body:method==="POST"?JSON.stringify({kind:"college",collegeId:college}):undefined,
});
beforeEach(()=>{
 vi.resetAllMocks();
 vi.mocked(isSameOriginRequest).mockReturnValue(true);
 vi.mocked(getCurrentRequestContext).mockResolvedValue({user:{id:org},adminScope:{organizationId:org,collegeId:college}} as never);
 vi.mocked(listAdminScopeChoices).mockResolvedValue({organizations:[],colleges:[]} as never);
 vi.mocked(resolveAdminScopeSelection).mockResolvedValue({organizationId:org,collegeId:college} as never);
});
describe("AUTH-handoff-17 strict Super Admin scope and private failures",()=>{
 it("accepts exact organization or college choice, not caller-injected role or organization",()=>{
  expect(scopeSelectionSchema.safeParse({kind:"organization",organizationId:org}).success).toBe(true);
  expect(scopeSelectionSchema.safeParse({kind:"college",collegeId:college}).success).toBe(true);
  for(const hostile of [
   {kind:"college",collegeId:college,organizationId:org},
   {kind:"college",collegeId:college,systemRole:"SUPER_ADMIN"},
   {kind:"organization",organizationId:org,collegeId:college},
   {kind:"organization",organizationId:org,privileges:["all"]},
   {kind:"college",collegeId:"invalid"},
   {kind:"region",collegeId:college},
   [],
   null,
  ])expect(scopeSelectionSchema.safeParse(hostile).success).toBe(false);
 });
 it("does not cache an expired-session GET failure or leak scope choices",async()=>{
  vi.mocked(getCurrentRequestContext).mockRejectedValueOnce(new Error("Unexpected session backend error"));
  const response=await GET();
  expect(response.status).toBeGreaterThanOrEqual(400);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(await response.text()).not.toContain(college);
  expect(listAdminScopeChoices).not.toHaveBeenCalled();
 });
 it("keeps POST failure private and does not set a stale scope cookie",async()=>{
  vi.mocked(resolveAdminScopeSelection).mockRejectedValueOnce(new Error("Database temporarily unavailable"));
  const response=await POST(request("POST"));
  expect(response.status).toBeGreaterThanOrEqual(400);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(response.cookies.getAll().every(cookie=>!cookie.name.includes("scope"))).toBe(true);
 });
 it("AUTH-handoff-19 rejects oversized scope JSON without resolving or storing it",async()=>{
  const oversized=new Request("https://platform.test/api/auth/admin-scope",{
   method:"POST",headers:{"content-type":"application/json"},
   body:JSON.stringify({kind:"college",collegeId:college,comment:"x".repeat(2500)}),
  });
  const response=await POST(oversized);
  expect(response.status).toBe(413);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(await response.json()).toEqual({error:"REQUEST_TOO_LARGE"});
  expect(resolveAdminScopeSelection).not.toHaveBeenCalled();
  expect(response.cookies.getAll().length).toBe(0);
 });
 it("does not cache denied scope clearing after expired session",async()=>{
  vi.mocked(getCurrentRequestContext).mockRejectedValueOnce(new Error("Revoked identity session"));
  const response=await DELETE(request("DELETE"));
  expect(response.status).toBeGreaterThanOrEqual(400);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(response.cookies.getAll().every(cookie=>!cookie.name.includes("scope"))).toBe(true);
 });
});
