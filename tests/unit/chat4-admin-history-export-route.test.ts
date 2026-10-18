import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks=vi.hoisted(()=>({context:vi.fn(),history:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:mocks.context}));
vi.mock("@/modules/colleges/admin-session-service",()=>({listCollegeAdminHistory:mocks.history}));

import {GET} from "@/app/api/admin/colleges/[collegeId]/admins/[userId]/history/route";

const collegeId="40000000-0000-4000-8000-000000000001";
const userId="50000000-0000-4000-8000-000000000001";
const params={params:Promise.resolve({collegeId,userId})};
const url=(query:string)=>new Request("https://lms.example.test/api/admin/colleges/"+
  collegeId+"/admins/"+userId+"/history"+(query?"?"+query:""));

beforeEach(()=>{
 vi.clearAllMocks();
 mocks.context.mockResolvedValue({user:{id:"authorized-admin"}});
 mocks.history.mockResolvedValue({events:[{
  occurredAt:new Date("2099-10-18T00:00:00Z"),eventType:"ADMIN_UPDATED",summary:"Account updated",
 }],page:1,truncated:false});
});

describe("SA-colleges-admins-R02 administrator history export isolation",()=>{
 it.each([
  "page=1&page=2",
  "page=",
  "page=0",
  "page=1e2",
  "page=0x10",
  "page=-1",
  "page=10001",
  "page=1&organizationId=other",
  "actor=someone",
 ])("refuses malformed/ambiguous export URL %s before any history read",async query=>{
  const response=await GET(url(query),params);
  expect(response.status).toBe(400);
  expect(await response.text()).toContain("Choose a valid history page");
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(mocks.history).not.toHaveBeenCalled();
  expect(mocks.context).not.toHaveBeenCalled();
 });
 it("exports the authorized page with a BOM, safe headers, and the scoped context",async()=>{
  const response=await GET(url("page=2"),params);
  expect(response.status).toBe(200);
  expect(response.headers.get("Content-Type")).toContain("text/csv");
  expect(response.headers.get("Cache-Control")).toContain("no-store");
  expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  expect(response.headers.get("X-Export-Truncated")).toBe("false");
  const body=await response.text();
  expect(body.startsWith("\uFEFF")).toBe(true);
  expect(body).toContain("ADMIN_UPDATED");
  expect(mocks.history).toHaveBeenCalledTimes(1);
  expect(mocks.history).toHaveBeenCalledWith(
   await mocks.context.mock.results[0]?.value,collegeId,userId,2,
  );
 });
});
