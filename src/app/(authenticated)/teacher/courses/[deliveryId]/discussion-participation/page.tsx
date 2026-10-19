import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {EmptyState} from "@/components/ui/empty-state";
import {PageHeader} from "@/components/ui/page-header";
import {getFacultyDiscussionParticipation}
  from "@/modules/courses/faculty-discussion-participation-service";
export default async function FacultyDiscussionParticipationPage({
  params,
}:{params:Promise<{deliveryId:string}>}){
  const {deliveryId}=await params;
  const context=await getCurrentRequestContext();
  const data=await getFacultyDiscussionParticipation(context,{deliveryId});
  const base="/teacher/courses/"+encodeURIComponent(deliveryId);
  return <div className="min-w-0 max-w-full space-y-5">
    <Link href={base+"/discussions"} className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--lms-teal-deep)] underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">
      ← Discussions
    </Link>
    <PageHeader eyebrow="Faculty · Section" title="Discussion participation"
      description={data.delivery.courseName+" · "+data.delivery.sectionName}/>
    <section aria-label="Recorded participation" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {([["Messages",data.counts.total],["Faculty messages",data.counts.faculty],
        ["Learner messages",data.counts.learner],["Pinned messages",data.counts.pinned]] as const)
        .map(([title,count])=><div key={title}
          className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="mt-2 text-xl font-semibold tabular-nums">{count}</p>
        </div>)}
    </section>
    <section aria-label="Recent discussion activity" aria-live="polite" className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">12 most recent recorded messages</h2>
      {data.recent.length===0?<EmptyState title="No recorded discussions"
        description="This Section has no stored messages. Replies and deleted text cannot be reconstructed."/>:
        <ol className="grid gap-2">{data.recent.map(row=><li key={row.id}
          className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-3">
          <p className="text-sm font-semibold">{row.senderRole}
            {row.pinned?" · Pinned":""}</p>
          <time dateTime={row.createdAt} className="text-xs text-muted-foreground">
            {new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",
              timeZone:"Asia/Kolkata"}).format(new Date(row.createdAt))} IST
          </time>
        </li>)}</ol>}
    </section>
    <p className="text-xs text-muted-foreground">Only persisted messages in this currently
      assigned Section are counted. The existing reply text does not establish an
      authoritative reply relationship, and removed messages are not reconstructed.
      This is not a count of unanswered questions.</p>
  </div>;
}
