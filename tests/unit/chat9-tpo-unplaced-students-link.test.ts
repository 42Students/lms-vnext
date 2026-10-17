import {describe,it,expect} from "vitest";
import {tpoUnplacedStudentsHref} from "../../src/modules/placements/tpo-unplaced-students-link";
describe("Unplaced Students follow-up",()=>{
 it("TPO-calendar-reports-44 preserves batch and branch for the legacy Students shortcut",()=>{
  const url=tpoUnplacedStudentsHref({batchId:"batch-a",branchId:"branch-b"});
  expect(url).toBe("/tpo/students?journeyState=READY_NOT_APPLYING&batchId=batch-a&branchId=branch-b");
  expect(tpoUnplacedStudentsHref({})).toBe("/tpo/students?journeyState=READY_NOT_APPLYING");
 });
});
