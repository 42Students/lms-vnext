import { placementCalendarDayKey, type PlacementCalendarDayGroup } from "./placement-calendar-model";

export type HrDueItem = {
  id: string;
  jobId: string;
  jobTitle: string;
  roundName: string;
  dueAt: Date;
  status: string;
};

export function combineHrCalendarDays(
  regular: readonly PlacementCalendarDayGroup[],
  due: readonly HrDueItem[],
) {
  const days = new Map<string, {
    day: string;
    events: PlacementCalendarDayGroup["events"];
    resultsDue: HrDueItem[];
  }>();
  for (const group of regular) {
    days.set(group.day, {
      day: group.day,
      events: [...group.events],
      resultsDue: [],
    });
  }
  for (const item of due) {
    if (!Number.isFinite(item.dueAt.getTime())) continue;
    const day = placementCalendarDayKey(item.dueAt);
    const group = days.get(day) ?? { day, events: [], resultsDue: [] };
    group.resultsDue.push(item);
    days.set(day, group);
  }
  return [...days.values()].sort((a, b) => a.day.localeCompare(b.day))
    .map((group) => ({
      ...group,
      resultsDue: group.resultsDue.sort((a, b) =>
        a.dueAt.getTime() - b.dueAt.getTime() || a.id.localeCompare(b.id)),
    }));
}

export function hrResultsDueHref(jobId:string,roundId?:string) {
  const base="/recruiter/drives/"+encodeURIComponent(jobId)+"?tab=rounds";
  return roundId?base+"&roundId="+encodeURIComponent(roundId):base;
}

/** Only occupied days in the selected week or month are presented on narrow
 * screens. The desktop seven-column grid remains unchanged. */
export function selectHrMobileCalendarDays(
  days: ReturnType<typeof combineHrCalendarDays>,
  visibleDays: readonly string[],
) {
  const visible = new Set(visibleDays);
  return days.filter((day) => visible.has(day.day) &&
    (day.events.length !== 0 || day.resultsDue.length !== 0));
}
