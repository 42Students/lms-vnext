import {z} from "zod";

export const mentorTeamMeetingsQuerySchema=z.object({
  projectId:z.string().uuid(),
  status:z.enum(["ALL","REQUESTED","SCHEDULED","COMPLETED","CANCELLED"]).default("ALL"),
  type:z.enum(["ALL","GENERAL","PLANNING","STANDUP","REVIEW","RETRO"]).default("ALL"),
  outcome:z.enum(["ALL","RECORDED","NOT_RECORDED"]).default("ALL"),
  order:z.enum(["NEWEST","OLDEST"]).default("NEWEST"),
  search:z.string().trim().max(100).default(""),
  page:z.coerce.number().int().min(1).max(10000).default(1),
}).strict();
export type MentorTeamMeetingsQuery=z.infer<typeof mentorTeamMeetingsQuerySchema>;
export function escapeMentorMeetingSearch(raw:string){
  return raw.replaceAll("\\","\\\\").replaceAll("%","\\%").replaceAll("_","\\_");
}
export function mentorTeamMeetingsPage(total:number,requested:number){
  const pageSize=20,totalPages=Math.max(1,Math.ceil(total/pageSize));
  return {total,pageSize,totalPages,page:Math.min(requested,totalPages)};
}
export function mentorTeamMeetingsHref(query:
  Pick<MentorTeamMeetingsQuery,"projectId"|"status"|"page"> &
  {search?:MentorTeamMeetingsQuery["search"];type?:MentorTeamMeetingsQuery["type"];
   outcome?:MentorTeamMeetingsQuery["outcome"];
   order?:MentorTeamMeetingsQuery["order"]}){

  const params=new URLSearchParams();
  if(query.status!=="ALL")params.set("status",query.status);
  if(query.type&&query.type!=="ALL")params.set("type",query.type);
  if(query.outcome&&query.outcome!=="ALL")params.set("outcome",query.outcome);
  if(query.order&&query.order!=="NEWEST")params.set("order",query.order);
  if(query.search)params.set("search",query.search);
  if(query.page>1)params.set("page",String(query.page));
  const suffix=params.toString();
  return "/mentor/projects/"+encodeURIComponent(query.projectId)+"/team-meetings"+
    (suffix?"?"+suffix:"");
}
