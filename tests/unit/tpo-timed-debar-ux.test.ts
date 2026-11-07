import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {todayInIndia,timedDebarDraftError} from "@/modules/placements/tpo-timed-debar-view-model";

const src=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
const base={reason:"Persistent eligibility breach",duration:"DATE" as const,
 untilDate:"2026-11-08",untilDrives:"1",today:"2026-11-07"};

describe("UX-G160 debarment and TPO new-work controls",()=>{
 it("uses India calendar dates instead of the browser's local timezone",()=>{
  expect(todayInIndia(new Date("2026-11-07T18:45:00.000Z"))).toBe("2026-11-08");
  expect(todayInIndia(new Date("2026-11-07T18:29:00.000Z"))).toBe("2026-11-07");
 });
 it("rejects missing reason, malformed and past dates, and invalid drive counts",()=>{
  expect(timedDebarDraftError({...base,reason:"  "})).toMatch(/reason/i);
  expect(timedDebarDraftError({...base,untilDate:"2026-11-06"})).toMatch(/future/i);
  expect(timedDebarDraftError({...base,untilDate:"2026-02-30"})).not.toBeNull();
  expect(timedDebarDraftError({...base,untilDate:"2026-11-07"})).toBeNull();
  expect(timedDebarDraftError({...base,duration:"DRIVES",untilDrives:"1.5"})).not.toBeNull();
  expect(timedDebarDraftError({...base,duration:"DRIVES",untilDrives:"0"})).not.toBeNull();
  expect(timedDebarDraftError({...base,duration:"DRIVES",untilDrives:"10001"})).not.toBeNull();
  expect(timedDebarDraftError({...base,duration:"DRIVES",untilDrives:"100"})).toBeNull();
 });
 it("isolates lifting reasons per restriction and guards malformed server responses",()=>{
  const ui=src("src/components/tpo/tpo-timed-debar-control.tsx");
  expect(ui).toContain("setLiftReasons(current=>({...current,[row.id]:e.target.value}))");
  expect(ui).toContain("liftReasons[confirm.id]");
  expect(ui).toContain("active.some(row=>row.id===confirm.id)");
  expect(ui).toContain("Array.isArray(result.rows)");
  expect(ui).toContain("setLiftReasons({})");
  expect(ui).toContain("dismissible={!pending}");
  expect(ui).toContain("min={today}");
 });
 it("uses unique date help IDs and accessible confirmation steps",()=>{
  const ui=src("src/components/tpo/tpo-timed-debar-control.tsx");
  expect(ui).toContain("useId()");
  expect(ui).toContain("aria-describedby={dateHelpId}");
  expect(ui).toContain("id={dateHelpId}");
  expect(ui).toContain("Review debarment");
  expect(ui).toContain("Review lift");
  expect(ui).toContain("Debarment history");
 });
 it("retains company contextual quick actions and encodes the query destination",()=>{
  const ui=src("src/components/tpo/tpo-topbar-new-menu.tsx");
  expect(ui).toContain('encodeURIComponent(companyName)');
  expect(ui).toContain('View all follow-ups');
  expect(ui).toContain('<nav aria-label=');
  expect(ui).toContain('replace(/\\s+/g," ")');
  expect(ui).toContain('TpoNewFollowupModal');
 });
});
