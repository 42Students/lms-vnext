import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";

const mocks=vi.hoisted(()=>({context:vi.fn(),sessions:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:mocks.context}));
vi.mock("@/modules/colleges/admin-session-service",()=>({
 listCollegeAdminSessions:mocks.sessions,
}));
vi.mock("@/components/admin/admin-revoke-sessions",async()=>{
 const {createElement}=await import("react");
 return {AdminRevokeSessions:(props:{collegeId:string;userId:string;count:number})=>
  createElement("button",{"data-count":String(props.count),type:"button"},
   "Sign out everywhere")};
});
vi.mock("@/components/ui/data-table",async()=>{
 const {createElement}=await import("react");
 type Row={id:string};
 type Column={key:string;cell:(row:Row)=>ReactNode};
 return {DataTable:({rows,columns,empty}:{
  rows:Row[];columns:Column[];empty?:ReactNode;
 })=>createElement("section",null,
  rows.length?rows.map(row=>createElement("article",{key:row.id},
   columns.map(column=>createElement("div",{key:column.key},column.cell(row))))):empty)};
});
import AdminDeviceSessionsPage from "@/app/(authenticated)/admin/colleges/[collegeId]/admins/[userId]/page";

const collegeId="11111111-1111-4111-8111-111111111111";
const userId="22222222-2222-4222-8222-222222222222";
const org="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const actor={
 user:{id:"super-admin",identityUid:"sa",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:{collegeId,organizationId:org},
};
const props={params:Promise.resolve({collegeId,userId})};
beforeEach(()=>{
 mocks.context.mockReset();mocks.sessions.mockReset();
 mocks.context.mockResolvedValue(actor);
 mocks.sessions.mockResolvedValue({
  target:{name:"Admin A"},
  devices:[],
 });
});
describe("SA-colleges-admins-sessions-01 private sessions view",()=>{
 it("renders the authorized empty state without inventing device sessions",async()=>{
  const html=renderToStaticMarkup(await AdminDeviceSessionsPage(props));
  expect(html).toContain("No active sessions for this account");
  expect(html).toContain('data-count="0"');
  expect(html).toContain("up to 100 shown");
  expect(html).toContain("Administrator activity history");
  expect(mocks.sessions).toHaveBeenCalledWith(actor,collegeId,userId);
 });
 it("renders persisted device, safe user agent, IP, IST timestamps and correct revoke count",async()=>{
  mocks.sessions.mockResolvedValue({
   target:{name:"Admin A"},
   devices:[{
    id:"device-1",device_name:"Chrome on Desktop",
    user_agent:'<script>alert("XSS")</script>',ip_address:"192.0.2.8",
    last_seen_at:new Date("2099-10-18T04:30:00Z"),
    created_at:new Date("2099-10-18T00:00:00Z"),
    expires_at:new Date("2099-10-19T04:30:00Z"),
   }],
  });
  const html=renderToStaticMarkup(await AdminDeviceSessionsPage(props));
  expect(html).toContain("Chrome on Desktop");
  expect(html).toContain("192.0.2.8");
  expect(html).toContain("18 Oct 2099");
  expect(html).toContain('data-count="1"');
  expect(html).toContain("&lt;script&gt;");
  expect(html).not.toContain("<script>");
  expect(html).toContain("Sign out everywhere");
 });
 it("does not render cross-tenant session IDs when the scoped service rejects them",async()=>{
  mocks.sessions.mockRejectedValueOnce(new Error("FORBIDDEN"));
  await expect(AdminDeviceSessionsPage(props)).rejects.toThrow("FORBIDDEN");
 });
});
