/**
 * Mentor attention rules are pure, so stale/reopen/archival edge cases are
 * regression-tested without pretending browser or DB execution is complete.
 */
export type MentorProjectAttentionSource = {
  projectId: string;
  projectTitle: string;
  projectStatus: string;
  projectUpdatedAt: Date;
  lastActivityAt: Date | null;
  blocker?:string|null;
  submission:{
    id:string;status:string;submittedAt:Date|null;reviewedAt?:Date|null;
    version?:number;reopenedAt?:Date|null;submittedByName?:string|null;
  } | null;
  meetings: readonly {
    id: string; status: string;title: string; startsAt: Date;
  }[];
  sprints?:readonly {id:string;title:string;sequence:number;status:string;updatedAt:Date}[];
  tasks?:readonly {
    id:string;title:string;status:string;sprintId:string|null;
    assigneeMembershipId:string|null;updatedAt:Date;
  }[];
};
export type MentorProjectAttention = {
  projectId: string;
  key: string;
  kind: "REVIEW" | "STALLED" | "REQUESTED" | "MEETING_SOON" |
    "TASK_REVIEW" | "TASK_BLOCKED" | "SPRINT_SIGN_OFF" | "UNASSIGNED_NEXT";
  title: string;
  description: string;
  href: string;
  occurredAt: string;
  /** Stable version of the source task set for Later-until-changed. */
  revision?:string;
};

function mentorTaskSetRevision(tasks:readonly {id:string;status:string;updatedAt:Date}[]){
  const input=tasks.map(task=>task.id+":"+task.status+":"+
    task.updatedAt.toISOString()).sort().join("|");
  let hash=2166136261;
  for(let i=0;i<input.length;i++){
    hash=Math.imul(hash^input.charCodeAt(i),16777619)>>>0;
  }
  return tasks.length+":"+hash.toString(36);
}

