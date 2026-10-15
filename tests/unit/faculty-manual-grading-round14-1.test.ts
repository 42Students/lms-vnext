import {it,expect} from "vitest";import {facultyManualGradeReceipt} from "@/modules/courses/faculty-manual-grade-receipt";
const a="317458a6-9f8b-4f48-862b-91a270e12bb1",b="317458a6-9f8b-4f48-862b-91a270e12bb2";
it("rejects a successful grade response from another submission",()=>{
 const previous={id:a,assignmentId:a,deliveryId:a,membershipId:a,version:2};
 const submission={...previous,version:3,pointsAwarded:7,feedback:null,gradingStatus:"GRADED",gradePublished:false};
 expect(facultyManualGradeReceipt({submission},previous,"GRADE",10).version).toBe(3);
 expect(()=>facultyManualGradeReceipt({submission:{...submission,id:b}},previous,"GRADE",10)).toThrow("GRADE_RECEIPT_UNVERIFIED");
 expect(()=>facultyManualGradeReceipt({submission:{...submission,gradePublished:true}},previous,"GRADE",10)).toThrow();
});