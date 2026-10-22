import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const projectSource=(name:string)=>readFileSync("src/components/projects/"+name+".tsx","utf8");

describe("UX-projects-tables-chat14 responsive and accessible data tables",()=>{
  it("UX-projects-table-01 preserves preflight duplicate decisions and cohort outcome results",()=>{
    const src=projectSource("class-team-workspace-creator");
    expect(src).toContain('import { DataTable } from "@/components/ui/data-table"');
    expect(src).toContain('caption="Learner creation preflight"');
    expect(src).toContain('caption="Individual workspace creation results"');
    expect(src).toContain('mobilePriority:"primary"');
    expect(src).toContain('row.status==="TO_CREATE"?"Create"');
    expect(src).toContain('"Already has workspace":"Duplicate"');
    expect(src).toContain('"Created":"Already covered"');
    expect(src).toContain("No eligible learners in this preview.");
    expect(src).toContain("No individual results recorded.");
    expect(src).not.toMatch(/<table\b/);
  });
  it("UX-projects-table-02 retains unsubmitted action, ageing and empty copy",()=>{
    const src=projectSource("project-admin-submissions-page");
    expect(src).toContain('caption="Unsubmitted project workspaces"');
    expect(src).toContain("projectAdminElapsedDays(row.updatedAt,renderedAt)");
    expect(src).toContain("basePath+\"/\"+row.id+\"/delivery\"");
    expect(src).toContain('mobilePriority:"action"');
    expect(src).toContain("All matching workspaces have a submission.");
    expect(src).not.toMatch(/<table\b/);
  });
  it("UX-projects-table-03 retains workspace progress, mentor, archive and open actions",()=>{
    const src=projectSource("project-admin-workspace-list");
    expect(src).toContain('caption="Project workspace table"');
    expect(src).toContain("ProjectArchiveControl projectId={item.id}");
    expect(src).toContain('role="progressbar"');
    expect(src).toContain("collegeWorkspaceStatusLabel(item.status,item.riskReasons)");
    expect(src).toContain('mobilePriority:"action"');
    expect(src).not.toMatch(/<table\b/);
  });
  it("UX-projects-table-04 keeps college assignments responsive and time-labelled",()=>{
    const src=projectSource("super-admin-template-subview-page");
    expect(src).toContain('caption="Project template records"');
    expect(src).toContain("getRowKey={assignment=>assignment.assignmentId}");
    expect(src).toContain("assignment.collegeCode");
    expect(src).toContain('dateTime={assignment.assignedAt.toISOString()}');
    expect(src).toContain("No active college assignments.");
    expect(src).not.toMatch(/<table\b/);
  });
  it("does not replace live data with existence-only placeholders",()=>{
    const sources=["class-team-workspace-creator","project-admin-submissions-page","project-admin-workspace-list","super-admin-template-subview-page"];
    for(const file of sources){
      const src=projectSource(file);
      expect(src).toContain("<DataTable");
      expect(src).toContain("getRowKey=");
      expect(src).toContain("rows=");
      expect(src).toContain("empty=");
    }
  });
});
