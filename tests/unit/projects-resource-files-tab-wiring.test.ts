import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {canManageProjectFilePanel,canUploadProjectFilePanel} from
 "@/modules/projects/mentor-file-panel-role-model";
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
  it("allows only scoped ACTIVE learner uploads, never learner file administration or archived writes",()=>{
    const learner={mode:"LEARNER" as const,status:"ACTIVE",readOnly:false,hasMembership:true};
    expect(canUploadProjectFilePanel(learner)).toBe(true);
    expect(canManageProjectFilePanel(learner)).toBe(false);
    for(const status of ["ARCHIVED","COMPLETED"])
      expect(canUploadProjectFilePanel({...learner,status})).toBe(false);
    expect(canUploadProjectFilePanel({...learner,hasMembership:false})).toBe(false);
    expect(canUploadProjectFilePanel({...learner,readOnly:true})).toBe(false);
    expect(canManageProjectFilePanel({...learner,mode:"MENTOR"})).toBe(true);
    expect(wrapper).toContain("canManageProjectFilePanel(fileRole)");
    expect(wrapper).toContain("canUploadProjectFilePanel(fileRole)");
  });
  it("keeps the legacy link/note resource controls intact",()=>{
    expect(workspace).toContain("CreateProjectResourceControl");
    expect(workspace).toContain("ProjectResourceList");
    expect(resourceList).toContain("ProjectResourceActions");
    expect(resourceList).toContain("!readOnly");
  });
});
