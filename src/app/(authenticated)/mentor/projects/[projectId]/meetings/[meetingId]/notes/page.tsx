import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
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
  return <div className="min-w-0 max-w-full space-y-5">
    <PageHeader eyebrow="Mentor · Project meeting" title={m.title}
      description={data.projectTitle+" · "+m.status}
      actions={<Link href={"/mentor/projects/"+encodeURIComponent(path.projectId)+"/team-meetings"}
        className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-4 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        Meeting history</Link>}/>
    <section className="border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-5)]">
      <h2 className="font-semibold">Persisted meeting outcome</h2>
      <p className="mt-2 text-sm text-body">
        {new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",
          timeZone:"Asia/Kolkata"}).format(m.startsAt)} IST · {m.status}
      </p>
      {m.outcome?.trim()?
        <p className="mt-4 whitespace-pre-wrap break-words text-sm text-body">{m.outcome}</p>:
        <p className="mt-4 text-sm text-muted-foreground">No written outcome is recorded.</p>}
      {editable?<div className="mt-5">
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
