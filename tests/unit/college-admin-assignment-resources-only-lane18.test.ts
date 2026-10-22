import {describe,expect,it} from "vitest";
import {facultyAssignmentCommandSchema} from "@/modules/courses/faculty-assignment-authoring-model";
import {readFileSync} from "node:fs";

const uid="d831cf0e-c13f-44e8-9a32-d57e63121913";
describe("G2-4-004-074: College Admin resources-only update with 10,000-point assessment",()=>{
 it("accepts a confirmed resource-only CAS without resubmitting grade ceilings or dates",()=>{
  const value={action:"RESOURCES",assignmentId:uid,resources:[{
   kind:"LINK",title:"External resource",externalUrl:"https://example.edu/assignment.pdf",
  }],expectedUpdatedAt:"2026-10-22T08:00:00.000Z",confirmed:true};
  expect(facultyAssignmentCommandSchema.safeParse(value).success).toBe(true);
  expect(facultyAssignmentCommandSchema.safeParse({...value,confirmed:false}).success).toBe(false);
  expect(facultyAssignmentCommandSchema.safeParse({...value,maxPoints:10000}).success).toBe(false);
  expect(facultyAssignmentCommandSchema.safeParse({...value,expectedUpdatedAt:undefined}).success).toBe(false);
 });
 it("protects assessment state and outstanding submissions under the row lock",()=>{
  const service=readFileSync("src/modules/courses/faculty-assignment-authoring-service.ts","utf8");
  const editor=readFileSync("src/components/courses/faculty-assignment-resources-editor.tsx","utf8");
  expect(service).toContain('input.action==="RESOURCES"');
  expect(service).toContain("if(submission)throw new CoursesServiceError");
  expect(service).toContain('input.action==="RESOURCES"?{updatedAt:now}');
  expect(editor).toContain('action:"RESOURCES"');
  expect(editor).toContain("resourcesOnly?{");
 });
});
