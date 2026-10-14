import {describe,expect,it} from "vitest";
import {learnerProjectReadFailureDisposition} from "@/modules/projects/learner-project-detail-error-model";
describe("L21-012 learner Project access/error states",()=>{
  it("does not leak other-college or missing Project existence",()=>{
    expect(learnerProjectReadFailureDisposition("PROJECT_ACCESS_DENIED")).toBe("NOT_FOUND");
    expect(learnerProjectReadFailureDisposition("PROJECT_NOT_FOUND")).toBe("NOT_FOUND");
    expect(learnerProjectReadFailureDisposition("COLLEGE_NOT_FOUND")).toBe("NOT_FOUND");
  });
  it("preserves retryable loader/service failures",()=>{
    expect(learnerProjectReadFailureDisposition("PROJECT_INVALID_STATE")).toBe("RETRY");
  });
});
