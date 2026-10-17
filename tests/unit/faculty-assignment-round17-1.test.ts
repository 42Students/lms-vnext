import {expect,it} from "vitest";
import {facultyAssignmentCommandReceipt} from "@/modules/courses/faculty-assignment-editor-ui-model";
it("requires verified operation, actor Section and assignment ID",()=>{
 const row={id:"assignment-a",deliveryId:"section-a",title:"Exam",maxPoints:20,status:"DRAFT",updatedAt:"2026-10-15T10:00:00.000Z"};
 const request={action:"EDIT" as const,deliveryId:"section-a",assignmentId:"assignment-a",title:"Exam",maxPoints:20};
 expect(facultyAssignmentCommandReceipt({assignment:row},request)).toBe(true);
 expect(facultyAssignmentCommandReceipt({assignment:{...row,deliveryId:"section-b"}},request)).toBe(false);
 expect(facultyAssignmentCommandReceipt({assignment:{...row,id:"assignment-b"}},request)).toBe(false);
 expect(facultyAssignmentCommandReceipt({assignment:{...row,maxPoints:10}},request)).toBe(false);
 expect(facultyAssignmentCommandReceipt({assignment:{...row,status:"PUBLISHED"}},request)).toBe(true);
 expect(facultyAssignmentCommandReceipt({assignment:{...row,status:"PUBLISHED"}},{action:"PUBLISH",deliveryId:"section-a",assignmentId:"assignment-a"})).toBe(true);
 expect(facultyAssignmentCommandReceipt(null,request)).toBe(false);
});
