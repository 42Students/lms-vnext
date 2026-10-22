import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {tpoHomeNeedsLine} from "@/modules/placements/tpo-home-legacy-rows";

describe("TPO-home-02 exact legacy needs-you line",()=>{
 const rows=(n:number)=>Array.from({length:7},(_,i)=>({needsAttention:i<n}));
 it("says caught up when no row requires attention",()=>{
  expect(tpoHomeNeedsLine(rows(0))).toBe("You're all caught up.");
 });
 it("uses the exact legacy count phrases for one through seven attention rows",()=>{
  const words=["One thing needs","Two things need","Three things need","Four things need",
   "Five things need","Six things need","Seven things need"];
  words.forEach((word,i)=>expect(tpoHomeNeedsLine(rows(i+1))).toBe(word+" you today."));
 });
 it("the server page renders the computed line from live seven-row data",()=>{
  const page=readFileSync("src/app/(authenticated)/tpo/home/page.tsx","utf8");
  expect(page).toContain("{tpoHomeNeedsLine(Array.from(");
  expect(page).toContain("rows.filter(row=>row.needsAttention).length");
 });
});
