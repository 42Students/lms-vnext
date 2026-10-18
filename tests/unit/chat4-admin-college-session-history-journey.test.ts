import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseAdminSessionHistoryPage } from "@/modules/colleges/admin-session-query-model";

const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");

describe("SA-colleges-admins-R01 administrator history tenancy and paging",()=>{
  it("normalizes a missing page and accepts bounded ordinary decimal page links",()=>{
    expect(parseAdminSessionHistoryPage({})).toBe(1);
    expect(parseAdminSessionHistoryPage({page:"1"})).toBe(1);
    expect(parseAdminSessionHistoryPage({page:"10000"})).toBe(10000);
    expect(parseAdminSessionHistoryPage({page:"0002"})).toBe(2);
  });

  it("rejects forged extras, repeated pages, fractional and nondecimal numeric syntax",()=>{
    for(const params of [
      {page:["1","2"]},{page:""},{page:"0"},{page:"10001"},{page:"1.2"},
      {page:"1e2"},{page:"0x10"},{page:"-1"},{page:" 1 "},
      {page:"Infinity"},{tenantId:"unrelated"},{userId:"unrelated"},
    ])expect(parseAdminSessionHistoryPage(params)).toBeNull();
  });

  it("does not query administrator audit history when a URL filter is invalid",()=>{
    const page=source("src/app/(authenticated)/admin/colleges/[collegeId]/admins/[userId]/history/page.tsx");
    expect(page.indexOf("parseAdminSessionHistoryPage(raw)")).toBeGreaterThan(-1);
    expect(page.indexOf('if(page===null)')).toBeGreaterThan(page.indexOf("parseAdminSessionHistoryPage(raw)"));
    expect(page.indexOf("listCollegeAdminHistory(")).toBeGreaterThan(page.indexOf('if(page===null)'));
    expect(page).toContain("Invalid history page");
    expect(page).toContain("Clear history filters");
  });

  it("requires persisted admin authorization and scoped administrator subject before returning history",()=>{
    const service=source("src/modules/colleges/admin-session-service.ts");
    const authorized=service.indexOf("async function authorizedTarget(");
    const history=service.indexOf("export async function listCollegeAdminHistory(");
    expect(authorized).toBeGreaterThan(-1);
    expect(history).toBeGreaterThan(authorized);
    const scoped=service.slice(history);
    expect(scoped).toContain("authorizedTarget(ctx,collegeId,userId)");
    expect(scoped).toContain('assertPersistedPlatformPermission(tx,ctx,"college.manage"');
    expect(scoped).toContain("eq(activityEvents.collegeId,target.college.id)");
    expect(scoped).toContain("rows.slice(0,100)");
  });

  it("checks persisted role on administrator session revocation and does not fabricate duplicate audits on retry",()=>{
    const service=source("src/modules/colleges/admin-session-service.ts");
    const revoke=service.slice(service.indexOf("export async function revokeCollegeAdminSessions("));
    expect(revoke).toContain("authorizedTarget(ctx,collegeId,userId)");
    expect(revoke).toContain('assertPersistedPlatformPermission(tx,ctx,"college.manage"');
    expect(revoke).toContain("if(rows.rows.length===0)return {revoked:0}");
    expect(revoke).toContain("recordActivityEventInTransaction(tx,ctx");
  });
});
