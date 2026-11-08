import {redirect,notFound} from "next/navigation";
import {hasMembershipRole} from "@/modules/identity/context";
import {ProjectsServiceError} from "@/modules/projects/errors";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {StatusBadge} from "@/components/ui/status-badge";
import {MentorMeetingNotesEditor} from "@/components/projects/mentor-meeting-notes-editor";
import {getMentorMeetingNotes} from "@/modules/projects/mentor-meeting-notes-service";
import {meetingNotesEditable} from "@/modules/projects/mentor-meeting-notes-model";
import { Heading } from "@/components/ui/heading";
import { TextLink } from "@/components/ui/text-link";
import { istDateTimeFormatter } from "@/lib/format-date";
export default async function MentorMeetingNotesPage({params}:{
  params:Promise<{projectId:string;meetingId:string}>;
}){
  const path=await params;
  const context=await getCurrentRequestContext();
  if(!hasMembershipRole(context,"MENTOR"))redirect("/dashboard");
  let data:Awaited<ReturnType<typeof getMentorMeetingNotes>>;
  try{
    data=await getMentorMeetingNotes(context,path);
  }catch(error){
    if(error instanceof ProjectsServiceError &&
      (error.code==="PROJECT_MEETING_NOT_FOUND"||error.code==="PROJECT_ACCESS_DENIED"||
       error.code==="PROJECT_NOT_FOUND"))notFound();
    throw error;
  }
  const m=data.meeting;
  const editable=meetingNotesEditable(data.projectStatus,m.status);
  return <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
    <PageHeader eyebrow="Mentor · Project meeting" title={m.title}
      description={data.projectTitle+" · "+m.status}
      actions={<TextLink data-unskin="" href={"/mentor/projects/"+encodeURIComponent(path.projectId)+"/team-meetings"}
        className="inline-flex min-h-11 items-center text-sm md:min-h-9">
        Meeting history</TextLink>}/>
    <section className="min-w-0 border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)]">
      <Heading level={2} size="base" className="m-0 leading-6">Persisted meeting outcome</Heading>
      <p className="mt-2 text-sm text-body">
        {istDateTimeFormatter.format(m.startsAt)} IST · <StatusBadge tone={m.status==="COMPLETED"?"success":m.status==="CANCELLED"?"error":"neutral"}>{m.status}</StatusBadge>
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
