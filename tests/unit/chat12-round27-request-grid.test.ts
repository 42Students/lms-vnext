import {describe,it,expect} from "vitest";
import {globalTpoRequestsQuerySchema} from "@/modules/placements/tpo-global-requests-model";
import {requestRowsTsv,selectedRequestClipboardRows,type TpoRequestClipboardRow} from "@/components/placements/tpo-request-page-clipboard";
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
  expect(ui).toContain("sm:sticky sm:left-10");
  expect(ui).toContain("rows.filter(row=>selected.includes(row.id))");
  expect(ui).toContain("navigator.clipboard.writeText(requestRowsTsv(selectedRows,visible as readonly TpoRequestClipboardColumn[]))");
  expect(ui).toContain('caption="Request spreadsheet"');
  expect(read("src/app/(authenticated)/tpo/requests/page.tsx")).toContain('<option value="500">500</option>');
  const pageRows:TpoRequestClipboardRow[]=[
   {id:"a",student:"=unsafe",number:"r1",kind:"WITHDRAW",company:"Company A",asked:"2099-01-01",status:"PENDING",decided:null},
   {id:"b",student:"Student B",number:"r2",kind:"WITHDRAW",company:"Company B",asked:"2099-01-03",status:"PENDING",decided:null},
  ];
  expect(selectedRequestClipboardRows(pageRows,["b","not-on-page"],"ASKED_NEW").map(row=>row.id)).toEqual(["b"]);
  const copy=requestRowsTsv(selectedRequestClipboardRows(pageRows,["a"],"ASKED_NEW"),["student","asked"]);
  expect(copy).toBe("Student\tAsked\n'=unsafe\t2099-01-01");
  expect(copy).not.toContain("Company A");
 });
});
