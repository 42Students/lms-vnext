import {it,expect} from "vitest";
import {facultyManualGradeReceipt} from "@/modules/courses/faculty-manual-grade-receipt";
const id="317458a6-9f8b-4f48-862b-91a270e12bb1";
it("a publish action changes visibility only, not points or feedback",()=>{
 const scope={id,assignmentId:id,deliveryId:id,membershipId:id,version:1};
 const published={...scope,version:2,pointsAwarded:6,feedback:null,gradingStatus:"GRADED",gradePublished:true};
 expect(facultyManualGradeReceipt({submission:published},scope,"PUBLISH",10,{points:6,feedback:null})).toEqual(published);
 expect(()=>facultyManualGradeReceipt({submission:{...published,pointsAwarded:7}},scope,"PUBLISH",10,{points:6,feedback:null})).toThrow();
});