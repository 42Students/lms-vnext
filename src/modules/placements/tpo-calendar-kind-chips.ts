import type { PlacementCalendarEvent } from "./placement-calendar-model";
/** TPO-calendar-reports-11: independently toggle Talk vs interview rounds. */
export const TPO_CALENDAR_CHIP_CHOICES = [
 { value: "ROUND", label: "Rounds" },
 { value: "TALK", label: "Talks" },
 { value: "APPLICATION_DEADLINE", label: "Deadlines" },
 { value: "FOLLOW_UP", label: "Follow-ups" },
 { value: "BLOCKED", label: "Blocked (exam) dates" },
] as const;
export type TpoCalendarChip = (typeof TPO_CALENDAR_CHIP_CHOICES)[number]["value"];
const valid = new Set<string>(TPO_CALENDAR_CHIP_CHOICES.map(item=>item.value));
export function parseTpoCalendarChips(raw: string | undefined): TpoCalendarChip[] {
 if (!raw || raw.length > 160) return [];
 return [...new Set(raw.split(",").filter(item=>valid.has(item)) as TpoCalendarChip[])];
}
export function toggleTpoCalendarChip(current: readonly TpoCalendarChip[], value: TpoCalendarChip): TpoCalendarChip[] {
 return current.includes(value) ? current.filter(item=>item!==value) : [...current,value];
}
export function matchesTpoCalendarChip(event: PlacementCalendarEvent, value: TpoCalendarChip): boolean {
 if(value==="TALK") return event.kind==="ROUND" && event.roundKind==="TALK";
 if(value==="ROUND") return event.kind==="ROUND" && event.roundKind!=="TALK";
 return event.kind===value;
}
export function filterTpoCalendarChipEvents(events: readonly PlacementCalendarEvent[], selected: readonly TpoCalendarChip[]): PlacementCalendarEvent[] {
 return selected.length ? events.filter(event=>selected.some(value=>matchesTpoCalendarChip(event,value))) : [...events];
}
export function tpoCalendarChipCount(events: readonly PlacementCalendarEvent[], value: TpoCalendarChip): number {
 return events.filter(event=>matchesTpoCalendarChip(event,value)).length;
}
