import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {StatusBadge} from "@/components/ui/status-badge";
import {MentorMeetingNotesEditor} from "@/components/projects/mentor-meeting-notes-editor";
import {getMentorMeetingNotes} from "@/modules/projects/mentor-meeting-notes-service";
import {meetingNotesEditable} from "@/modules/projects/mentor-meeting-notes-model";
export default async function MentorMeetingNotesPage({params}:{
  params:Promise<{projectId:string;meetingId:string}>;
}){
  const path=await params;
  const data=await getMentorMeetingNotes(await getCurrentRequestContext(),path);
  const m=data.meeting;
  const editable=meetingNotesEditable(data.projectStatus,m.status);
  return <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
    <PageHeader eyebrow="Mentor · Project meeting" title={m.title}
      description={data.projectTitle+" · "+m.status}
      actions={<Link data-unskin="" href={"/mentor/projects/"+encodeURIComponent(path.projectId)+"/team-meetings"}
        className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline underline-offset-4 md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-teal-deep)]">
        Meeting history</Link>}/>
    <section className="min-w-0 border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)]">
      <h2 className="m-0 text-base font-semibold leading-6">Persisted meeting outcome</h2>
      <p className="mt-2 text-sm text-body">
        {new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",
          timeZone:"Asia/Kolkata"}).format(m.startsAt)} IST · <StatusBadge tone={m.status==="COMPLETED"?"success":m.status==="CANCELLED"?"error":"neutral"}>{m.status}</StatusBadge>
      </p>
      {m.outcome?.trim()?
        <p className="mt-3 whitespace-pre-wrap break-words text-sm text-body">{m.outcome}</p>:
        <p className="mt-3 text-sm text-muted-foreground">No written outcome is recorded.</p>}
      {editable?<div className="mt-4">
        <MentorMeetingNotesEditor projectId={path.projectId} meetingId={m.id}
          initialNotes={m.outcome} updatedAt={m.updatedAt.toISOString()}/>
      </div>:<p className="mt-4 text-xs text-muted-foreground">
        Only completed meetings in active projects allow outcome-note edits.
      </p>}
    </section>
    <p className="text-xs text-muted-foreground">
      Outcome is the sole registered post-meeting text field. This does not
      reconstruct minutes history, recording, attendance or participant consent.
    </p>
  </div>;
}
