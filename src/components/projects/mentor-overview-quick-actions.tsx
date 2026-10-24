import Link from "next/link";
import {MentorTaskCreate} from "./mentor-task-create";
import {MentorSprintCreate} from "./mentor-sprint-write";
import {MentorReleaseEditor} from "./mentor-release-editor";

/** Dashboard shortcuts use the same validated project mutation dialogs as
 * the Task Board and Sprint timeline. Never send mentors into learner-only
 * routes or bypass the server's version and membership checks.
 */
export function MentorOverviewQuickActions({projectId,projectUpdatedAt,estimationUnit,
 releases,sprints,learners,backlogTasks=[]}:{
 projectId:string;projectUpdatedAt:string;estimationUnit:string|null;
 releases:readonly {id:string;title:string;status:string}[];
 sprints:readonly {id:string;title:string;status:string;updatedAt:string;releaseId:string;
   sequence:number;startDate?:string|null;endDate?:string|null}[];
 learners:readonly {membershipId:string;displayName:string|null}[];
 backlogTasks?:readonly {id:string;title:string;status:string;updatedAt:string;estimatePoints:number|null}[];
}){
 const active=sprints.find(item=>item.status==="ACTIVE");
 const allowed=sprints.filter(item=>item.status!=="COMPLETED"&&
   releases.some(release=>release.id===item.releaseId&&release.status!=="SHIPPED"));
 const firstRelease=releases.find(item=>item.status!=="SHIPPED");
 return <section aria-label="Add project work"
  className="flex flex-wrap items-center gap-3 border-b border-border pb-4">
  <strong className="mr-2">+ Add to this project</strong>
  <MentorTaskCreate projectId={projectId}
    sprintId={active?.id??""}
    updatedAt={active?.updatedAt??projectUpdatedAt}
    estimationUnit={estimationUnit}
    sprints={allowed} learners={learners}/>
  {firstRelease?<MentorSprintCreate
    projectId={projectId} releaseId={firstRelease.id}
    releases={releases}
    sprintPlan={sprints.map(row=>({releaseId:row.releaseId,sequence:row.sequence,
      startDate:row.startDate,endDate:row.endDate}))}
    backlogTasks={backlogTasks} canPullBacklog/>:null}
  <MentorReleaseEditor projectId={projectId}
    existingReleaseCount={releases.length}/>
  <Link href={"/mentor/projects/"+encodeURIComponent(projectId)+
    "/learner-preview"} className="inline-flex min-h-9 items-center text-sm font-semibold text-link underline">
    Preview student-visible project →
  </Link>
  <Link href={"/mentor/projects/"+encodeURIComponent(projectId)+
    "?tab=resources"} className="inline-flex min-h-9 items-center text-sm font-semibold text-link underline">
    Add resource →
  </Link>
  <p className="w-full text-xs text-muted-foreground">
    Tasks and sprints save through the same permission- and version-checked
    project APIs as the Board and Sprint timeline. Resource authoring opens
    the project library.
  </p>
 </section>;
}
