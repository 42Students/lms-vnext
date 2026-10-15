import {it,expect} from "vitest";
import {filterBatchStudentDecisions,batchStudentViewSchema} from "@/modules/placements/tpo-batch-student-view-model";
const rows=[{decision:"ELIGIBLE",ambiguous:false},{decision:"NOT_DECIDED",ambiguous:true},{decision:"INELIGIBLE",ambiguous:false}];
it("separates effective decisions from ambiguous enrollment",()=>{
 expect(filterBatchStudentDecisions(rows,"ELIGIBLE")).toEqual([rows[0]]);
 expect(filterBatchStudentDecisions(rows,"NEEDS_REVIEW")).toEqual([rows[1]]);
 expect(filterBatchStudentDecisions(rows,"NOT_DECIDED")).toEqual([]);
});
it("rejects unknown eligibility filters",()=>expect(batchStudentViewSchema.safeParse({decision:"APPROVED"}).success).toBe(false));
