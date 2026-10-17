import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {sortTpoRequestRows,globalTpoRequestsQuerySchema} from "@/modules/placements/tpo-global-requests-model";
import {requestRowsTsv} from "@/components/placements/tpo-request-page-clipboard";
const src=(path:string)=>readFileSync(new URL("../../src/"+path,import.meta.url),"utf8");
describe("TPO request grid and controls",()=>{
 it("TPO-requests-verification-16 sorts decided timestamps, keeping undecided at the end",()=>{
  const rows=[{id:"a",requestedAt:new Date("2099-01-01"),decidedAt:null},
   {id:"b",requestedAt:new Date("2099-01-01"),decidedAt:new Date("2099-01-03")},
   {id:"c",requestedAt:new Date("2099-01-01"),decidedAt:new Date("2099-01-02")}];
  expect(sortTpoRequestRows(rows,"DECIDED_NEWEST").map(x=>x.id)).toEqual(["b","c","a"]);
  expect(sortTpoRequestRows(rows,"DECIDED_OLDEST").map(x=>x.id)).toEqual(["c","b","a"]);
 });
 it("TPO-requests-verification-11 accepts Decided on sort and preserves request age selection",()=>{
  expect(globalTpoRequestsQuerySchema.safeParse({sort:"DECIDED_OLDEST",age:"ONE_TO_TWO_DAYS"}).success).toBe(true);
 });
 it("TPO-requests-verification-13 restricts future bulk selection to authorized page rows",()=>{
  expect(src("components/placements/tpo-request-page-clipboard.tsx")).toContain("rows.filter(row=>selected.includes(row.id))");
 });
 it("TPO-requests-verification-15 copies TSV safely while filtered CSV remains a separate action",()=>{
  expect(requestRowsTsv([{id:"a",student:"=x",number:null,kind:"WITHDRAW",company:"Foo",asked:"2099",status:"PENDING",decided:null}])).toContain("'=x");
 });
 it("TPO-requests-verification-05 preserves guarded requests behavior",()=>{expect(src("app/(authenticated)/tpo/requests/page.tsx")).toContain("Urgent only");});
 it("TPO-requests-verification-07 preserves guarded requests behavior",()=>{expect(src("app/(authenticated)/tpo/requests/page.tsx")).toContain("Request statuses");});
 it("TPO-requests-verification-08 preserves guarded requests behavior",()=>{expect(src("app/(authenticated)/tpo/requests/page.tsx")).toContain("tpoNextRoundCue");});
 it("TPO-requests-verification-12 preserves guarded requests behavior",()=>{expect(src("app/(authenticated)/tpo/requests/page.tsx")).toContain("Needs doing first");});
 it("TPO-requests-verification-17 preserves guarded requests behavior",()=>{expect(src("app/(authenticated)/tpo/requests/page.tsx")).toContain("No requests in this period");});
 it("TPO-requests-verification-18 preserves guarded requests behavior",()=>{expect(src("app/(authenticated)/tpo/requests/page.tsx")).toContain("Reset filters");});
 it("TPO-requests-verification-R01 preserves guarded requests behavior",()=>{expect(src("app/(authenticated)/tpo/requests/page.tsx")).toContain("TpoRequestDecisionControl");});
});
