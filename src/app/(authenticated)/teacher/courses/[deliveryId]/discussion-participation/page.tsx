import Link from "next/link";
import { Disclosure } from "@/components/ui/disclosure";
import { Badge } from "@/components/ui/badge";
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
  return <div className="min-w-0 max-w-full space-y-4">
    <PageHeader eyebrow="Faculty · Section" title="Discussion participation"
      description={data.delivery.courseName+" · "+data.delivery.sectionName}
      actions={<Link href={base+"/discussions"} className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:w-auto md:min-h-9">← Discussions</Link>} />
    <section aria-label="Recorded participation" className="grid min-w-0 grid-cols-2 gap-x-4 gap-y-2 border-b border-border pb-4 lg:grid-cols-4">
      {([["Messages",data.counts.total],["Faculty messages",data.counts.faculty],
        ["Learner messages",data.counts.learner],["Pinned messages",data.counts.pinned]] as const)
        .map(([title,count])=><div key={title}
          className="min-w-0 py-2">
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-[var(--lms-heading)]">{count}</p>
        </div>)}
    </section>
    <section aria-label="Recent discussion activity" aria-live="polite" className="space-y-3">
      <h2 className="font-semibold text-[18px] leading-[1.4] text-[var(--lms-heading)]">12 most recent recorded messages</h2>
      {data.recent.length===0?<EmptyState title="No recorded discussions"
        description="This Section has no stored messages. Replies and deleted text cannot be reconstructed."/>:
        <ol className="divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)]">{data.recent.map(row=><li key={row.id}
          className="min-w-0 bg-transparent py-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-[var(--lms-heading)]">{row.senderRole}</p>
            {row.pinned?<Badge tone="neutral">Pinned</Badge>:null}
          </div>
          <time dateTime={row.createdAt} className="text-xs text-muted-foreground">
            {new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",
              timeZone:"Asia/Kolkata"}).format(new Date(row.createdAt))} IST
          </time>
        </li>)}</ol>}
    </section>
    <Disclosure title="How participation is counted" className="border-t border-border">
      <p className="max-w-3xl px-2 pb-2 text-xs leading-5 text-muted-foreground">Only persisted messages in this currently
        assigned Section are counted. The existing reply text does not establish an
        authoritative reply relationship, and removed messages are not reconstructed.
        This is not a count of unanswered questions.</p>
    </Disclosure>
  </div>;
}
