import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { getOwnUnifiedLearnerRequests } from "@/modules/placements/learner-support-request-service";
import { placementRequestTypeLabel,learnerSupportHistoryHref } from "@/modules/placements/learner-support-request-model";
import {LearnerSupportCancel} from "@/components/placements/learner-support-cancel";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { Heading } from "@/components/ui/heading";
import { TextLink } from "@/components/ui/text-link";
import { ButtonLink } from "@/components/ui/button-link";
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
    "inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-[var(--lms-control-radius)] border border-[var(--lms-neutral-200)] bg-transparent px-4 py-2 text-[13px] font-medium leading-[1.3] text-[var(--lms-neutral-500)] transition-[color,background,border-color] duration-[var(--lms-motion-fast)] hover:border-[var(--lms-primary)] hover:bg-[color-mix(in_srgb,var(--lms-primary)_7%,transparent)] hover:text-[var(--lms-primary)] focus-ring aria-[current=page]:border-[var(--lms-primary)] aria-[current=page]:bg-[var(--lms-primary-subtle)] aria-[current=page]:text-[var(--lms-primary-text)] aria-[current=page]:hover:bg-[var(--lms-primary-subtle)] aria-[current=page]:hover:text-[var(--lms-primary-text)]";
  const supportFilterNavClass =
    "min-w-0 max-w-[calc(100vw_-_var(--lms-space-7))] flex flex-nowrap items-center gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:max-w-full md:flex-wrap md:overflow-visible md:pb-0";
  return <div className="min-w-0 space-y-6">
    <TextLink href="/learn/my-placements/placement" className="inline-flex min-h-11 items-center text-sm md:min-h-9">← Placement Cell</TextLink>
    <PageHeader title="My support requests"
      description="Your placement and general college-team requests with decisions and follow-up in one history." />
    <section className="border-b border-border pb-6">
      <Heading level={2} size="base" className="leading-6 text-[var(--lms-heading)]">What is covered?</Heading>
      <p className="mt-2 text-sm leading-[1.6] text-body">
        {data.generalAvailable?"Placement and general college requests from your current learner membership are combined.":"General request history is unavailable on this deployment. Your placement requests are shown."}
      </p>
    </section>
    <nav aria-label="Request status" className={supportFilterNavClass}>
      {choices.map(status=><TextLink variant="bare" key={status}
        aria-current={selectedStatus===status?"page":undefined}
        href={learnerSupportHistoryHref({status,type:selectedType})}
        className={supportFilterPillClass}>
        {status==="ALL"?"All requests":status.charAt(0)+status.slice(1).toLowerCase()}
      </TextLink>)}
    </nav>
    <nav aria-label="Request category" className={supportFilterNavClass}>
      {requestTypes.map(type=><TextLink variant="bare" key={type}
        aria-current={selectedType===type?"page":undefined}
        href={learnerSupportHistoryHref({status:selectedStatus,type})}
        className={supportFilterPillClass}>
        {type==="ALL"?"All types":placementRequestTypeLabel(type)}
      </TextLink>)}
    </nav>
    <p role="status" className="text-xs text-muted-foreground leading-5">
      {data.total.toLocaleString("en-IN")} matching requests · Page {data.page} of {data.totalPages}
    </p>
    {data.items.length===0?<EmptyState title="No requests in this view"
      description={selectedStatus==="ALL"?"You have not submitted a placement request yet.":"No requests match this status filter."}/>:<ol className="divide-y divide-border border-y border-border">
      {data.items.map(row=><li key={row.source+":"+row.id} className="min-w-0 bg-transparent px-1 py-4">
        <div className="flex flex-wrap justify-between gap-2">
          <Heading level={2} size="base" className="leading-6 text-[var(--lms-heading)]">{placementRequestTypeLabel(row.type)}</Heading>
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
      {data.hasPrevious?<ButtonLink variant="secondary" href={learnerSupportHistoryHref({status:selectedStatus,type:selectedType,page:data.page-1})}>
        ← Newer requests
      </ButtonLink>:null}
      {data.olderPage!==null?<ButtonLink variant="secondary" href={learnerSupportHistoryHref({status:selectedStatus,type:selectedType,page:data.page+1})}>
        Older requests →
      </ButtonLink>:null}
    </nav>
  </div>;
}