import {z} from "zod";
import {parseLearnerCareerDate} from "./learner-career-date-model";
import {careerCalendarEvents,careerCalendarPeriod,type CareerCalendarSourceRound} from "./learner-career-calendar-model";
const date=z.string().refine(value=>parseLearnerCareerDate(value)!==null,"Invalid IST calendar date");
export const learnerCalendarUrlStateSchema=z.object({
  date,view:z.enum(["agenda","month","week","day"]),kind:z.enum(["ALL","ASSESSMENT","INTERVIEW","OTHER"]),
}).strict();
export type LearnerCalendarUrlState=z.infer<typeof learnerCalendarUrlStateSchema>;
export function readLearnerCalendarUrl(query:string,fallbackDay:string):LearnerCalendarUrlState{
  const params=new URLSearchParams(query);
  const get=(key:string)=>params.getAll(key).length===1?params.get(key):undefined;
  const validDate=date.safeParse(get("date"));
  const validView=learnerCalendarUrlStateSchema.shape.view.safeParse(get("view"));
  const validKind=learnerCalendarUrlStateSchema.shape.kind.safeParse(get("kind"));
  return {date:validDate.success?validDate.data:date.parse(fallbackDay),view:validView.success?validView.data:"month",kind:validKind.success?validKind.data:"ALL"};
}
export function learnerCalendarHref(raw:unknown, surface: "calendar" | "schedule" = "calendar"){
  const state=learnerCalendarUrlStateSchema.parse(raw);
  return "/learn/my-placements/"+surface+"?"+new URLSearchParams({date:state.date,view:state.view,kind:state.kind}).toString();
}
export function learnerCalendarSelectedEvents(rounds:readonly CareerCalendarSourceRound[],raw:unknown){
  const state=learnerCalendarUrlStateSchema.parse(raw);
  const events=careerCalendarEvents(rounds).filter(x=>state.kind==="ALL"||x.kind===state.kind);
  return careerCalendarPeriod(events,state.date,state.view).events;
}

/** Old /learn/my-placements/calendar links were intentional email targets.
 * Always make the month view explicit when linking back from moved pages,
 * while preserving a validated calendar date/kind and any explicit view.
 */
export function legacyLearnerCalendarDestination(query:string,fallbackDay:string):string{
 const state=readLearnerCalendarUrl(query,fallbackDay);
 return learnerCalendarHref(state,"calendar");
}
