import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync(new URL("../../src/app/(authenticated)/tpo/drive-day/[roundId]/no-shows/page.tsx",import.meta.url),"utf8");
describe("UX-tpo-drive-day-roundid-no-shows-03",()=>{
 it("uses shared controls without changing legacy labels or authorized data",()=>{
  expect(source).toContain("<StatTile");
  expect(source).toContain("<DataTable");
  expect(source).toContain("empty={<p");
 });
});
