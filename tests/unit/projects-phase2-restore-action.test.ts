import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
const control=read("src/components/projects/project-archive-control.tsx");
const workspace=read("src/components/projects/project-workspace.tsx");
const legacy=read("docs/audit/legacy-copy-A.md");
describe("PR-S2-10 archived project recovery action",()=>{
  it("retains the legacy restore confirmation and feedback copy",()=>{
    for(const value of ["Restore this workspace?","Restore workspace, members, meetings, tasks, sprints and resources with their edits.","Workspace restored","Failed to restore workspace"])
      expect(legacy).toContain(value);
  });
  it("wires an optimistic timestamp-bearing restoration from admin summary",()=>{
    expect(control).toContain('const archived=status==="ARCHIVED"');
    expect(control).toContain('{expectedUpdatedAt});');
    expect(control).toContain('(archived?"/restore":"/archive")');
    expect(workspace).toContain("expectedUpdatedAt={workspace.project.updatedAt.toISOString()}");
  });
});
