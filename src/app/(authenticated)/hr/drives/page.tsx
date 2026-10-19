import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { RecruiterPlacementPortfolio } from "@/components/placements/recruiter-placement-portfolio";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { hasActiveRecruiter } from "@/modules/identity/context";
import {recruiterDriveListQuerySchema,recruiterDrivesHref} from "@/modules/placements/recruiter-drive-list-model";
import {searchOwnRecruiterDrives} from "@/modules/placements/recruiter-drive-search-service";
import { recruiterVisiblePortfolioCounts } from "@/modules/placements/recruiter-portfolio-counts-service";
import {countRecruiterAnswerableDriveRequests} from "@/modules/placements/hr-recruiter-open-change-counts-service";
import { recruiterDriveDraftHref } from "@/modules/placements/hr-drive-draft-links";
import {hrSentProposalsHref} from "@/modules/placements/hr-drive-proposal-links-model";
import {listOwnRecruiterDriveRequests} from "@/modules/placements/recruiter-drive-request-service";
import {filterOwnRecruiterRequests,requestStageLabel} from "@/modules/placements/recruiter-request-list-model";
import {HrUnsentDriveAlert} from "@/components/hr/hr-unsent-drive-alert";
import {RecruiterRequestCancelButton} from "@/components/hr/recruiter-request-cancel-button";
import {RecruiterRequestFeedback} from "@/components/hr/recruiter-request-feedback";
import {hrDriveSessionStorageKey} from "@/modules/placements/hr-unsent-draft-storage-model";

type Params = { collegeId?: string | string[]; view?: string | string[]; tab?:string|string[]; q?: string | string[];
 employment?:string|string[]; mode?:string|string[]; deadline?:string|string[]; page?:string|string[];sort?:string|string[] };
function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
function legacyDriveTab(value:string|undefined){
 switch(value?.toLowerCase()){
  case "all":return "ALL";
  case "live":return "LIVE";
  case "waiting":return "WAITING";
  case "closed":return "CLOSED";
  default:return undefined;
 }
}

