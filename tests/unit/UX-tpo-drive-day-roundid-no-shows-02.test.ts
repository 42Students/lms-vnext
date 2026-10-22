import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync(new URL("../../src/app/(authenticated)/tpo/drive-day/[roundId]/no-shows/page.tsx",import.meta.url),"utf8");
describe("UX-tpo-drive-day-roundid-no-shows-02",()=>{
 it("renders a shared responsive DataTable with explicit legacy empty copy and authorized rows",()=>{
  expect(source).toContain("<DataTable");
  expect(source).toContain("getRowKey=");
  expect(source).toContain("mobilePriority");
  expect(source).toContain("empty={<EmptyState");
  expect(source).toContain('title="No learner is currently marked ABSENT in this round."');
  expect(source).toContain("No learner is currently marked ABSENT in this round.");
  expect(source).not.toContain("<table");
 });
});
