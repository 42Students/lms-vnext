import { describe, it, expect } from "vitest";
import { selectLearnerAssignmentFile } from "@/modules/courses/learner-assignment-file-selection-model";
const deliveryId = "00000000-0000-4000-8000-000000000001";
describe("learner selected file preflight", () => {
  it("retains valid supported files", () => { const file = { name: "report.pdf", type: "application/pdf", size: 25 }; expect(selectLearnerAssignmentFile(deliveryId, file)).toEqual({ file, error: null }); });
  it("prevents invalid, empty, oversized and forged delivery uploads", () => {
    for (const [id, file] of [[deliveryId, {name:"run.html", type:"text/html", size:20}], [deliveryId, {name:"empty.pdf", type:"application/pdf", size:0}], [deliveryId, {name:"oversized.pdf", type:"application/pdf", size:55*1024*1024}], ["not-uuid", {name:"file.pdf", type:"application/pdf", size:20}]] as const) {
      const choice = selectLearnerAssignmentFile(id, file); expect(choice.file).toBeNull(); expect(choice.error).toBeTruthy();
    }
    expect(selectLearnerAssignmentFile(deliveryId, null)).toEqual({ file: null, error: null });
  });
});
