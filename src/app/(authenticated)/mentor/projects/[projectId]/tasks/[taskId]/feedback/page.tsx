import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {StatusBadge} from "@/components/ui/status-badge";
import {EmptyState} from "@/components/ui/empty-state";
import {getMentorTaskFeedback} from "@/modules/projects/mentor-task-feedback-service";
import {mentorTaskFeedbackParamsSchema,taskFeedbackStatusLabel} from "@/modules/projects/mentor-task-feedback-model";
import { Heading } from "@/components/ui/heading";
import { TextLink } from "@/components/ui/text-link";
export default async function Page({params}:{
 params:Promise<{projectId:string;taskId:string}>;
}){
 const ids=mentorTaskFeedbackParamsSchema.parse(await params);
 const data=await getMentorTaskFeedback(await getCurrentRequestContext(),ids);
 return <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
  <PageHeader eyebrow="Mentor · Task Board" title="Recorded task review feedback"
   description={data.task.title}/>
  {data.feedback.length===0?<EmptyState title="No recorded reviewer feedback"
   description="No persisted submission-version feedback exists for this authorized task. Missing messages are not reconstructed." action={<TextLink href={"/mentor/projects/"+encodeURIComponent(data.projectId)+"?tab=board"} className="inline-flex min-h-11 items-center md:min-h-9">Back to authorized task Board</TextLink>}/>
   :<ol className="min-w-0 divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)]">{data.feedback.map(entry=><li key={entry.id}
    className="min-w-0 py-[var(--lms-space-4)]">
    <div className="flex flex-wrap items-center justify-between gap-2">
     <Heading level={2} size="base" className="m-0 leading-6 text-[var(--lms-heading)]">Version {entry.version} · <StatusBadge tone={entry.status==="APPROVED"?"success":entry.status==="REJECTED"?"error":"neutral"}>{taskFeedbackStatusLabel(entry.status)}</StatusBadge></Heading>
     <span className="text-xs text-muted-foreground">
      {entry.reviewedAt?new Intl.DateTimeFormat("en-IN",{
       dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
      }).format(entry.reviewedAt)+" IST":"Review date unavailable"}
     </span>
    </div>
    <p className="mt-3 whitespace-pre-wrap break-words text-sm text-body leading-[22px]">{entry.feedback}</p>
   </li>)}</ol>}
  <section role="status" className="border-b border-border pb-4">
   <Heading level={2} size="base" className="m-0 leading-6 text-[var(--lms-heading)]">Conversation thread unavailable</Heading>
   <p className="mt-2 text-sm text-body leading-[22px]">
    The promoted Project schema stores one reviewer-feedback value per submission version.
    It has no task-comments or reply table. Do not enter new comments here; threaded
    conversations are blocked pending migration and product approval.
   </p>
  </section>
  {data.feedback.length>0?<TextLink href={"/mentor/projects/"+encodeURIComponent(data.projectId)+"?tab=board"}
   className="inline-flex min-h-11 items-center text-sm md:min-h-9">
   Back to authorized task Board
  </TextLink>:null}
  <p className="text-xs text-muted-foreground leading-5">
   Reviewer feedback is not a chat message. Learner identities, private notes and submission URLs are excluded from this read.
  </p>
 </div>;
}
