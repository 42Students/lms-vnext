import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {formatProjectAdminUpdatedDateIst,formatProjectAdminActivityDateIst,safeProjectAdminUtcIso} from "@/modules/projects/project-admin-date-model";
import {projectWorkspacePageCsv} from "@/modules/projects/admin-workspace-page-export-model";

describe("IIT Dharwad Projects: malformed stored dates do not crash exports",()=>{
  it("PROJ-BREAK-resilience-20 admin list renders unavailable, not an exception or a guessed date",()=>{
    expect(formatProjectAdminUpdatedDateIst(new Date(Number.NaN))).toBe("Date unavailable");
    const istDate=formatProjectAdminUpdatedDateIst(new Date("2026-09-30T20:00:00.000Z"));
    expect(istDate).toContain("Oct");
    expect(istDate).toContain("2026");
  });

  it("PROJ-BREAK-resilience-20 admin CSV preserves valid rows and uses an explicit invalid-date placeholder",()=>{
    const rows=[
      {title:"=HYPERLINK(1)",mentorName:null,status:"ACTIVE",
        progressPercent:10,memberCount:2,updatedAt:new Date(Number.NaN)},
      {title:"Legitimate workspace",mentorName:"Faculty",status:"COMPLETED",
        progressPercent:100,memberCount:3,updatedAt:new Date("2026-09-30T20:00:00.000Z")},
    ];
    const csv=projectWorkspacePageCsv(rows);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain('"\'=HYPERLINK(1)"');
    expect(csv).toContain('"Date unavailable"');
    expect(csv).toContain('"In progress"');
    expect(csv).toContain('"Ready"');
    expect(csv).toContain('"Last changed (IST)"');
    expect(csv).toContain('"Legitimate workspace"');
    expect(csv).not.toContain('"Invalid Date"');
    expect(csv.split("\r\n")).toHaveLength(4);
  });
  it("PROJ-BREAK-resilience-21 at-risk and submission history dates fail safely without changing valid IST semantics",()=>{
    const bad=new Date(Number.NaN);
    expect(formatProjectAdminActivityDateIst(bad)).toBe("Date unavailable");
    expect(formatProjectAdminActivityDateIst(null)).toBe("Not submitted");
    expect(safeProjectAdminUtcIso(bad)).toBe("Date unavailable");
    const valid=new Date("2026-09-30T20:00:00.000Z");
    expect(formatProjectAdminActivityDateIst(valid)).toContain("Oct");
    expect(safeProjectAdminUtcIso(valid)).toBe("2026-09-30T20:00:00.000Z");
    const risk=readFileSync("src/components/projects/project-admin-at-risk-page.tsx","utf8");
    const submissions=readFileSync("src/components/projects/project-admin-submissions-page.tsx","utf8");
    expect(risk).toContain("safeProjectAdminUtcIso(project.lastActivityAt)");
    expect(risk).toContain("formatProjectAdminActivityDateIst as formatDate");
    expect(submissions).toContain("formatProjectAdminActivityDateIst as formatDate");
  });

});
