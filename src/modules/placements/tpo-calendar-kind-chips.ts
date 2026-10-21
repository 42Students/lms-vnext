import type { PlacementCalendarEvent } from "./placement-calendar-model";
/** TPO-calendar-reports-11: independently toggle Talk vs interview rounds. */
export const TPO_CALENDAR_CHIP_CHOICES = [
 { value: "ROUND", label: "Round", color: "#0958d9" },
 { value: "TALK", label: "Talk", color: "#6b2fd1" },
 { value: "APPLICATION_DEADLINE", label: "Deadline", color: "#b34700" },
 { value: "FOLLOW_UP", label: "Follow-up", color: "#0a7c88" },
 { value: "BLOCKED", label: "Blocked", color: "#5b6b82" },
] as const;
export type TpoCalendarChip = (typeof TPO_CALENDAR_CHIP_CHOICES)[number]["value"];
const valid = new Set<string>(TPO_CALENDAR_CHIP_CHOICES.map(item=>item.value));
export function parseTpoCalendarChips(raw: string | undefined): TpoCalendarChip[] {
 if (!raw || raw.length > 160) return [];
 return [...new Set(raw.split(",").filter(item=>valid.has(item)) as TpoCalendarChip[])];
}
export function toggleTpoCalendarChip(current: readonly TpoCalendarChip[], value: TpoCalendarChip): TpoCalendarChip[] {
 const selected=[...new Set(current.filter(item=>valid.has(item)))];
 // Empty means All events. One click isolates the first kind, toggling
 // the last remaining kind returns to All rather than an empty-results view.
 if(selected.includes(value))return selected.length===1?[]:selected.filter(item=>item!==value);
 return [...selected,value];
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
