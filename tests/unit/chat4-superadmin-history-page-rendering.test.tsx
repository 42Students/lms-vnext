import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";

const mocks=vi.hoisted(()=>({context:vi.fn(),history:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:mocks.context}));
vi.mock("@/modules/colleges/admin-session-service",()=>({
 listCollegeAdminHistory:mocks.history,
}));
vi.mock("@/components/ui/data-table",async()=>{
 const {createElement}=await import("react");
 return {DataTable:({rows,empty}:{
  rows:readonly {id:string;eventType:string;summary:string}[];
  empty?:ReactNode;
 })=>createElement("section",{"aria-label":"Administrator activity history"},
  rows.length?rows.map(row=>createElement("article",{key:row.id},
   createElement("b",null,row.eventType),createElement("p",null,row.summary))):empty)};
});
import AdministratorHistoryPage from "@/app/(authenticated)/admin/colleges/[collegeId]/admins/[userId]/history/page";

const collegeId="11111111-1111-4111-8111-111111111111";
const org="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const userId="22222222-2222-4222-8222-222222222222";
const actor={
 user:{id:"super-admin",identityUid:"sa",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:{collegeId,organizationId:org},
};
const props=(page:string|string[]|undefined)=>({
 params:Promise.resolve({collegeId,userId}),
 searchParams:Promise.resolve(page===undefined?{}:{page}),
});
beforeEach(()=>{
 mocks.context.mockReset();mocks.history.mockReset();
 mocks.context.mockResolvedValue(actor);
 mocks.history.mockResolvedValue({
  target:{name:"Placement Admin"},page:2,truncated:true,
  events:[{id:"event-1",occurredAt:new Date("2099-10-18T04:30:00Z"),
   eventType:"IDENTITY_UPDATED",summary:"Device session revoked"}],
 });
});
describe("SA-colleges-admins-R01 actual administrator history page",()=>{
 it("rejects repeated and nondecimal page filters before private history retrieval",async()=>{
  for(const query of [["1","2"],"1e2","0x10","","10001"]){
   const html=renderToStaticMarkup(await AdministratorHistoryPage(props(query)));
   expect(html).toContain("Invalid history page");
   expect(html).toContain("Clear history filters");
  }
  expect(mocks.history).not.toHaveBeenCalled();
 });
 it("denies a revoked or ordinary College Admin before showing even the invalid-filter state",async()=>{
  mocks.context.mockResolvedValue({
   user:{...actor.user,systemRoles:[]},
   membership:{id:"local",collegeId,organizationId:org,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
  });
  await expect(AdministratorHistoryPage(props("garbage"))).rejects.toBeDefined();
  expect(mocks.history).not.toHaveBeenCalled();
 });
 it("renders only authorized audit evidence with paging and an export URL tied to same subject",async()=>{
  const html=renderToStaticMarkup(await AdministratorHistoryPage(props("2")));
  expect(html).toContain("Placement Admin");
  expect(html).toContain("Device session revoked");
  expect(html).toContain("Page 2");
  expect(html).toContain("Next 100");
  expect(html).toContain("Previous 100");
  expect(html).toContain("Export shown history (CSV)");
  expect(html).toContain("page=2");
  expect(html).toContain(userId);
  expect(mocks.history).toHaveBeenCalledOnce();
  expect(mocks.history).toHaveBeenCalledWith(actor,collegeId,userId,2);
 });
 it("renders user-generated summary safely, not as executable markup",async()=>{
  mocks.history.mockResolvedValue({
   target:{name:"Placement Admin"},page:1,truncated:false,
   events:[{id:"event",occurredAt:new Date("2099-10-18T04:30:00Z"),
    eventType:"ACCOUNT_UPDATED",summary:'<script>alert("secret")</script>'}],
  });
  const html=renderToStaticMarkup(await AdministratorHistoryPage(props(undefined)));
  expect(html).toContain("&lt;script&gt;");
  expect(html).not.toContain("<script>");
  expect(html).not.toContain("Next 100");
 });
});
