import {describe,it,expect} from "vitest";
import {learnerQuizSubmissionReceiptVisible} from "@/modules/courses/learner-quiz-submission-receipt-model";
describe("learner quiz persisted submission feedback",()=>{
  it("keeps success acknowledgement scoped to the submitted quiz",()=>{
    expect(learnerQuizSubmissionReceiptVisible("quiz-1","quiz-1")).toBe(true);
    expect(learnerQuizSubmissionReceiptVisible("quiz-1","quiz-2")).toBe(false);
  });
  it("does not claim persistence before the successful POST",()=>{
    expect(learnerQuizSubmissionReceiptVisible(null,"quiz-1")).toBe(false);
    expect(learnerQuizSubmissionReceiptVisible("","quiz-1")).toBe(false);
  });
});
