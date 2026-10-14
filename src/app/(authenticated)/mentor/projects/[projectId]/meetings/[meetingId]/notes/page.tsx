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
  return <div className="space-y-5">
    <PageHeader eyebrow="Mentor · Project meeting" title={m.title}
      description={data.projectTitle+" · "+m.status}
      actions={<Link href={"/mentor/projects/"+encodeURIComponent(path.projectId)+"/team-meetings"}
        className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
        Meeting history</Link>}/>
    <section className="rounded-xl border border-border bg-surface p-4 sm:p-6">
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
        Only completed, non-archived project meetings allow outcome-note edits.
      </p>}
    </section>
    <p className="text-xs text-muted-foreground">
      Outcome is the sole registered post-meeting text field. This does not
      reconstruct minutes history, recording, attendance or participant consent.
    </p>
  </div>;
}
