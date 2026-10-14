import {z} from "zod";

export const mentorRiskReadinessQuerySchema=z.object({
  projectId:z.string().uuid(),
  focus:z.enum(["ALL","RISK","READINESS"]).default("ALL"),
  page:z.coerce.number().int().min(1).max(10000).default(1),
}).strict();
export type MentorRiskReadinessQuery=z.infer<typeof mentorRiskReadinessQuerySchema>;

type Fact={id:string;title:string;status:string};
type Task=Fact & {sprintId:string;priority:string};
type Meeting=Fact & {startsAt:Date};
export type MentorRiskReadinessFacts={
  projectId:string;projectStatus:string;
  releases:readonly Fact[];sprints:readonly Fact[];
  tasks:readonly Task[];meetings:readonly Meeting[];
  latestSubmissionStatus:string|null;
  finalApproved:boolean;evaluationRecorded:boolean;
};
export type MentorDrillItem={
  key:string;category:"RISK"|"READINESS";
  title:string;detail:string;href:string;
};

function istCalendarKey(date:Date){
  const parts=new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Kolkata",
    year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(date);
  const value=(name:string)=>parts.find(part=>part.type===name)?.value??"";
  return value("year")+value("month")+value("day");
}
export function mentorRiskReadiness(facts:MentorRiskReadinessFacts,
  query:MentorRiskReadinessQuery,asOf:Date=new Date()){
  const base="/mentor/projects/"+encodeURIComponent(facts.projectId);
  const items:MentorDrillItem[]=[];
  const add=(category:MentorDrillItem["category"],key:string,title:string,
    detail:string,href:string)=>{
    items.push({category,key,title,detail,href});
  };
  const active=facts.projectStatus!=="ARCHIVED"&&facts.projectStatus!=="COMPLETED";
  const incompleteTasks=facts.tasks.filter(task=>task.status!=="DONE");
  const blockedTasks=facts.tasks.filter(task=>task.status==="BLOCKED");
  const reviewTasks=facts.tasks.filter(task=>task.status==="IN_REVIEW");
  const pendingMeetings=facts.meetings.filter(row=>row.status==="REQUESTED");
  const istToday=istCalendarKey(asOf);
  const scheduledPastDay=facts.meetings.filter(row=>
    row.status==="SCHEDULED"&&Number.isFinite(row.startsAt.getTime())&&
    istCalendarKey(row.startsAt)<istToday);
  const sprintTitle=new Map(facts.sprints.map(sprint=>[sprint.id,sprint.title]));
  if(active){
    for(const task of blockedTasks)add("RISK","blocked:"+task.id,
      task.title,"Blocked task · "+task.priority+" priority · "+
      (sprintTitle.get(task.sprintId)??"Unknown Sprint"),
      base+"?tab=board#mentor-task-"+encodeURIComponent(task.id));
    for(const task of reviewTasks)add("RISK","review:"+task.id,
      task.title,"Task submission awaits recorded review",
      base+"?tab=board#mentor-task-"+encodeURIComponent(task.id));
    for(const meeting of scheduledPastDay)add("RISK","scheduled-past:"+meeting.id,
      meeting.title,"Scheduled start was on an earlier IST day, but completion is not recorded",
      base+"?tab=team");
    for(const meeting of pendingMeetings)add("RISK","meeting:"+meeting.id,
      meeting.title,"Meeting request awaits a recorded scheduling decision",
      base+"?tab=team");
    if(facts.latestSubmissionStatus==="SUBMITTED")
      add("RISK","final-review","Final delivery awaiting review",
        "Latest persisted delivery version is SUBMITTED",
        base+"?tab=delivery");
  }
  if(!facts.releases.length)add("READINESS","release-none","No registered Releases",
    "Release readiness is unknown until a Release exists",base+"?tab=sprints");
  for(const release of facts.releases.filter(row=>row.status!=="SHIPPED"))
    add("READINESS","release:"+release.id,release.title,
      "Release status: "+release.status+" (not shipped)",base+"?tab=sprints");
  if(!facts.sprints.length)add("READINESS","sprint-none","No registered Sprints",
    "Sprint completion is unknown until a Sprint exists",base+"?tab=sprints");
  for(const sprint of facts.sprints.filter(row=>row.status!=="COMPLETED"))
    add("READINESS","sprint:"+sprint.id,sprint.title,
      "Sprint status: "+sprint.status+" (not completed)",base+"?tab=sprints");
  if(!facts.tasks.length)add("READINESS","tasks-none","No registered tasks",
    "Task completion is unknown until tasks exist",base+"?tab=board");
  else for(const task of incompleteTasks)add("READINESS","task:"+task.id,task.title,
    "Task status: "+task.status+" · "+task.priority+" priority",
    base+"?tab=board#mentor-task-"+encodeURIComponent(task.id));
  if(!facts.finalApproved)add("READINESS","delivery","No approved final delivery",
    facts.latestSubmissionStatus===null?"No persisted final-delivery version":
    "Latest delivery status: "+facts.latestSubmissionStatus,base+"?tab=delivery");
  if(facts.finalApproved&&!facts.evaluationRecorded)
    add("READINESS","evaluation","No recorded final evaluation",
      "Approved delivery has no registered evaluation",base+"?tab=delivery");
  const selected=items.filter(row=>query.focus==="ALL"||row.category===query.focus);
  const pageSize=20,total=selected.length,totalPages=Math.max(1,Math.ceil(total/pageSize));
  const page=Math.min(query.page,totalPages);
  return {
    counts:{blockedTasks:blockedTasks.length,reviewTasks:reviewTasks.length,
      pendingMeetings:pendingMeetings.length,scheduledPastDay:scheduledPastDay.length,
      incompleteTasks:incompleteTasks.length,
      totalTasks:facts.tasks.length,unshippedReleases:facts.releases.filter(
        row=>row.status!=="SHIPPED").length,
      incompleteSprints:facts.sprints.filter(row=>row.status!=="COMPLETED").length},
    riskCount:items.filter(row=>row.category==="RISK").length,
    readinessGapCount:items.filter(row=>row.category==="READINESS").length,
    projectStatus:facts.projectStatus,latestSubmissionStatus:facts.latestSubmissionStatus,
    total,page,pageSize,totalPages,items:selected.slice((page-1)*pageSize,page*pageSize),
  };
}
export function mentorRiskReadinessHref(query:MentorRiskReadinessQuery){
  const p=new URLSearchParams();
  if(query.focus!=="ALL")p.set("focus",query.focus);
  if(query.page>1)p.set("page",String(query.page));
  const suffix=p.toString();
  return "/mentor/projects/"+encodeURIComponent(query.projectId)+
    "/risk-readiness"+(suffix?"?"+suffix:"");
}
