import {it,expect} from "vitest";import {facultyManualGradeReceipt} from "@/modules/courses/faculty-manual-grade-receipt";
const a="317458a6-9f8b-4f48-862b-91a270e12bb1";
it("never marks a grade as published without an exact newer persisted receipt",()=>{
 const old={id:a,assignmentId:a,deliveryId:a,membershipId:a,version:4};
 const result={...old,version:5,pointsAwarded:8,feedback:"Great",gradingStatus:"GRADED",gradePublished:true};
 expect(facultyManualGradeReceipt({submission:result},old,"PUBLISH",10).gradePublished).toBe(true);
 for(const version of [4,6,4.5])expect(()=>facultyManualGradeReceipt({submission:{...result,version}},old,"PUBLISH",10)).toThrow();
 expect(()=>facultyManualGradeReceipt({submission:{...result,gradePublished:false}},old,"PUBLISH",10)).toThrow();
});