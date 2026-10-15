import {it,expect} from "vitest";
import {summarizeBatchStudentEvidence} from "@/modules/placements/tpo-batch-student-evidence-summary-model";
it("counts a person once, separating ambiguous decisions and direct overrides",()=>{
 const rows=[{decision:"ELIGIBLE",ambiguous:false,source:"LEARNER"},{decision:"NOT_DECIDED",ambiguous:true,source:"NONE"},{decision:"INELIGIBLE",ambiguous:false,source:"BATCH"}];
 expect(summarizeBatchStudentEvidence(rows)).toEqual({assessed:3,eligible:1,ineligible:1,undecided:0,needsReview:1,directOverrides:1});
 expect(summarizeBatchStudentEvidence([]).assessed).toBe(0);
});
