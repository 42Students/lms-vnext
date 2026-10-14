import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { getOwnLearnerSupportRequests } from "@/modules/placements/learner-support-request-service";
import { placementRequestTypeLabel } from "@/modules/placements/learner-support-request-model";
export default async function LearnerSupportHistory({searchParams}:{
  searchParams:Promise<{status?:string|string[]}>;
}) {
  const query=await searchParams;
  const data=await getOwnLearnerSupportRequests(await getCurrentRequestContext(),query);
  const choices=["ALL","PENDING","APPROVED","REJECTED","CANCELLED"] as const;
  return <div className="space-y-6">
    <Link href="/learn/my-placements/placement" className="inline-flex min-h-10 items-center text-sm font-semibold text-primary-text">← Placement Cell</Link>
    <PageHeader eyebrow="My Placements" title="My support requests"
      description="Your application withdrawal, round rescheduling and offer-extension requests from your college placement team." />
    <section className="rounded-xl border border-border bg-surface p-4 sm:p-5">
      <h2 className="text-sm font-semibold text-foreground">What is covered?</h2>
      <p className="mt-2 text-sm leading-6 text-body">
        Only persisted placement requests are shown. General helpdesk tickets and free-form feedback are not yet available because their data source is not registered.
      </p>
    </section>
    <nav aria-label="Request status" className="flex flex-wrap gap-2">
      {choices.map(status=><Link key={status}
        aria-current={data.status===status?"page":undefined}
        href={"/learn/my-placements/support?status="+status}
        className={"inline-flex min-h-10 items-center rounded-lg border px-3 text-xs font-semibold "+
          (data.status===status?"border-primary bg-primary-subtle text-primary-text":"border-border bg-surface text-foreground")}>
        {status==="ALL"?"All requests":status.charAt(0)+status.slice(1).toLowerCase()}
      </Link>)}
    </nav>
    {data.items.length===0?<section role="status" className="rounded-xl border border-border bg-surface p-6">
      <h2 className="text-base font-semibold text-foreground">No requests in this view</h2>
      <p className="mt-2 text-sm text-body">
        {data.status==="ALL"?"You have not submitted a placement request yet.":"No requests match this status filter."}
      </p>
    </section>:<ol className="grid gap-3 sm:grid-cols-2">
      {data.items.map(row=><li key={row.request.id} className="min-w-0 rounded-xl border border-border bg-surface p-4">
        <div className="flex flex-wrap justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">{placementRequestTypeLabel(row.request.requestType)}</h2>
          <span className="text-xs font-semibold text-muted-foreground">{row.request.status}</span>
        </div>
        <p className="mt-2 text-sm text-body">{row.company.name} · {row.roleOption.title}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(row.request.requestedAt)}
        </p>
        <p className="mt-3 whitespace-pre-wrap break-words text-sm text-body">{row.request.reason}</p>
        {row.request.decisionNote?<p className="mt-3 whitespace-pre-wrap break-words rounded-md bg-surface-subtle p-3 text-sm text-body">
          Placement-team note: {row.request.decisionNote}
        </p>:null}
      </li>)}
    </ol>}
    {data.hasMore?<p className="text-sm text-muted-foreground">Showing the most recent 30 requests for this status. See Placement Cell for the full history.</p>:null}
  </div>;
}