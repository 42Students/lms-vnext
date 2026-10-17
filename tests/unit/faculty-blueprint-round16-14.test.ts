import {expect,it} from "vitest";
import {facultyAssignmentDraftIssue} from "@/modules/courses/faculty-assignment-editor-ui-model";
it("FAC-assessments-R08 validates authoring fields and permits zero-point participation assignments",()=>{
 expect(facultyAssignmentDraftIssue({title:"Topic",description:"Text",maxPoints:20})).toBeNull();
 expect(facultyAssignmentDraftIssue({title:" ",description:"Text",maxPoints:20})).toMatch(/title/);
 expect(facultyAssignmentDraftIssue({title:"a".repeat(256),description:"",maxPoints:20})).toMatch(/title/);
 expect(facultyAssignmentDraftIssue({title:"Topic",description:"x".repeat(10001),maxPoints:20})).toMatch(/instructions/);
 expect(facultyAssignmentDraftIssue({title:"Topic",description:"",maxPoints:0})).toBeNull();
 for(const maxPoints of [-1,1.5,Infinity,10001]){
  expect(facultyAssignmentDraftIssue({title:"Topic",description:"",maxPoints})).toMatch(/whole number/);
 }
});
