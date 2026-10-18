import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {projectTemplateGlobalActions} from "@/modules/projects/template-global-actions-model";

describe("IIT Dharwad Projects: global template lifecycle actions match persisted state",()=>{
  it("PROJ-BREAK-state-28 archived templates cannot advertise unsupported publish/unpublish/rearchive",()=>{
    expect(projectTemplateGlobalActions("ARCHIVED")).toEqual({
      canPublish:false,canUnpublish:false,canDuplicate:true,canArchive:false,
    });
    const source=readFileSync("src/components/projects/project-template-controls.tsx","utf8");
    expect(source).toContain("projectTemplateGlobalActions(status)");
    expect(source).toContain("lifecycle.canPublish");
    expect(source).toContain("lifecycle.canUnpublish");
    expect(source).toContain("lifecycle.canDuplicate");
    expect(source).toContain("lifecycle.canArchive");
    expect(source).toContain("Archived templates are read-only. Duplicate to start a new draft.");
    expect(source).not.toContain("Return template to draft");
    expect(source).not.toContain("Republish template");
  });
  it("PROJ-BREAK-state-29 DRAFT publishes and archives; PUBLISHED unpublishes and archives",()=>{
    expect(projectTemplateGlobalActions("DRAFT")).toEqual({
      canPublish:true,canUnpublish:false,canDuplicate:true,canArchive:true,
    });
    expect(projectTemplateGlobalActions("PUBLISHED")).toEqual({
      canPublish:false,canUnpublish:true,canDuplicate:true,canArchive:true,
    });
  });
  it("PROJ-BREAK-state-30 unexpected status fails closed without destructive lifecycle buttons",()=>{
    for(const status of ["","UNKNOWN","DELETED","ACTIVATING"]){
      expect(projectTemplateGlobalActions(status)).toEqual({
        canPublish:false,canUnpublish:false,canDuplicate:false,canArchive:false,
      });
    }
  });
});
