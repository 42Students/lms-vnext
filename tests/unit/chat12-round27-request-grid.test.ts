import {describe,it,expect} from "vitest";
import {globalTpoRequestsQuerySchema} from "@/modules/placements/tpo-global-requests-model";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("TPO Requests grid and 500 row parity",()=>{
 it("TPO-requests-verification-16 provides 500-row server paging, column selection, sticky students, selected copy, and Ask/Decided sort",()=>{
  expect(globalTpoRequestsQuerySchema.parse({pageSize:"500"}).pageSize).toBe(500);
  expect(globalTpoRequestsQuerySchema.safeParse({pageSize:501}).success).toBe(false);
  const ui=read("src/components/placements/tpo-request-page-clipboard.tsx");
  expect(ui).toContain("Choose columns");
  expect(ui).toContain("Decided on · oldest");
  expect(ui).toContain("Asked · newest");
  expect(ui).toContain("sticky left-0");
  expect(ui).toContain("navigator.clipboard.writeText(requestRowsTsv(selectedRows))");
  expect(ui).toContain('aria-label="Request spreadsheet"');
  expect(read("src/app/(authenticated)/tpo/requests/page.tsx")).toContain('<option value="500">500</option>');
 });
});
