import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {selectApplicationsView} from "@/components/admin/admin-drive-applications-retained";

describe("Super Admin scoped applications stale refresh",()=>{
  it("retains the last successful view on refresh failure and makes it read-only",()=>{
    expect(selectApplicationsView("failed request","last scoped data",true))
      .toEqual({view:"last scoped data",stale:true});
    expect(selectApplicationsView("failed request",null,true))
      .toEqual({view:"failed request",stale:false});
    expect(selectApplicationsView("updated scoped data","last scoped data",false))
      .toEqual({view:"updated scoped data",stale:false});
    const component=readFileSync("src/components/admin/admin-drive-applications-retained.tsx","utf8");
    expect(component).toContain("inert={selected.stale}");
    expect(component).toContain('role="alert"');
    expect(component).toContain("Retry applications");
  });
  it("checks Super Admin college scope before loading and keys memory by actor, college, job and filters",()=>{
    const page=readFileSync("src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx","utf8");
    expect(page.indexOf('requireSuperAdminSelectedCollege(context,"placements.manage")'))
      .toBeLessThan(page.indexOf("getCollegeApplicationPipeline(context,jobId,query)"));
    expect(page).toContain('const snapshotKey=[context.user.id,context.adminScope.collegeId,jobId,retryHref].join(":")');
    expect(page).toContain("<LastKnownGoodApplications key={snapshotKey} valid={false} retryHref={retryHref}>");
    expect(page).toContain("<LastKnownGoodApplications key={snapshotKey} valid retryHref={retryHref}>");
    const fallback=readFileSync("src/components/placements/last-known-good-applications.tsx","utf8");
    expect(fallback).toContain("<div inert");
    expect(fallback).toContain('role="alert"');
    expect(fallback).toContain("Retry applications");
  });
});
