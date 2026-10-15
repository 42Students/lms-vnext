import {it,expect} from "vitest";
import {facultyManualGradeReceipt} from "@/modules/courses/faculty-manual-grade-receipt";
const id="317458a6-9f8b-4f48-862b-91a270e12bb1";
it("rejects server receipts that echo a different score or feedback",()=>{
 const scope={id,assignmentId:id,deliveryId:id,membershipId:id,version:0};
 const submission={...scope,version:1,pointsAwarded:8,feedback:"Reviewed",gradingStatus:"GRADED",gradePublished:false};
 expect(facultyManualGradeReceipt({submission},scope,"GRADE",10,{points:8,feedback:"Reviewed"}).pointsAwarded).toBe(8);
 expect(()=>facultyManualGradeReceipt({submission},scope,"GRADE",10,{points:9,feedback:"Reviewed"})).toThrow();
 expect(()=>facultyManualGradeReceipt({submission},scope,"GRADE",10,{points:8,feedback:"Other"})).toThrow();
});