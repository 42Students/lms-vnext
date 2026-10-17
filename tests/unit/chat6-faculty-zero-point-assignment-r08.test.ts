import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {facultyAssignmentCommandSchema} from "../../src/modules/courses/faculty-assignment-authoring-model";
import {createCourseAssignmentInputSchema,updateCourseAssignmentInputSchema} from "../../src/modules/courses/assignment-validation";
import {facultyAssignmentDraftIssue} from "../../src/modules/courses/faculty-assignment-editor-ui-model";
const src=(p:string)=>readFileSync(p,"utf8");
const id="00000000-0000-4000-a000-000000000012";
describe("Faculty zero-point participation assignments",()=>{
 it("FAC-assessments-R08 permits zero-point participation assignments without allowing negative or noninteger marks",()=>{
  const base={lessonId:id,deliveryId:id,title:"Participation",description:"Review",dueAt:null,maxPoints:0,sequence:0};
  expect(createCourseAssignmentInputSchema.safeParse(base).success).toBe(true);
  expect(updateCourseAssignmentInputSchema.safeParse({maxPoints:0}).success).toBe(true);
  expect(facultyAssignmentCommandSchema.safeParse({...base,action:"CREATE",confirmed:true}).success).toBe(true);
  expect(facultyAssignmentDraftIssue({title:"Participation",description:"Review",maxPoints:0})).toBeNull();
  for(const value of [-1,0.5,1001])expect(facultyAssignmentDraftIssue({title:"Participation",description:"Review",maxPoints:value})).not.toBeNull();
  expect(src("src/db/schema/assessments.ts")).toContain("between 0 and 10000");
  expect(src("docs/proposed-migrations/faculty-assessments-participation-zero-points.sql")).toContain("max_points BETWEEN 0 AND 10000");
  for(const path of ["src/components/courses/faculty-assignment-editor.tsx","src/components/courses/faculty-lesson-authoring.tsx"])expect(src(path)).toContain("min={0}");
 });
});