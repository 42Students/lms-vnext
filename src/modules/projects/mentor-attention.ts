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
};
export type MentorProjectAttention = {
  projectId: string;
  key: string;
  kind: "REVIEW" | "STALLED" | "REQUESTED" | "MEETING_SOON";
  title: string;
  description: string;
  href: string;
  occurredAt: string;
};

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
    REVIEW:0,REQUESTED:1,STALLED:2,MEETING_SOON:3,
  };
  return alerts.sort((a,b)=>priority[a.kind]-priority[b.kind]||
    b.occurredAt.localeCompare(a.occurredAt)||a.key.localeCompare(b.key));
}
