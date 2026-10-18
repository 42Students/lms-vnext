import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {projectAdminServiceQuerySchema} from "@/modules/projects/admin-service-query-model";

const readPage=(role:"admin"|"college")=>
  readFileSync("src/app/(authenticated)/"+role+"/projects/page.tsx","utf8");

describe("IIT Dharwad Projects: strict snapshot filter contract preserves cards and list",()=>{
  it("PROJ-BREAK-ux-22 service rejects presentation fields, injected tenant fields and invalid paging",()=>{
    expect(projectAdminServiceQuerySchema.safeParse({page:1,pageSize:20,q:"project",status:"ACTIVE"}).success).toBe(true);
    for(const raw of [
      {view:"cards"},{view:"table",page:2},{collegeId:"other-tenant"},
      {organizationId:"other-org",q:"project"},
      {page:["1","2"]},{page:"0x10"},{pageSize:"1e2"},
    ]){
      expect(projectAdminServiceQuerySchema.safeParse(raw).success,JSON.stringify(raw)).toBe(false);
    }
  });

  it.each(["admin","college"] as const)("PROJ-BREAK-ux-22 %s page projects away view before service but preserves user-selected tabs",role=>{
    const page=readPage(role);
    expect(page).toContain("const serviceQuery = {");
    expect(page).toContain("q: query.q, status: query.status, page: query.page, pageSize: query.pageSize");
    expect(page).toContain("listProjectAdminSnapshots(context, collegeId, serviceQuery)");
    expect(page).not.toContain("listProjectAdminSnapshots(context, collegeId, query)");
    expect(page).toContain('viewHref("cards")');
    expect(page).toContain('viewHref("table")');
    expect(page).toContain("query.view");
  });
});
