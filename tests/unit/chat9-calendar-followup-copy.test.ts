import {describe,it,expect} from "vitest";
import {tpoCalendarFollowupError,tpoCalendarFollowupSuccess} from "../../src/modules/placements/tpo-calendar-followup-messages";
describe("TPO follow-up UI messages",()=>{
 it("TPO-calendar-reports-19 matches legacy add, move and done success wording",()=>{
  expect(tpoCalendarFollowupSuccess("ADD")).toBe("Follow-up added");
  expect(tpoCalendarFollowupSuccess("MOVE")).toBe("Follow-up moved");
  expect(tpoCalendarFollowupSuccess("DONE")).toBe("Follow-up marked done");
 });
 it("TPO-calendar-reports-19 never leaks raw CRM or migration codes on failure",()=>{
  expect(tpoCalendarFollowupError("MOVE","TPO_CRM_FOLLOWUP_ALREADY_DONE")).toBe("Could not move it");
  expect(tpoCalendarFollowupError("DONE","SOME_INTERNAL_CODE")).toBe("Could not mark it done");
  expect(tpoCalendarFollowupError("ADD","UNKNOWN")).toBe("Could not save the follow-up");
  expect(tpoCalendarFollowupError("ADD","DB09_MIGRATIONS_PENDING")).toBe("Follow-up was not saved");
 });
});
