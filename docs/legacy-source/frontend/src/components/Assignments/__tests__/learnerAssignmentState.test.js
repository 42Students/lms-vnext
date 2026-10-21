import moment from "moment";
import { learnerAssignmentState } from "../AssignmentsContent";

// LRN-A-03 / LRN-T-04: when submission status failed to load, an unsubmitted-looking card never
// offers Submit; a known submission still shows as submitted.
describe("learnerAssignmentState when submissions are unknown", () => {
  const record = { contentDataDTO: { due_date: "2030-01-01T10:00:00Z" } };
  it("does not offer Submit", () => {
    const state = learnerAssignmentState(record, null, moment("2026-10-06"), true);
    expect(state.action).not.toBe("Submit");
    expect(state.tone).toBe("unknown");
  });
  it("still shows a known submission", () => {
    const state = learnerAssignmentState(record, { graded: 0, submittedAt: "2026-10-01T10:00:00Z" }, moment("2026-10-06"), true);
    expect(state.tone).toBe("submitted");
  });
});
