import {z} from "zod";
import {mentorMeetingDisplayStatus,safeMentorMeetingJoinUrl,type MentorMeetingCalendarItem} from "./mentor-calendar-view";

/** Filters only rows returned by the current Mentor's persisted scoped roster. */
export const mentorCalendarFiltersSchema=z.object({
  join:z.enum(["ALL","HAS_SAFE_LINK","NO_SAFE_LINK"]).default("ALL"),
  sprint:z.enum(["ALL","LINKED","UNLINKED"]).default("ALL"),
  projectId:z.preprocess(v=>v===""?undefined:v,z.string().uuid().optional()),
  attention:z.enum(["ALL","OVERDUE_REQUESTED","SOON_SCHEDULED","MISSED_SCHEDULED","NOTES_MISSING"]).default("ALL"),
  status:z.enum(["ALL","DRAFT","REQUESTED","SCHEDULED","RESCHEDULED","COMPLETED","CANCELLED"]).default("ALL"),
  type:z.enum(["ALL","GENERAL","PLANNING","STANDUP","REVIEW","RETRO"]).default("ALL"),
  projectState:z.enum(["ALL","PLANNED","ACTIVE","COMPLETED","ARCHIVED"]).default("ALL"),
  search:z.string().trim().max(100).default(""),
  period:z.enum(["ALL","TODAY","NEXT_7_DAYS","PAST_7_DAYS"]).default("ALL"),
}).strict();
export type MentorCalendarFilters=z.infer<typeof mentorCalendarFiltersSchema>;

export function filterMentorCalendar(
  meetings:readonly MentorMeetingCalendarItem[],
  query:Pick<MentorCalendarFilters,"status"|"search"|"period"> &
    {type?:MentorCalendarFilters["type"];projectState?:MentorCalendarFilters["projectState"];
      attention?:MentorCalendarFilters["attention"];projectId?:MentorCalendarFilters["projectId"];join?:MentorCalendarFilters["join"];sprint?:MentorCalendarFilters["sprint"]},
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
    (!query.projectId||row.projectId===query.projectId)&&
    (!query.sprint||query.sprint==="ALL"||
      (query.sprint==="LINKED" ? row.linkedSprintTitle!==null : row.linkedSprintTitle===null))&&
    (!query.join||query.join==="ALL"||
      (query.join==="HAS_SAFE_LINK" ? safeMentorMeetingJoinUrl(row)!==null : safeMentorMeetingJoinUrl(row)===null))&&
    (!query.attention||query.attention==="ALL"||
      (query.attention==="OVERDUE_REQUESTED"
        ? row.status==="REQUESTED"&&Date.parse(row.startsAt)<now.getTime()
        : query.attention==="SOON_SCHEDULED"
          ? row.status==="SCHEDULED"&&Date.parse(row.startsAt)>=now.getTime()&&
            Date.parse(row.startsAt)<=now.getTime()+48*3600000
          : query.attention==="NOTES_MISSING"
          ? row.status==="COMPLETED"&&
            !row.outcome?.trim()&&!row.facilitation?.notes?.trim()&&
            !row.facilitation?.wentWell?.trim()&&
            !row.facilitation?.retroDidntGoWell?.trim()&&
            !row.facilitation?.improve?.trim()&&
            !(row.facilitation?.actionItemRows?.length)
          : mentorMeetingDisplayStatus(row,now)==="MISSED"))&&
    (query.status==="ALL"||row.status===query.status)&&
    (!query.type||query.type==="ALL"||row.meetingType===query.type)&&
    (!query.projectState||query.projectState==="ALL"||row.projectStatus===query.projectState)&&
    inPeriod(row.startsAt)&&
    (!term||[row.title,row.projectTitle,row.linkedSprintTitle??""].some(
      value=>value.toLocaleLowerCase("en-IN").includes(term)))).sort(
        (a,b)=>a.startsAt.localeCompare(b.startsAt)||a.id.localeCompare(b.id));
}
export function mentorCalendarFilterHref(query:Pick<MentorCalendarFilters,"status"|"search"|"period"> &
  {type?:MentorCalendarFilters["type"];projectState?:MentorCalendarFilters["projectState"];
   attention?:MentorCalendarFilters["attention"];projectId?:MentorCalendarFilters["projectId"];join?:MentorCalendarFilters["join"];sprint?:MentorCalendarFilters["sprint"]}){
  const params=new URLSearchParams();
  if(query.projectId)params.set("projectId",query.projectId);
  if(query.join&&query.join!=="ALL")params.set("join",query.join);
  if(query.sprint&&query.sprint!=="ALL")params.set("sprint",query.sprint);
  if(query.status!=="ALL")params.set("status",query.status);
  if(query.attention&&query.attention!=="ALL")params.set("attention",query.attention);
  if(query.type&&query.type!=="ALL")params.set("type",query.type);
  if(query.projectState&&query.projectState!=="ALL")params.set("projectState",query.projectState);
  if(query.search)params.set("search",query.search);
  if(query.period!=="ALL")params.set("period",query.period);
  return "/mentor/calendar"+(params.size?"?"+params.toString():"");
}
