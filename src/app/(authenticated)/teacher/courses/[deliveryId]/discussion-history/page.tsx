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
    <h1 className="font-semibold text-[30px] text-[var(--lms-heading)]">Invalid discussion history filters</h1>
    <Link href="/teacher/courses" className="text-primary-text underline inline-flex min-h-11 items-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Back to Courses</Link>
  </section>;
  const context=await getCurrentRequestContext();
  const data=await getFacultyDiscussionHistory(context,parsed.data);
  return <div className="min-w-0 max-w-full space-y-6">
    <PageHeader eyebrow="Faculty · Discussion audit" title="Discussion moderation history"
      description={[data.delivery.courseName,data.delivery.sectionName].join(" · ")}
      actions={<Link href={"/teacher/courses/"+encodeURIComponent(deliveryId)+"/discussions"}
        className="rounded-[var(--lms-control-radius)] border border-border px-4 py-2 text-sm font-semibold text-primary-text inline-flex min-h-9 items-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        Discussions
      </Link>} />
    <form method="get" className="flex flex-wrap items-end gap-3">
      <label className="grid gap-1 text-sm font-semibold text-body">Recorded action
        <Select name="action" defaultValue={data.query.action}
          className="min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          <option value="ALL">All moderation and reply actions</option>
          <option value="PIN">Pin/unpin</option>
          <option value="DELETE">Deletions</option>
          <option value="REPLY">Faculty replies</option>
        </Select>
      </label>
      <Button type="submit" variant="primary">Filter</Button>
      <Link href={facultyDiscussionHistoryHref({...data.query,action:"ALL",page:1})}
        className="inline-flex min-h-11 items-center px-3 text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Clear</Link>
    </form>
    <p className="text-sm text-body" role="status" aria-live="polite">{data.total} recorded event{data.total===1?"":"s"}</p>
    {data.items.length===0?<EmptyState title="No registered moderation history"
      description="No persisted moderation or Faculty reply events match this Section and filter. Records before event tracking are unavailable, not reconstructed."/>:
      <ol className="grid gap-3">{data.items.map(item=>
        <li key={item.id} className="rounded-xl border border-border bg-surface p-4">
          <p className="font-semibold text-foreground">{item.action}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(item.occurredAt)} IST
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {item.actorMembershipId?"Recorded member action":"System/unknown actor"}
          </p>
        </li>)}</ol>}
    <nav aria-label="Discussion history pages" className="flex items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">Page {data.page} of {data.totalPages}</p>
      <div className="flex gap-3">
        {data.page>1&&<Link href={facultyDiscussionHistoryHref({...data.query,page:data.page-1})}
          className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Previous</Link>}
        {data.page<data.totalPages&&<Link href={facultyDiscussionHistoryHref({...data.query,page:data.page+1})}
          className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Next</Link>}
      </div>
    </nav>
    <p className="text-xs text-muted-foreground">
      This is an audit of registered pin changes, deletions and Faculty replies, not a full message history.
      A learner may delete their own message; deletion events cannot prove that Faculty
      performed the action. Removed message text and personal details are not exposed.
    </p>
  </div>;
}
