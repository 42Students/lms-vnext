import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { getOwnUnifiedLearnerRequests } from "@/modules/placements/learner-support-request-service";
import { placementRequestTypeLabel,learnerSupportHistoryHref } from "@/modules/placements/learner-support-request-model";
import {LearnerSupportCancel} from "@/components/placements/learner-support-cancel";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
export default async function LearnerSupportHistory({searchParams}:{
  searchParams:Promise<{status?:string|string[];type?:string|string[];page?:string|string[]}>;
}) {
  const query=await searchParams;
  const chosen=(v:string|string[]|undefined)=>Array.isArray(v)?v[0]:v;
  const selectedStatus=chosen(query.status)??"ALL",selectedType=chosen(query.type)??"ALL";
  const data=await getOwnUnifiedLearnerRequests(await getCurrentRequestContext(),{
    status:selectedStatus,type:selectedType,page:chosen(query.page)??1,
  });
  const choices=["ALL","PENDING","APPROVED","REJECTED","CANCELLED"] as const;
  const requestTypes=["ALL","APPLICATION_WITHDRAWAL","ROUND_RESCHEDULE","OFFER_EXTENSION",
    "ABSENCE_DISPUTE","CORRECTION_WITH_PROOF","OFF_CAMPUS_OFFER",
    "OFFER_ACCEPTANCE_DISPUTE","REGISTRATION_CHANGE","PLACEMENT_AFTER_PLACEMENT"] as const;
  const supportFilterPillClass =
    "inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-[var(--lms-control-radius)] border border-[var(--lms-neutral-200)] bg-transparent px-4 py-2 text-[13px] font-medium leading-[1.3] text-[var(--lms-neutral-500)] transition-[color,background,border-color] duration-150 hover:border-[var(--lms-primary)] hover:bg-[rgba(38,186,199,0.07)] hover:text-[var(--lms-primary)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#1a95a1] aria-[current=page]:border-[var(--lms-primary)] aria-[current=page]:bg-[var(--lms-primary-subtle)] aria-[current=page]:text-[var(--lms-primary-text)] aria-[current=page]:hover:bg-[var(--lms-primary-subtle)] aria-[current=page]:hover:text-[var(--lms-primary-text)]";
  const supportFilterNavClass =
    "min-w-0 max-w-[calc(100vw_-_var(--lms-space-7))] flex flex-nowrap items-center gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:max-w-full md:flex-wrap md:overflow-visible md:pb-0";
  return <div className="min-w-0 space-y-6">
    <Link href="/learn/my-placements/placement" className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--lms-link-text)] underline md:min-h-9">← Placement Cell</Link>
    <PageHeader title="My support requests"
      description="Your placement and general college-team requests with decisions and follow-up in one history." />
    <section className="border-b border-border pb-6">
      <h2 className="font-semibold text-base leading-6 text-[var(--lms-heading)]">What is covered?</h2>
      <p className="mt-2 text-sm leading-[1.6] text-body">
        {data.generalAvailable?"Placement and general college requests from your current learner membership are combined.":"General request history is unavailable on this deployment. Your placement requests are shown."}
      </p>
    </section>
    <nav aria-label="Request status" className={supportFilterNavClass}>
      {choices.map(status=><Link key={status}
        aria-current={selectedStatus===status?"page":undefined}
        href={learnerSupportHistoryHref({status,type:selectedType})}
        className={supportFilterPillClass}>
        {status==="ALL"?"All requests":status.charAt(0)+status.slice(1).toLowerCase()}
      </Link>)}
    </nav>
    <nav aria-label="Request category" className={supportFilterNavClass}>
      {requestTypes.map(type=><Link key={type}
        aria-current={selectedType===type?"page":undefined}
        href={learnerSupportHistoryHref({status:selectedStatus,type})}
        className={supportFilterPillClass}>
        {type==="ALL"?"All types":placementRequestTypeLabel(type)}
      </Link>)}
    </nav>
    <p role="status" className="text-xs text-muted-foreground leading-5">
      {data.total.toLocaleString("en-IN")} matching requests · Page {data.page} of {data.totalPages}
    </p>
    {data.items.length===0?<EmptyState title="No requests in this view"
      description={selectedStatus==="ALL"?"You have not submitted a placement request yet.":"No requests match this status filter."}/>:<ol className="divide-y divide-border border-y border-border">
      {data.items.map(row=><li key={row.source+":"+row.id} className="min-w-0 bg-transparent px-1 py-4">
        <div className="flex flex-wrap justify-between gap-2">
          <h2 className="font-semibold text-base leading-6 text-[var(--lms-heading)]">{placementRequestTypeLabel(row.type)}</h2>
          <StatusBadge tone={row.status==="PENDING"?"warning":row.status==="APPROVED"?"success":"neutral"}>{row.status}</StatusBadge>
        </div>
        <p className="mt-2 text-sm text-body leading-[22px]">{row.source==="GENERAL"?"General placement request":row.jobTitle??"Placement request"}</p>
        <p className="mt-1 text-xs text-muted-foreground leading-5">
          {new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(row.requestedAt)}
        </p>
        <p className="mt-3 whitespace-pre-wrap break-words text-sm text-body leading-[22px]">{row.reason}</p>
        {row.source==="PLACEMENT"&&row.status==="PENDING"&&row.updatedAt ? (
          <div className="mt-3">
            <LearnerSupportCancel requestId={row.id}
              expectedUpdatedAt={row.updatedAt.toISOString()}/>
          </div>
        ) : null}
        {row.decisionNote?<p className="mt-3 whitespace-pre-wrap break-words border-t border-border pt-3 text-sm text-body leading-[22px]">
          Placement-team note: {row.decisionNote}
        </p>:null}
      </li>)}
    </ol>}
    <nav aria-label="Request history pages" className="flex flex-wrap gap-3">
      {data.hasPrevious?<Link href={learnerSupportHistoryHref({status:selectedStatus,type:selectedType,page:data.page-1})}
        className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] px-4 text-sm font-[650] text-[var(--lms-link-text)] hover:bg-[rgba(38,186,199,0.07)] hover:underline">
        ← Newer requests
      </Link>:null}
      {data.hasMore?<Link href={learnerSupportHistoryHref({status:selectedStatus,type:selectedType,page:data.page+1})}
        className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] px-4 text-sm font-[650] text-[var(--lms-link-text)] hover:bg-[rgba(38,186,199,0.07)] hover:underline">
        Older requests →
      </Link>:null}
    </nav>
  </div>;
}