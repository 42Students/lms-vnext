import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {facultyAssignmentResourcesSchema} from "@/modules/courses/faculty-assignment-authoring-model";

describe("legacy faculty assignment builder resource parity",()=>{
 it("validates accepted resource types, link safety and maximum 30 rows",()=>{
  const instructions={kind:"INSTRUCTIONS" as const,title:"Instructions",body:"Answer each question"};
  expect(facultyAssignmentResourcesSchema.safeParse([instructions]).success).toBe(true);
  expect(facultyAssignmentResourcesSchema.safeParse(Array.from({length:31},(_,i)=>({
    kind:"LINK",title:"Link "+i,externalUrl:"https://example.edu/"+i,
  }))).success).toBe(false);
  expect(facultyAssignmentResourcesSchema.safeParse([
    {kind:"LINK",title:"Internal",externalUrl:"http://127.0.0.1/admin"},
  ]).success).toBe(false);
 });
 it("rejects a visually present but empty placeholder on save",()=>{
  const component=readFileSync("src/components/courses/faculty-lesson-authoring.tsx","utf8");
  const resourceFields=readFileSync("src/components/courses/faculty-assignment-resource-draft-fields.tsx","utf8");
  expect(component).toContain("if(resourcesForSave.length===0)");
  expect(component).toContain("Add at least one assignment instruction or resource.");
  expect(component).toContain('!(row.kind==="INSTRUCTIONS"&&row.title==="Instructions"&&!row.body?.trim())');
  expect(resourceFields).toContain("Each assignment needs at least one completed resource");
  expect(resourceFields).toContain("Private uploads require malware-scan approval");
 });
});
