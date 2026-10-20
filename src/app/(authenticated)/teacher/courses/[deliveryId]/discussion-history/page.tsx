import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  parseFacultyDiscussionHistoryLocation,facultyDiscussionHistoryHref,
} from "@/modules/courses/faculty-discussion-history-model";
import { getFacultyDiscussionHistory } from "@/modules/courses/faculty-discussion-history-service";

type Params={action?:string|string[];page?:string|string[]};
export default async function FacultyDiscussionHistoryPage({
  params,searchParams,
}:{params:Promise<{deliveryId:string}>;searchParams:Promise<Params>}) {
  const [{deliveryId},raw]=await Promise.all([params,searchParams]);
  const parsed=parseFacultyDiscussionHistoryLocation(deliveryId,raw);
  if(!parsed.success) return <section role="alert" className="space-y-3">
    <PageHeader title={"Invalid discussion history filters"} />
    <Link href="/teacher/courses" className="text-primary-text underline inline-flex min-h-11 items-center focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] hover:text-[var(--lms-primary-text)]">Back to Courses</Link>
  </section>;
  const context=await getCurrentRequestContext();
  const data=await getFacultyDiscussionHistory(context,parsed.data);
  return <div className="min-w-0 max-w-full space-y-6">
    <PageHeader eyebrow="Faculty · Discussion audit" title="Discussion moderation history"
      description={[data.delivery.courseName,data.delivery.sectionName].join(" · ")}
      actions={<Link href={"/teacher/courses/"+encodeURIComponent(deliveryId)+"/discussions"}
        className="rounded-[var(--lms-control-radius)] border border-border px-4 py-2 text-sm font-semibold text-primary-text inline-flex min-h-11 items-center md:min-h-[var(--lms-control-height)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] hover:text-[var(--lms-primary-text)] hover:bg-[rgba(38,186,199,0.07)]">
        Discussions
      </Link>} />
    <form role="search" aria-label="discussion history filters" method="get" className="flex flex-wrap items-end gap-3">
      <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Recorded action
        <Select name="action" defaultValue={data.query.action}
          className="min-h-11 rounded-[var(--lms-control-radius)] md:min-h-[var(--lms-control-height)] border border-border bg-surface px-3 text-foreground text-sm focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
          <option value="ALL">All moderation and reply actions</option>
          <option value="PIN">Pin/unpin</option>
          <option value="DELETE">Deletions</option>
          <option value="REPLY">Faculty replies</option>
        </Select>
      </label>
      <Button type="submit" variant="primary">Filter</Button>
      <Link href={facultyDiscussionHistoryHref({...data.query,action:"ALL",page:1})}
        className="inline-flex min-h-11 items-center px-3 text-sm font-semibold text-primary-text underline hover:text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Clear</Link>
    </form>
    <p className="text-sm text-body" role="status" aria-live="polite">{data.total} recorded event{data.total===1?"":"s"}</p>
    {data.items.length===0?<EmptyState title="No registered moderation history"
      description="No persisted moderation or Faculty reply events match this Section and filter. Records before event tracking are unavailable, not reconstructed."/>:
      <ol aria-label="discussion history entries" className="divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)]">{data.items.map(item=>
        <li key={item.id} className="min-w-0 bg-transparent py-4">
          <p className="font-semibold text-foreground">{item.action}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(item.occurredAt)} IST
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {item.actorMembershipId?"Recorded member action":"System/unknown actor"}
          </p>
        </li>)}</ol>}
    <Pagination label="Discussion history pages" page={data.page} pageCount={data.totalPages} hrefForPage={page=>facultyDiscussionHistoryHref({...data.query,page})} />
    <p className="text-xs text-muted-foreground">
      This is an audit of registered pin changes, deletions and Faculty replies, not a full message history.
      A learner may delete their own message; deletion events cannot prove that Faculty
      performed the action. Removed message text and personal details are not exposed.
    </p>
  </div>;
}
