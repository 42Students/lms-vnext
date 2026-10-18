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
    expect(csv).toContain('"2/6/99"');
    expect(csv).not.toContain('"1/6/99"');
  });
  it("PROJ-BREAK-admin-time-34 a just-before-midnight IST event stays on the previous calendar date",()=>{
    const beforeMidnight=new Date("2099-06-01T18:29:59.000Z");
    expect(formatProjectAdminUpdatedDateIst(beforeMidnight)).toContain("1 Jun 2099");
    expect(formatProjectAdminUpdatedDateIst(new Date("2099-06-01T18:30:00.000Z")))
      .toContain("2 Jun 2099");
  });
});