export function deriveMentorProjectAttention(
  projects: readonly MentorProjectAttentionSource[],
  now: Date,
): MentorProjectAttention[] {
  const alerts: MentorProjectAttention[]=[];
  const timestamp=now.getTime();
  for (const project of projects) {
    if (project.projectStatus==="ARCHIVED") continue;
    const href="/mentor/projects/"+encodeURIComponent(project.projectId);
    const submission=project.submission;
    const freshReview=Boolean(submission?.submittedAt)&&
      (!submission?.reviewedAt||
        submission.submittedAt!.getTime()>submission.reviewedAt.getTime())&&
      (!submission?.reopenedAt||
        submission.submittedAt!.getTime()>submission.reopenedAt.getTime());
    if(submission && ["SUBMITTED","UNDER_REVIEW","IN_REVIEW"].includes(submission.status)&&
       freshReview&&submission.submittedAt){
      alerts.push({
        projectId:project.projectId,
        key:"review:"+submission.id,kind:"REVIEW",
        title:project.projectTitle+" — submission waiting for your review",
        description:submission.submittedByName?.trim()?
          "Submitted by "+submission.submittedByName.trim():
          "A team member submitted work for this project.",
        href:href+"?tab=delivery",
        occurredAt:submission.submittedAt.toISOString(),
      });
    }
    // MEN-projects-meetings-73: legacy includes idle PLANNED and ACTIVE
    // projects after seven days, but never BLOCKED, COMPLETED or ARCHIVED.
    // Prefer recorded events; use last project update when none exist.
    // Legacy projects without activity rows fall back to the workspace
    // updated-at timestamp. A missing event feed is not equivalent to zero age.
    const last=project.lastActivityAt??project.projectUpdatedAt;
    const lastMillis=last.getTime();
    const stalled=["PLANNED","ACTIVE","IN_PROGRESS"].includes(project.projectStatus) &&
      !project.blocker?.trim() &&
      Number.isFinite(lastMillis) && timestamp-lastMillis>=7*24*60*60*1000;
    if (stalled) alerts.push({
      projectId:project.projectId,
        key:"stalled:"+project.projectId,kind:"STALLED",
      title:project.projectTitle+" — no activity in 7+ days",
      description:"This project hasn't had any recorded activity recently.",
      href:href+"?tab=activity",occurredAt:last.toISOString(),
    });
    const tasks=project.tasks??[];
    const sprints=project.sprints??[];
    const active=sprints.find(sprint=>sprint.status==="ACTIVE");
    for(const task of tasks) {
      if(task.status==="IN_REVIEW"){
        alerts.push({
          projectId:project.projectId,
          key:"task-review:"+task.id,kind:"TASK_REVIEW",
          title:task.title+" — waiting for approval",
          description:project.projectTitle+" · Review submitted task evidence.",
          href:href+"?tab=board&task="+encodeURIComponent(task.id)+
            "&lane=IN_REVIEW&scope=all",
          occurredAt:task.updatedAt.toISOString(),
        });
      }else if(task.status==="BLOCKED"){
        alerts.push({
          projectId:project.projectId,
          key:"blocked:"+task.id,kind:"TASK_BLOCKED",
          title:task.title+" — blocked",
          description:project.projectTitle+" · Help the assigned team remove the blocker.",
          href:href+"?tab=board&task="+encodeURIComponent(task.id)+
            "&lane=BLOCKED&scope=all",
          occurredAt:task.updatedAt.toISOString(),
        });
      }
    }
    if(active){
      const assigned=tasks.filter(task=>task.sprintId===active.id);
      if(assigned.length>0&&assigned.every(task=>task.status==="DONE")){
        alerts.push({
          projectId:project.projectId,
          key:"sprint-signoff:"+active.id,kind:"SPRINT_SIGN_OFF",
          title:project.projectTitle+" — sprint "+active.sequence+" ready for sign-off",
          description:assigned.length+" recorded sprint tasks done; check delivery evidence.",
          href:href+"?tab=sprints",occurredAt:active.updatedAt.toISOString(),
          revision:mentorTaskSetRevision(assigned),
        });
      }
      const next=sprints.filter(row=>row.status==="PLANNED"&&
        row.sequence>active.sequence).sort((a,b)=>a.sequence-b.sequence)[0];
      if(next){
        const unassigned=tasks.filter(task=>task.sprintId===next.id&&
          task.assigneeMembershipId===null&&task.status!=="DONE");
        if(unassigned.length>0){
          alerts.push({
            projectId:project.projectId,
            key:"next-unassigned:"+next.id,kind:"UNASSIGNED_NEXT",
            title:project.projectTitle+" — "+unassigned.length+" unassigned next-sprint tasks",
            description:"Allocate upcoming sprint "+next.sequence+" work.",
            href:href+"?tab=performance",
            occurredAt:unassigned.reduce((old,task)=>
              task.updatedAt.getTime()<old.getTime()?task.updatedAt:old,
              unassigned[0]!.updatedAt).toISOString(),
            revision:mentorTaskSetRevision(unassigned),
          });
        }
      }
    }
    for (const meeting of project.meetings) {
      if (meeting.status==="REQUESTED") {
        alerts.push({
          projectId:project.projectId,
        key:"request:"+meeting.id,kind:"REQUESTED",
          title:meeting.title+" — "+project.projectTitle,
          description:"A team member requested this meeting — review and confirm the time.",
          href:href+"?tab=team",occurredAt:meeting.startsAt.toISOString(),
        });
      } else if ((meeting.status==="SCHEDULED"||meeting.status==="RESCHEDULED")) {
        const delta=meeting.startsAt.getTime()-timestamp;
        if (delta>0 && delta<=48*60*60*1000) alerts.push({
          projectId:project.projectId,
        key:"soon:"+meeting.id,kind:"MEETING_SOON",
          title:meeting.title+" — "+project.projectTitle,
          description:"Scheduled "+new Intl.DateTimeFormat("en-US",{
            timeZone:"Asia/Kolkata",weekday:"short",month:"short",day:"numeric",
            hour:"numeric",minute:"2-digit",hour12:true,
          }).format(meeting.startsAt)+" IST",
          href:href+"?tab=team",occurredAt:meeting.startsAt.toISOString(),
        });
      }
    }
  }
  // Announcements are a separate inbox source; project attention keeps the
  // legacy review / request / stalled / upcoming precedence within each feed.
  const priority:{[kind in MentorProjectAttention["kind"]]:number}={
    REVIEW:0,TASK_REVIEW:1,SPRINT_SIGN_OFF:2,TASK_BLOCKED:3,
    UNASSIGNED_NEXT:4,REQUESTED:5,STALLED:6,MEETING_SOON:7,
  };
  return alerts.sort((a,b)=>priority[a.kind]-priority[b.kind]||
    a.occurredAt.localeCompare(b.occurredAt)||a.key.localeCompare(b.key));
}
