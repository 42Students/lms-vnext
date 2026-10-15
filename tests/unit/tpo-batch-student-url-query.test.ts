import {expect,it} from "vitest";
import {parseBatchStudentSearchParams} from "@/modules/placements/tpo-batch-student-view-model";
it("preserves all independent URL filters, including array-valued input",()=>{
 const parsed=parseBatchStudentSearchParams({q:"Akhi",decision:["INELIGIBLE","ELIGIBLE"],source:"LEARNER",registration:"UNRECORDED"});
 expect(parsed.success).toBe(true);
 if(!parsed.success)throw new Error("Unexpected parse rejection");
 expect(parsed.data).toEqual({q:"Akhi",decision:"INELIGIBLE",source:"LEARNER",registration:"UNRECORDED"});
});
it("rejects unknown filter values rather than silently accepting default",()=>{
 expect(parseBatchStudentSearchParams({decision:"ADMIN"}).success).toBe(false);
});
