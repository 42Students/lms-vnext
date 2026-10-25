import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { filterTpoCalendarChipEvents, parseTpoCalendarChips, toggleTpoCalendarChip, tpoCalendarChipCount } from "../../src/modules/placements/tpo-calendar-kind-chips";
import type { PlacementCalendarEvent } from "../../src/modules/placements/placement-calendar-model";
const source = (p: string) => readFileSync(join(process.cwd(),p),"utf8");
const event = (kind:PlacementCalendarEvent["kind"],roundKind:string|null=null)=>({kind,roundKind} as PlacementCalendarEvent);
describe("TPO Calendar multi-chip filter",()=>{
 it("TPO-calendar-reports-11 combines filter chips without collapsing Talks into Rounds",()=>{
  const events=[event("ROUND","TALK"),event("ROUND","INTERVIEW"),event("FOLLOW_UP"),event("BLOCKED"),event("APPLICATION_DEADLINE")];
  expect(parseTpoCalendarChips("TALK,FOLLOW_UP,TALK,NOPE")).toEqual(["TALK","FOLLOW_UP"]);
  expect(toggleTpoCalendarChip(["TALK"],"FOLLOW_UP")).toEqual(["TALK","FOLLOW_UP"]);
  expect(toggleTpoCalendarChip(["TALK","ROUND"],"TALK")).toEqual(["ROUND"]);
  expect(tpoCalendarChipCount(events,"TALK")).toBe(1);
  expect(tpoCalendarChipCount(events,"ROUND")).toBe(1);
  expect(filterTpoCalendarChipEvents(events,["TALK","FOLLOW_UP"])).toEqual([events[0],events[2]]);
  const page=source("src/components/placements/placement-calendar-workspace.tsx");
  expect(page).toContain("filterTpoCalendarChipEvents");
  expect(page).toContain("Select multiple event types");
  expect(page).toContain("params.set(\"kinds\"");
  expect(source("src/app/(authenticated)/tpo/calendar/page.tsx")).toContain("kinds: first(raw.kinds)");
 });
});
