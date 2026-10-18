import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync(new URL("../../src/app/(authenticated)/tpo/calendar/rounds/page.tsx",import.meta.url),"utf8");
describe("UX-tpo-calendar-rounds-04",()=>{
 it("reuses audited form controls and preserves existing URL/submit behavior",()=>{
  expect(source).toContain("<Input");
  expect(source).toContain("<Button");
  expect(source).toContain('method="get"');
 });
});
