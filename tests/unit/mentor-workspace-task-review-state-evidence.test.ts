import {expect,it} from "vitest";
import {mentorTaskReviewEvidence} from "@/modules/projects/mentor-workspace-evidence-model";
it("requires a current persisted submitted attempt before raising review attention",()=>{
 expect(mentorTaskReviewEvidence("IN_REVIEW",{status:"SUBMITTED",version:2})).toBe("REVIEW_PENDING");
 expect(mentorTaskReviewEvidence("IN_REVIEW",{status:"APPROVED",version:1})).toBe("UNMATCHED");
 expect(mentorTaskReviewEvidence("IN_REVIEW",null)).toBe("NO_SUBMISSION");
 expect(mentorTaskReviewEvidence("DONE",{status:"SUBMITTED",version:1})).toBe("RECORDED");
});
