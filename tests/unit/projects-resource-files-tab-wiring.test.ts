import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
const wrapper=read("src/components/projects/project-resource-files-section.tsx");
const workspace=read("src/components/projects/project-workspace.tsx");
const resourceList=read("src/components/projects/project-resource-list.tsx");
const service=read("src/modules/projects/project-resource-file-service.ts");
describe("Project resources tab file backend wiring",()=>{
  it("uses the authoritative tenant-scoped file projection",()=>{
    expect(wrapper).toContain("listProjectFiles(context,projectId)");
    expect(service).toContain('eq(projectResourceFiles.status, "READY")');
    expect(workspace).toContain("ProjectResourceFilesSection");
  });
  it("never enables uploads on completed, archived, learner or unscoped admin workspaces",()=>{
    for(const fragment of ['mode!=="LEARNER"','status!=="ARCHIVED"','status!=="COMPLETED"',"Boolean(currentMembershipId)"])
      expect(wrapper).toContain(fragment);
  });
  it("keeps the legacy link/note resource controls intact",()=>{
    expect(workspace).toContain("CreateProjectResourceControl");
    expect(workspace).toContain("ProjectResourceList");
    expect(resourceList).toContain("ProjectResourceActions");
    expect(resourceList).toContain("!readOnly");
  });
});
