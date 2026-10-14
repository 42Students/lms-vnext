import {z} from "zod";
import type {HrDueItem} from "./hr-calendar-day-model";
import type {PlacementCalendarDayGroup} from "./placement-calendar-model";
export const HR_CALENDAR_CATEGORIES=["ALL","ROUNDS","DEADLINES","RESULTS_DUE"] as const;
export const hrCalendarCategorySchema=z.enum(HR_CALENDAR_CATEGORIES);
export type HrCalendarCategory=z.infer<typeof hrCalendarCategorySchema>;
export type HrCalendarFilterDay={
 day:string;events:PlacementCalendarDayGroup["events"];resultsDue:HrDueItem[];
};
export function filterHrCalendarDays(days:readonly HrCalendarFilterDay[],category:HrCalendarCategory):HrCalendarFilterDay[] {
 return days.map(day=>({
  ...day,
  events:day.events.filter(event=>category==="ALL"||
   (category==="DEADLINES"?event.kind==="APPLICATION_DEADLINE":
    category==="ROUNDS"?event.kind==="ROUND":false)),
  resultsDue:category==="ALL"||category==="RESULTS_DUE"?[...day.resultsDue]:[],
 }));
}
