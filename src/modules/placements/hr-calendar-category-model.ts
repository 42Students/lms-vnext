import {z} from "zod";
export const HR_CALENDAR_CATEGORIES=["ALL","ROUNDS","DEADLINES","RESULTS_DUE"] as const;
export const hrCalendarCategorySchema=z.enum(HR_CALENDAR_CATEGORIES);
export type HrCalendarCategory=z.infer<typeof hrCalendarCategorySchema>;
export function filterHrCalendarDays<T extends {
 events:readonly {kind:string}[];resultsDue:readonly unknown[];
}>(days:readonly T[],category:HrCalendarCategory) {
 return days.map(day=>({
  ...day,
  events:day.events.filter(event=>category==="ALL"||
   (category==="DEADLINES"?event.kind==="APPLICATION_DEADLINE":
    category==="ROUNDS"?event.kind!=="APPLICATION_DEADLINE":false)),
  resultsDue:category==="ALL"||category==="RESULTS_DUE"?[...day.resultsDue]:[],
 }));
}
