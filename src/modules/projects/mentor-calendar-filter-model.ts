import {z} from "zod";
import type {MentorMeetingCalendarItem} from "./mentor-calendar-view";

/** Filters only rows returned by the current Mentor's persisted scoped roster. */
export const mentorCalendarFiltersSchema=z.object({
  status:z.enum(["ALL","REQUESTED","SCHEDULED","COMPLETED","CANCELLED"]).default("ALL"),
  search:z.string().trim().max(100).default(""),
}).strict();
export type MentorCalendarFilters=z.infer<typeof mentorCalendarFiltersSchema>;

export function filterMentorCalendar(
  meetings:readonly MentorMeetingCalendarItem[],query:MentorCalendarFilters,
){
  const term=query.search.toLocaleLowerCase("en-IN");
  return meetings.filter(row=>
    (query.status==="ALL"||row.status===query.status)&&
    (!term||[row.title,row.projectTitle,row.linkedSprintTitle??""].some(
      value=>value.toLocaleLowerCase("en-IN").includes(term)))).sort(
        (a,b)=>a.startsAt.localeCompare(b.startsAt)||a.id.localeCompare(b.id));
}
export function mentorCalendarFilterHref(query:MentorCalendarFilters){
  const params=new URLSearchParams();
  if(query.status!=="ALL")params.set("status",query.status);
  if(query.search)params.set("search",query.search);
  return "/mentor/calendar"+(params.size?"?"+params.toString():"");
}
