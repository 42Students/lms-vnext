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
  submission: {id: string;status: string;submittedAt: Date | null} | null;
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
    if (project.submission?.status==="SUBMITTED" && project.submission.submittedAt) {
      alerts.push({
        projectId:project.projectId,
        key:"review:"+project.submission.id,kind:"REVIEW",
        title:project.projectTitle+" — submission waiting for your review",
        description:"A team member submitted work for this project.",
        href:href+"?tab=overview",
        occurredAt:project.submission.submittedAt.toISOString(),
      });
    }
    // Avoid a stale alarm for records without any trustworthy activity signal.
    const last=project.lastActivityAt ?? project.projectUpdatedAt;
    const lastMillis=last.getTime();
    const stalled=["PLANNED","ACTIVE"].includes(project.projectStatus) && Number.isFinite(lastMillis) &&
      timestamp-lastMillis >= 7*24*60*60*1000;
    if (stalled) alerts.push({
      projectId:project.projectId,
        key:"stalled:"+project.projectId,kind:"STALLED",
      title:project.projectTitle+" — no activity in 7+ days",
      description:"This project hasn't had any recorded activity recently.",
      href:href+"?tab=audit",occurredAt:last.toISOString(),
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
      } else if (meeting.status==="SCHEDULED") {
        const delta=meeting.startsAt.getTime()-timestamp;
        if (delta>=0 && delta<=48*60*60*1000) alerts.push({
          projectId:project.projectId,
        key:"soon:"+meeting.id,kind:"MEETING_SOON",
          title:"Upcoming project meeting",
          description:project.projectTitle+": "+meeting.title,
          href:href+"?tab=team",occurredAt:meeting.startsAt.toISOString(),
        });
      }
    }
  }
  return alerts.sort((a,b)=>b.occurredAt.localeCompare(a.occurredAt)||a.key.localeCompare(b.key));
}
