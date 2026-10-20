import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {StatusBadge} from "@/components/ui/status-badge";
import {EmptyState} from "@/components/ui/empty-state";
import {getMentorTaskFeedback} from "@/modules/projects/mentor-task-feedback-service";
import {mentorTaskFeedbackParamsSchema,taskFeedbackStatusLabel} from "@/modules/projects/mentor-task-feedback-model";
export default async function Page({params}:{
 params:Promise<{projectId:string;taskId:string}>;
}){
 const ids=mentorTaskFeedbackParamsSchema.parse(await params);
 const data=await getMentorTaskFeedback(await getCurrentRequestContext(),ids);
 return <div className="min-w-0 max-w-full space-y-6">
  <PageHeader eyebrow="Mentor · Task Board" title="Recorded task review feedback"
   description={data.task.title}/>
  <section role="status" className="border-b border-border pb-4">
   <h2 className="font-semibold">Conversation thread unavailable</h2>
   <p className="mt-2 text-sm text-body">
    The promoted Project schema stores one reviewer-feedback value per submission version.
    It has no task-comments or reply table. Do not enter new comments here; threaded
    conversations are blocked pending migration and product approval.
   </p>
  </section>
  {data.feedback.length===0?<EmptyState title="No recorded reviewer feedback"
   description="No persisted submission-version feedback exists for this authorized task. Missing messages are not reconstructed."/>
   :<ol className="min-w-0 divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)]">{data.feedback.map(entry=><li key={entry.id}
    className="py-[var(--lms-space-4)]">
    <div className="flex flex-wrap items-center justify-between gap-2">
     <h2 className="text-sm font-semibold">Version {entry.version} · <StatusBadge tone={entry.status==="APPROVED"?"success":"neutral"}>{taskFeedbackStatusLabel(entry.status)}</StatusBadge></h2>
     <span className="text-xs text-muted-foreground">
      {entry.reviewedAt?new Intl.DateTimeFormat("en-IN",{
       dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
      }).format(entry.reviewedAt)+" IST":"Review date unavailable"}
     </span>
    </div>
    <p className="mt-3 whitespace-pre-wrap break-words text-sm text-body">{entry.feedback}</p>
   </li>)}</ol>}
  <Link href={"/mentor/projects/"+encodeURIComponent(data.projectId)+"?tab=board"}
   className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline hover:underline md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
   Back to authorized task Board
  </Link>
  <p className="text-xs text-muted-foreground">
   Reviewer feedback is not a chat message. Learner identities, private notes and submission URLs are excluded from this read.
  </p>
 </div>;
}
