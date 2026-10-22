import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {formatProjectAdminUpdatedDateIst} from "@/modules/projects/project-admin-date-model";
import {projectWorkspacePageCsv} from "@/modules/projects/admin-workspace-page-export-model";

describe("IIT Dharwad Projects Admin IST date-boundary integrity",()=>{
  it("PROJ-BREAK-admin-time-33 the workspace card and scoped export show the same IST calendar day at UTC midnight",()=>{
    const lateUtc=new Date("2099-06-01T21:00:00.000Z");
    const label=formatProjectAdminUpdatedDateIst(lateUtc);
    expect(label).toContain("2 Jun 2099");
    const source=readFileSync("src/components/projects/project-admin-workspace-list.tsx","utf8");
    expect(source).toContain("formatProjectAdminUpdatedDateIst(item.updatedAt)");
    const csv=projectWorkspacePageCsv([{
      title:"IIT Dharwad",mentorName:"Mentor",status:"ACTIVE",
      progressPercent:50,memberCount:3,updatedAt:lateUtc,
    }]);
    const istDate=formatProjectAdminUpdatedDateIst(lateUtc);
    const utcDate=new Intl.DateTimeFormat("en-IN",{
      dateStyle:"medium",timeZone:"UTC",
    }).format(lateUtc);
    expect(istDate).not.toBe(utcDate);
    expect(csv).toContain('"' + istDate + '"');
    expect(csv).not.toContain('"' + utcDate + '"');
  });
  it("PROJ-BREAK-admin-exports-35 Super Admin export uses the same visible status and timezone as cards",()=>{
    const source=readFileSync("src/components/projects/project-workspace-page-export.tsx","utf8");
    expect(source).toContain("projectWorkspacePageCsv(items)");
    const model=readFileSync("src/modules/projects/admin-workspace-page-export-model.ts","utf8");
    expect(model).toContain("collegeWorkspaceStatusLabel(item.status,item.riskReasons)");
    expect(model).toContain("formatProjectAdminUpdatedDateIst(item.updatedAt)");
    expect(model).toContain("Updated at (IST)");
    expect(model).toContain("projectAdminCsv([headings,...rows])");
    const page=readFileSync("src/app/(authenticated)/admin/projects/page.tsx","utf8");
    expect(page).toContain("riskReasons:item.riskReasons");
    expect(formatProjectAdminUpdatedDateIst(new Date("2099-06-01T21:00:00.000Z"))).toContain("2 Jun 2099");
  });
  it("PROJ-BREAK-admin-time-34 a just-before-midnight IST event stays on the previous calendar date",()=>{
    const beforeMidnight=new Date("2099-06-01T18:29:59.000Z");
    expect(formatProjectAdminUpdatedDateIst(beforeMidnight)).toContain("1 Jun 2099");
    expect(formatProjectAdminUpdatedDateIst(new Date("2099-06-01T18:30:00.000Z")))
      .toContain("2 Jun 2099");
  });
});
