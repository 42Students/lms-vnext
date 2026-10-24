import {describe,expect,it} from "vitest";
import {mentorStudentVisibilityPreview as preview,safePreviewHttpUrl}
  from "@/modules/projects/mentor-student-visibility-preview-model";
const common={project:{id:"p",title:"Visible",summary:"Shared",status:"ACTIVE"},
 sprints:[{id:"s",title:"Sprint",sequence:0,status:"ACTIVE"}],
 tasks:[{id:"t",title:"Task",status:"TODO",priority:"HIGH",
   sprintId:"s",deletedAt:null,estimatePoints:3}],
 resources:[]};
describe("Mentor student visibility-only preview",()=>{
 it("does not expose drafts, Mentor-only records or private metadata",()=>{
  const result=preview({...common,resources:[
   {id:"draft",title:"Private draft",status:"DRAFT",visibility:"TEAM",
    url:"https://example.org/draft",description:"secret"},
   {id:"mentor",title:"Mentor notes",status:"ACTIVE",visibility:"MENTOR_ONLY",
    url:"https://example.org/mentor",description:"secret"},
   {id:"visible",title:"Team reference",status:"ACTIVE",visibility:"TEAM",
    url:"https://example.org/file",description:"shared",accessNotes:"PRIVATE"},
  ]});
  expect(result.resources).toEqual([{id:"visible",title:"Team reference",
    description:"shared",resourceType:null,url:"https://example.org/file"}]);
  expect(JSON.stringify(result)).not.toContain("PRIVATE");
  expect(JSON.stringify(result)).not.toContain("Private draft");
 });
 it("excludes soft-deleted tasks and returns allowlisted task fields only",()=>{
  const result=preview({...common,tasks:[
   {...common.tasks[0],internalNote:"PRIVATE"},
   {...common.tasks[0],id:"deleted",deletedAt:new Date()},
  ]});
  expect(result.tasks).toHaveLength(1);
  expect(JSON.stringify(result.tasks)).not.toContain("PRIVATE");
 });
 it("rejects scriptable and credential-bearing URLs",()=>{
  expect(safePreviewHttpUrl("javascript:alert(1)")).toBeNull();
  expect(safePreviewHttpUrl("https://x:y@example.org/secret")).toBeNull();
  expect(safePreviewHttpUrl("https://example.org/resource")).toBe(
    "https://example.org/resource");
 });
});
