import {z} from "zod";
import type {MentorMeetingCalendarItem} from "./mentor-calendar-view";

/** Filters only rows returned by the current Mentor's persisted scoped roster. */
export const mentorCalendarFiltersSchema=z.object({
  status:z.enum(["ALL","REQUESTED","SCHEDULED","COMPLETED","CANCELLED"]).default("ALL"),
  type:z.enum(["ALL","GENERAL","PLANNING","STANDUP","REVIEW","RETRO"]).default("ALL"),
  projectState:z.enum(["ALL","PLANNED","ACTIVE","COMPLETED","ARCHIVED"]).default("ALL"),
  search:z.string().trim().max(100).default(""),
  period:z.enum(["ALL","TODAY","NEXT_7_DAYS","PAST_7_DAYS"]).default("ALL"),
}).strict();
export type MentorCalendarFilters=z.infer<typeof mentorCalendarFiltersSchema>;

export function filterMentorCalendar(
  meetings:readonly MentorMeetingCalendarItem[],
  query:Pick<MentorCalendarFilters,"status"|"search"|"period"> &
    {type?:MentorCalendarFilters["type"];projectState?:MentorCalendarFilters["projectState"]},
  now:Date=new Date(),
){
  const term=query.search.toLocaleLowerCase("en-IN");
  const day=(instant:Date)=>{
    const parts=new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Kolkata",
      year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(instant);
    const value=(key:string)=>Number(parts.find(p=>p.type===key)?.value??0);
    return Date.UTC(value("year"),value("month")-1,value("day"));
  };
  const today=day(now);
  const inPeriod=(startsAt:string)=>{
    if(query.period==="ALL")return true;
    const date=new Date(startsAt);
    if(!Number.isFinite(date.getTime()))return false;
    const diff=(day(date)-today)/86400000;
    return query.period==="TODAY"?diff===0:
      query.period==="NEXT_7_DAYS"?diff>=0&&diff<=6:diff<=-1&&diff>=-7;
  };
  return meetings.filter(row=>
    (query.status==="ALL"||row.status===query.status)&&
    (!query.type||query.type==="ALL"||row.meetingType===query.type)&&
    (!query.projectState||query.projectState==="ALL"||row.projectStatus===query.projectState)&&
    inPeriod(row.startsAt)&&
    (!term||[row.title,row.projectTitle,row.linkedSprintTitle??""].some(
      value=>value.toLocaleLowerCase("en-IN").includes(term)))).sort(
        (a,b)=>a.startsAt.localeCompare(b.startsAt)||a.id.localeCompare(b.id));
}
export function mentorCalendarFilterHref(query:Pick<MentorCalendarFilters,"status"|"search"|"period"> &
  {type?:MentorCalendarFilters["type"];projectState?:MentorCalendarFilters["projectState"]}){
  const params=new URLSearchParams();
  if(query.status!=="ALL")params.set("status",query.status);
  if(query.type&&query.type!=="ALL")params.set("type",query.type);
  if(query.projectState&&query.projectState!=="ALL")params.set("projectState",query.projectState);
  if(query.search)params.set("search",query.search);
  if(query.period!=="ALL")params.set("period",query.period);
  return "/mentor/calendar"+(params.size?"?"+params.toString():"");
}
