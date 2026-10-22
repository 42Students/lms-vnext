import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync(new URL("../../src/app/(authenticated)/tpo/drive-day/[roundId]/no-shows/page.tsx",import.meta.url),"utf8");
describe("UX-tpo-drive-day-roundid-no-shows-03",()=>{
 it("uses shared controls without changing legacy labels or authorized data",()=>{
  expect(source).toContain('aria-label="Attendance reconciliation"');
  expect(source).toContain("report.awaitingMarkCount");
  expect(source).toContain("report.explicitlyAbsentCount");
  expect(source).toContain("<DataTable");
  expect(source).toContain('empty={<EmptyState title="No learner is currently marked ABSENT in this round."');
  expect(source).toContain("This does not mean all learners attended");
 });
});