export default async function HrDrivesPage({ searchParams }: { searchParams: Promise<Params> }) {
  const context = await getCurrentRequestContext();
  if (!hasActiveRecruiter(context) || !context.recruiter || context.recruiter.userId !== context.user.id) redirect("/dashboard");
  const raw = await searchParams;
  const query = Object.values(raw).some(Array.isArray)
    ? recruiterDriveListQuerySchema.safeParse(null)
    : recruiterDriveListQuerySchema.safeParse({
    collegeId: first(raw.collegeId) || undefined,
    view: first(raw.view) || legacyDriveTab(first(raw.tab)), q: first(raw.q) || undefined,
    employment:first(raw.employment)||undefined,mode:first(raw.mode)||undefined,
    deadline:first(raw.deadline)||undefined,page:first(raw.page)||undefined,
    sort:first(raw.sort)||undefined,
  });
  if (!query.success) return <div className="min-w-0 max-w-full space-y-5"><PageHeader eyebrow="Recruiter" title="Drives" />
    <ErrorState title="Invalid drive filters" description="Review the college, lifecycle and search text."
      action={<Link href="/hr/drives" className="text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Clear filters</Link>} /></div>;
  const grants = context.recruiter.grants;
  if (query.data.collegeId && !grants.some(grant => grant.collegeId === query.data.collegeId)) notFound();
  const selectedCollege = query.data.collegeId ?? (grants.length === 1 ? grants[0]!.collegeId : null);
  if (!selectedCollege) return <div className="min-w-0 max-w-full space-y-5"><PageHeader eyebrow="Recruiter" title="Drives" description="Choose an authorized college to open its hiring drives." />
    {grants.length === 0 ? <EmptyState title="No active college access" description="Your placement-cell relationship must be active before any drives are visible." /> :
    <section className="grid gap-3 sm:grid-cols-2">{grants.map(grant => <Link key={grant.id} href={recruiterDrivesHref({...query.data, collegeId: grant.collegeId})}
      className="rounded-[var(--lms-radius-card)] border border-border bg-surface p-5 hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">{grant.collegeName}</Link>)}</section>}</div>;
  const returnTo=recruiterDrivesHref({...query.data,collegeId:selectedCollege});
  const requests=await listOwnRecruiterDriveRequests(context,selectedCollege);
  const requestView=filterOwnRecruiterRequests(requests,query.data.view,query.data.q);
  // eslint-disable-next-line react-hooks/purity -- the request clock drives IST deadline filters.
  const now = new Date();
  const pageResult=await searchOwnRecruiterDrives(context,selectedCollege,{
    ...query.data,collegeId:selectedCollege,
  },now);
  const totals = {...pageResult.totals,
    all:pageResult.totals.all+requests.length,
    waiting:requests.filter(req=>["REQUEST","SENT_BACK","DRAFT"].includes(req.status)).length,
    closed:pageResult.totals.closed+
      requests.filter(req=>["REJECTED","CANCELLED"].includes(req.status)).length,
  };
  const viewOptions = [
    {view: "ALL", label: "All", count: totals.all},
    {view: "LIVE", label: "Live", count: totals.live},
    {view: "WAITING", label: "Sent for review", count: totals.waiting},
    {view: "CLOSED", label: "Completed and cancelled", count: totals.closed},
  ] as const;
  const deadlineBase={...query.data,collegeId:selectedCollege,view:"LIVE" as const,
    q:"",employment:"ALL" as const,mode:"ALL" as const,page:1,sort:"DEADLINE" as const};
  const [soon,past]=await Promise.all([
    searchOwnRecruiterDrives(context,selectedCollege,{...deadlineBase,deadline:"SOON"},now,{pageSize:5,previewOnly:true}),
    searchOwnRecruiterDrives(context,selectedCollege,{...deadlineBase,deadline:"PAST"},now,{
      pageSize:5,descendingDeadline:true,previewOnly:true,
    }),
  ]);
  const attention={soon:soon.rows,past:past.rows};
  const [visibleCounts,unansweredRequests]=await Promise.all([
    recruiterVisiblePortfolioCounts(context,selectedCollege,pageResult.rows.map(row=>row.job.id)),
    countRecruiterAnswerableDriveRequests(selectedCollege,pageResult.rows.map(row=>row.job.id)),
  ]);
  return <div className="min-w-0 max-w-full space-y-6">
    <PageHeader eyebrow="Recruiter" title="Drives"
      description="Hiring drives for the selected college and your exact employer relationship. Includes submitted requests, drafts and published drives for this employer."
      actions={<Link href={recruiterDriveDraftHref({collegeId:selectedCollege})}
        className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-[650] text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
        Request a drive
      </Link>} />
    <nav aria-label="Recruiter proposal history">
      <Link href={hrSentProposalsHref(selectedCollege)}
       className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
       Sent discussion proposals
      </Link>
      <span className="self-center text-xs text-muted-foreground">
       Proposals are private messages, not approved or published drives.
      </span>
    </nav>
    <RecruiterRequestFeedback storageKey={hrDriveSessionStorageKey(context.user.id,selectedCollege,null)+":feedback"}/>
    <HrUnsentDriveAlert collegeId={selectedCollege}
      storageKey={hrDriveSessionStorageKey(context.user.id,selectedCollege,null)}/>
    {grants.length > 1 ? <nav aria-label="College" className="flex flex-wrap gap-2">{grants.map(grant =>
      <Link key={grant.id} href={recruiterDrivesHref({...query.data, collegeId: grant.collegeId})}
        aria-current={selectedCollege === grant.collegeId ? "page" : undefined}
        className={selectedCollege === grant.collegeId ? "inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] bg-primary px-3 py-2 text-sm font-semibold text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]" : "inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 py-2 text-sm text-body hover:border-primary hover:text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"}>{grant.collegeName}</Link>)}</nav> : null}
    {(attention.soon.length>0||attention.past.length>0)?<section aria-label="Recruiter deadline attention"
      className="border-b border-border pb-4 sm:pb-5">
      <h2 className="font-semibold text-foreground">Deadline attention</h2>
      <p className="mt-1 text-xs text-muted-foreground">Recorded application deadlines only; past dates do not prove a drive is closed.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {attention.soon.map(item=><Link key={"soon:"+item.job.id} href={"/recruiter/drives/"+encodeURIComponent(item.job.id)+"?tab=overview&returnTo="+encodeURIComponent(returnTo)}
          className="rounded-[var(--lms-control-radius)] border border-border p-3 text-sm text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
          <span className="block font-semibold">{item.job.title}</span>
          <span className="mt-1 block text-xs text-body">Due within 7 days · {item.job.applicationDeadline!.toLocaleDateString("en-IN",{timeZone:"Asia/Kolkata"})}</span>
        </Link>)}
        {attention.past.map(item=><Link key={"past:"+item.job.id} href={"/recruiter/drives/"+encodeURIComponent(item.job.id)+"?tab=overview&returnTo="+encodeURIComponent(returnTo)}
          className="rounded-[var(--lms-control-radius)] border border-border p-3 text-sm text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
          <span className="block font-semibold">{item.job.title}</span>
          <span className="mt-1 block text-xs text-body">Recorded deadline passed · {item.job.applicationDeadline!.toLocaleDateString("en-IN",{timeZone:"Asia/Kolkata"})}</span>
        </Link>)}
      </div>
    </section>:null}
    <nav aria-label="Drive lifecycle" className="flex flex-wrap gap-3 border-b border-border">{viewOptions.map(option =>
      <Link key={option.view} href={recruiterDrivesHref({...query.data, collegeId: selectedCollege, view: option.view, page: 1})}
        aria-current={query.data.view === option.view ? "page" : undefined}
        className={query.data.view === option.view ? "inline-flex min-h-9 items-center border-b-[3px] border-primary px-3 py-2 text-[13px] font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]" : "inline-flex min-h-9 items-center border-b-[3px] border-transparent px-3 py-2 text-[13px] text-body hover:text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"}>
        {option.label} ({option.count})</Link>)}</nav>
    {query.data.view!=="WAITING"?<div className="flex justify-end">
      <Link href={recruiterDrivesHref({...query.data,collegeId:selectedCollege,page:1})
        .replace("/recruiter/drives","/api/placements/recruiter/drives/export")}
        className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
        Export matching drives CSV
      </Link>
    </div>:null}
    <form method="get" action="/recruiter/drives" className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="collegeId" value={selectedCollege} />
      <input type="hidden" name="view" value={query.data.view} />
      <input type="hidden" name="page" value="1" />
      <label className="grid min-w-52 flex-1 gap-1 text-sm text-body">Search role
        <Input name="q" defaultValue={query.data.q} maxLength={100} placeholder="Job title" className="w-full" /></label>
      <label className="grid min-w-36 gap-1 text-sm text-body">Employment
        <Select name="employment" defaultValue={query.data.employment} className="w-full">
          <option value="ALL">All</option><option value="FULL_TIME">Full-time</option><option value="INTERNSHIP">Internship</option><option value="CONTRACT">Contract</option>
        </Select></label>
      <label className="grid min-w-36 gap-1 text-sm text-body">Work mode
        <Select name="mode" defaultValue={query.data.mode} className="w-full">
          <option value="ALL">All</option><option value="ONSITE">On-site</option><option value="HYBRID">Hybrid</option><option value="REMOTE">Remote</option>
        </Select></label>
      <label className="grid min-w-36 gap-1 text-sm text-body">Deadline
        <Select name="deadline" defaultValue={query.data.deadline} className="w-full">
          <option value="ALL">Any</option><option value="TODAY">Today (IST)</option><option value="SOON">Within 7 days</option><option value="PAST">Recorded deadline passed</option><option value="UNKNOWN">Not recorded</option>
        </Select></label>
      <label className="grid min-w-36 gap-1 text-sm text-body">Sort
        <Select name="sort" defaultValue={query.data.sort} className="w-full">
          <option value="RECENT">Newest first</option>
          <option value="DEADLINE">Deadline first</option>
          <option value="TITLE">Title A–Z</option>
        </Select>
      </label>
      <Button type="submit">Search</Button>
      <Link href={recruiterDrivesHref({view: "ALL", collegeId: selectedCollege, q: "",employment:"ALL",mode:"ALL",deadline:"ALL",page:1,sort:"RECENT"})} className="py-3 text-sm text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Reset</Link>
    </form>
    {requestView.length>0?<section aria-label="Your drive requests" className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">Your drive requests</h2>
      <ul className="grid gap-3 sm:grid-cols-2">{requestView.map(req=>{
        const draft=req.draft&&typeof req.draft==="object"?req.draft:{};
        const title=typeof draft.title==="string"?draft.title:"Drive request";
        const editable=req.status==="REQUEST"||req.status==="SENT_BACK";
        return <li key={req.id} className="rounded-[var(--lms-control-radius)] border border-border bg-surface p-4">
          <p className="font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-sm text-body">{requestStageLabel(req.status)}</p>
          {req.status==="SENT_BACK"?<p className="mt-2 rounded-[var(--lms-control-radius)] border border-warning p-3 text-sm text-body">
            Placement-cell feedback: {req.decisionNote??"Please contact the placement cell for the requested changes."}
          </p>:null}
          <p className="mt-2 text-xs text-muted-foreground">Requested {req.createdAt.toLocaleDateString("en-IN",{timeZone:"Asia/Kolkata"})}</p>
          {editable?<Link href={"/hr/drives/new?collegeId="+encodeURIComponent(selectedCollege)+"&"+(req.status==="SENT_BACK"?"fix":"edit")+"="+encodeURIComponent(req.id)}
            className="mt-3 inline-flex min-h-9 items-center text-sm font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
            {req.status==="SENT_BACK"?"Fix and Resend":"Edit your request"}
          </Link>:null}
          {editable?<RecruiterRequestCancelButton requestId={req.id} collegeId={selectedCollege} updatedAt={req.updatedAt.toISOString()}/>:null}
          {["REJECTED","CANCELLED"].includes(req.status)?<Link
            href={"/hr/drives/new?collegeId="+encodeURIComponent(selectedCollege)+"&copy="+encodeURIComponent(req.id)}
            className="mt-3 inline-flex min-h-9 items-center text-sm font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
            Hire again with changes
          </Link>:null}
          {req.status==="REJECTED"&&req.decisionNote?<p className="mt-2 text-sm text-body">Declined: “{req.decisionNote}”</p>:null}
          {req.approvedJobId && req.status==="DRAFT"?
            <p role="status" className="mt-2 text-sm text-body">Approved · draft. The placement cell will publish this drive before students can apply.</p>:null}
          {req.approvedJobId && req.status!=="DRAFT"?<Link href={"/recruiter/drives/"+encodeURIComponent(req.approvedJobId)+"?tab=overview&returnTo="+encodeURIComponent(returnTo)}
            className="mt-2 block text-sm text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] min-h-9">Open published drive</Link>:null}
        </li>;
      })}</ul>
    </section>:null}
    {query.data.view==="WAITING" && requestView.length===0
      ? <div className="space-y-2">
          <EmptyState title="No Sent for review drives" description="Choose another drive stage to see more."/>
          <Link href={recruiterDrivesHref({...query.data,view:"ALL",page:1})} className="mt-2 inline-flex min-h-9 items-center font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">View all drives</Link>
        </div>
      : query.data.view!=="WAITING" && pageResult.rows.length===0 && requestView.length===0
        ? <div className="space-y-2">
          {totals.all===0
           ? <EmptyState title="You have no drives yet" description="Request a drive and the placement cell will review it."/>
           : query.data.q
            ? <EmptyState title="No drives match this search" description="Try another role name or clear the current search."/>
            : <EmptyState title={"No "+(query.data.view==="LIVE"?"Live":"Completed and cancelled")+" drives"}
              description="Choose another drive stage to see more."/>}
          <Link href={totals.all===0?recruiterDriveDraftHref({collegeId:selectedCollege}):recruiterDrivesHref({...query.data,view:"ALL",q:"",page:1})}
            className="mt-2 inline-flex min-h-9 items-center font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
            {totals.all===0?"Request a drive":query.data.q?"Clear search":"View all drives"}
          </Link>
        </div>
        : null}
    {query.data.view!=="WAITING" && pageResult.rows.length>0?<RecruiterPlacementPortfolio now={now} jobs={pageResult.rows} counts={visibleCounts} unansweredRequests={unansweredRequests} returnTo={recruiterDrivesHref({...query.data,collegeId:selectedCollege})} />:null}
    {query.data.view !== "WAITING" ? <nav aria-label="Drive pages" className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-body">{pageResult.total===0?"No matching drives":
        "Showing "+(Math.min(pageResult.total,(pageResult.page-1)*pageResult.pageSize+1))+"–"+
        Math.min(pageResult.total,pageResult.page*pageResult.pageSize)+" of "+pageResult.total}</p>
      <div className="flex gap-2">
        {pageResult.page>1?<Link href={recruiterDrivesHref({...query.data,collegeId:selectedCollege,page:pageResult.page-1})}
          className="rounded-[var(--lms-control-radius)] border border-border px-3 py-2 text-sm text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Previous</Link>:null}
        {pageResult.page<pageResult.pages?<Link href={recruiterDrivesHref({...query.data,collegeId:selectedCollege,page:pageResult.page+1})}
          className="rounded-[var(--lms-control-radius)] border border-border px-3 py-2 text-sm text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Next</Link>:null}
      </div></nav>:null}
    <Link href="/hr/round-results" className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 py-2 text-sm font-semibold text-primary-text hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Review round results →</Link>
    <p className="text-xs text-muted-foreground">Request history is saved. Placement-cell approval and external sending remain unavailable until the registered employer-request workflow is ready.</p>
  </div>;
}
