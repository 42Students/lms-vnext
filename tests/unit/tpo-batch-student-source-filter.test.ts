import {it,expect} from "vitest";
import {filterBatchStudentDecisionSource,batchStudentViewSchema} from "@/modules/placements/tpo-batch-student-view-model";
it("shows inherited source without claiming an absent decision",()=>{
 const rows=[{source:"LEARNER"},{source:"CLASS"},{source:"BATCH"},{source:"NONE"}];
 expect(filterBatchStudentDecisionSource(rows,"CLASS")).toEqual([rows[1]]);
 expect(filterBatchStudentDecisionSource(rows,"NONE")).toEqual([rows[3]]);
 expect(filterBatchStudentDecisionSource(rows,"ALL")).toHaveLength(4);
 expect(batchStudentViewSchema.safeParse({source:"FOREIGN"}).success).toBe(false);
});
