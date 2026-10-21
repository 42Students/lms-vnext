import {StatusBadge} from "@/components/ui/status-badge";
import {NeedsDoingChips} from "@/components/ui/needs-doing-chips";
import { Pagination } from "@/components/ui/pagination";
import { Tabs } from "@/components/ui/tabs";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { RecruiterPlacementPortfolio } from "@/components/placements/recruiter-placement-portfolio";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert } from "@/components/ui/alert";
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
import {recruiterRequestLegacyLabel} from "@/modules/placements/recruiter-drive-request-model";
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
  if (!query.success) return <div className="min-w-0 max-w-full space-y-4 md:space-y-6"><PageHeader title="Drives" />
    <ErrorState title="Invalid drive filters" description="Review the college, lifecycle and search text."
      action={<Link href="/hr/drives" className="min-h-11 md:min-h-9 inline-flex items-center text-primary-text underline hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Clear filters</Link>} /></div>;
  const grants = context.recruiter.grants;
  if (query.data.collegeId && !grants.some(grant => grant.collegeId === query.data.collegeId)) notFound();
  const selectedCollege = query.data.collegeId ?? (grants.length === 1 ? grants[0]!.collegeId : null);
  if (!selectedCollege) return <div className="min-w-0 max-w-full space-y-4 md:space-y-6"><PageHeader title="Drives" description="Choose an authorized college to open its hiring drives." />
    {grants.length === 0 ? <EmptyState
      title={context.recruiter.companyId?"Drive access is not switched on":"Your account has no company yet"}
      description={context.recruiter.companyId
        ?"Your placement-cell relationship must be active and have Drives permission before any hiring drives are visible. Contact the placement cell to request access."
        :"Your account has no company yet. Please contact the placement cell"} /> :
    <NeedsDoingChips label="Authorized colleges:" items={grants.map(grant=>({
      key:grant.collegeId,label:grant.collegeName,
      href:recruiterDrivesHref({
          ...query.data,collegeId:grant.collegeId,view:"ALL",q:"",
          employment:"ALL",mode:"ALL",deadline:"ALL",page:1,sort:"RECENT",
        }),
    }))}/>}</div>;
  const returnTo=recruiterDrivesHref({...query.data,collegeId:selectedCollege});
  // A transient source failure is not an invalid filter or empty list.
  // eslint-disable-next-line react-hooks/purity -- deadline filters use the request clock.
  const now = new Date();
  let requests: Awaited<ReturnType<typeof listOwnRecruiterDriveRequests>>;
  let pageResult: Awaited<ReturnType<typeof searchOwnRecruiterDrives>>;
  try {
    [requests, pageResult] = await Promise.all([
      listOwnRecruiterDriveRequests(context, selectedCollege),
      searchOwnRecruiterDrives(context, selectedCollege,
        {...query.data, collegeId:selectedCollege}, now),
    ]);
  } catch {
    return <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
      <PageHeader title="Drives" description="Hiring drives for your selected college." />
      <ErrorState title="Could not load your drives"
        description="The drive list could not be refreshed. No drives were changed; try again."
        action={<Link href={returnTo} className="inline-flex min-h-11 items-center text-primary-text underline md:min-h-9">Retry</Link>} />
    </div>;
  }
  const requestView=filterOwnRecruiterRequests(requests,query.data.view,query.data.q);
  // A request linked to a created job is not a second independent drive.
  // Approved draft receipts remain visible below in their own request section.
  const standaloneRequests = requests.filter(req=>!req.approvedJobId);
  const totals = {...pageResult.totals,
    all:pageResult.totals.all+standaloneRequests.length,
    waiting:requests.filter(req=>["REQUEST","SENT_BACK","DRAFT"].includes(req.status)).length,
    closed:pageResult.totals.closed+
      standaloneRequests.filter(req=>["REJECTED","CANCELLED"].includes(req.status)).length,
  };
  const viewOptions = [
    {view: "ALL", label: "All", count: totals.all},
    {view: "LIVE", label: "Live", count: totals.live},
    {view: "WAITING", label: "Sent for review", count: totals.waiting},
    {view: "CLOSED", label: "Completed and cancelled", count: totals.closed},
  ] as const;
  const deadlineBase={...query.data,collegeId:selectedCollege,view:"LIVE" as const,
    q:"",employment:"ALL" as const,mode:"ALL" as const,page:1,sort:"DEADLINE" as const};
  // Auxiliary attention cards/counts are nonblocking. The authoritative
  // drive page remains visible if a secondary counter temporarily fails.
  const [soon,past]=await Promise.allSettled([
    searchOwnRecruiterDrives(context,selectedCollege,{...deadlineBase,deadline:"SOON"},now,{pageSize:5,previewOnly:true}),
    searchOwnRecruiterDrives(context,selectedCollege,{...deadlineBase,deadline:"PAST"},now,{
      pageSize:5,descendingDeadline:true,previewOnly:true,
    }),
  ]);
  const attention={
    soon:soon.status==="fulfilled"?soon.value.rows:[],
    past:past.status==="fulfilled"?past.value.rows:[],
  };
  const [countsResult,answerableResult]=await Promise.allSettled([
    recruiterVisiblePortfolioCounts(context,selectedCollege,pageResult.rows.map(row=>row.job.id)),
    countRecruiterAnswerableDriveRequests(selectedCollege,pageResult.rows.map(row=>row.job.id)),
  ]);
  const visibleCounts=countsResult.status==="fulfilled"?countsResult.value:{};
  const unansweredRequests=answerableResult.status==="fulfilled"?answerableResult.value:{};
  const partialLoadFailure=soon.status==="rejected"||past.status==="rejected"||
    countsResult.status==="rejected"||answerableResult.status==="rejected";
  return <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
    <PageHeader title="Drives"
      description="Hiring drives for the selected college and your exact employer relationship. Includes submitted requests, drafts and published drives for this employer."
      actions={<Link href={recruiterDriveDraftHref({collegeId:selectedCollege})}
        className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] bg-[var(--lms-button-primary)] px-4 text-sm font-[650] text-on-primary hover:border-[var(--lms-button-primary-hover)] hover:bg-[var(--lms-button-primary-hover)] active:border-[var(--lms-button-primary-hover)] active:bg-[var(--lms-button-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
        Request a drive
      </Link>} />
    {partialLoadFailure ? <Alert tone="warning">
      Some drive details could not be refreshed. Your current drive list is still available. <Link href={returnTo} className="font-semibold text-primary-text underline">Retry</Link>
    </Alert> : null}
    <details className="min-w-0 border-t border-border pt-2">
      <summary className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-sm text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Sent discussion proposals</summary>
      <nav aria-label="Recruiter proposal history" className="flex min-w-0 flex-col items-start gap-2 py-2 md:flex-row md:items-center md:gap-3">
      <Link href={hrSentProposalsHref(selectedCollege)}
       className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline underline-offset-4 md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
       Sent discussion proposals
      </Link>
      <span className="self-center text-xs text-muted-foreground">
       Proposals are private messages, not approved or published drives.
      </span>
      </nav>
    </details>
    <p className="text-xs font-semibold text-muted-foreground">Hiring with {grants.find(grant=>grant.collegeId===selectedCollege)?.collegeName??"your selected college"}</p>
    <RecruiterRequestFeedback storageKey={hrDriveSessionStorageKey(context.user.id,selectedCollege,null)+":feedback"}/>
    <HrUnsentDriveAlert collegeId={selectedCollege}
      storageKey={hrDriveSessionStorageKey(context.user.id,selectedCollege,null)}/>
    {grants.length > 1 ? <NeedsDoingChips label="College:" selectedKey={selectedCollege}
      items={grants.map(grant=>({
        key:grant.collegeId,label:grant.collegeName,
        href:recruiterDrivesHref({
          ...query.data,collegeId:grant.collegeId,view:"ALL",q:"",
          employment:"ALL",mode:"ALL",deadline:"ALL",page:1,sort:"RECENT",
        }),
      }))}/> : null}
    {(attention.soon.length>0||attention.past.length>0)?<section aria-label="Recruiter deadline attention"
      className="border-b border-border pb-4 md:pb-6">
      <details className="min-w-0">
       <summary className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-[var(--lms-heading)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Deadline attention</summary>
      <p className="mt-1 text-xs text-muted-foreground">Recorded application deadlines only; past dates do not prove a drive is closed.</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {attention.soon.map(item=><Link key={"soon:"+item.job.id} href={"/recruiter/drives/"+encodeURIComponent(item.job.id)+"?tab=overview&returnTo="+encodeURIComponent(returnTo)}
          className="min-h-11 md:min-h-9 inline-flex min-w-0 flex-col items-start justify-center rounded-[var(--lms-control-radius)] border border-border p-3 text-sm text-primary-text hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
          <span className="block max-w-full break-words font-semibold">{item.job.title}</span>
          <span className="mt-1 block text-xs text-body">Due within 7 days · {item.job.applicationDeadline!.toLocaleDateString("en-IN",{timeZone:"Asia/Kolkata"})}</span>
        </Link>)}
        {attention.past.map(item=><Link key={"past:"+item.job.id} href={"/recruiter/drives/"+encodeURIComponent(item.job.id)+"?tab=overview&returnTo="+encodeURIComponent(returnTo)}
          className="min-h-11 md:min-h-9 inline-flex min-w-0 flex-col items-start justify-center rounded-[var(--lms-control-radius)] border border-border p-3 text-sm text-primary-text hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
          <span className="block max-w-full break-words font-semibold">{item.job.title}</span>
          <span className="mt-1 block text-xs text-body">Recorded deadline passed · {item.job.applicationDeadline!.toLocaleDateString("en-IN",{timeZone:"Asia/Kolkata"})}</span>
        </Link>)}
      </div>
      </details>
    </section>:null}
    <Tabs ariaLabel="Drive lifecycle" renderPanel={false} value={query.data.view}
      items={viewOptions.map(option=>({
        value:option.view, label:option.label, count:option.count,
        href:recruiterDrivesHref({...query.data,collegeId:selectedCollege,view:option.view,page:1}),
      }))} />
    {query.data.view!=="WAITING"?<div className="flex min-w-0 flex-wrap justify-start md:justify-end">
      <Link href={recruiterDrivesHref({...query.data,collegeId:selectedCollege,page:1})
        .replace("/recruiter/drives","/api/placements/recruiter/drives/export")}
        className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline underline-offset-4 md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
        Export matching drives CSV
      </Link>
    </div>:null}
    <form method="get" action="/recruiter/drives" role="search" aria-label="Filter recruiter drives" className="flex min-w-0 flex-wrap items-end gap-[8px] border-b border-[var(--lms-canvas-border)] pb-4 max-[767px]:flex-col max-[767px]:items-stretch">
      <Input type="hidden" name="collegeId" value={selectedCollege} />
      <Input type="hidden" name="view" value={query.data.view} />
      <Input type="hidden" name="page" value="1" />
      <label className="grid min-w-0 w-full flex-1 md:w-auto md:min-w-[180px] gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Search by role
        <Input type="search" name="q" defaultValue={query.data.q} maxLength={100} placeholder="Search by role" className="min-h-11 w-full md:min-h-9" /></label>
      <details open={query.data.employment!=="ALL"||query.data.mode!=="ALL"||query.data.deadline!=="ALL"||query.data.sort!=="RECENT"} className="order-last min-w-0 w-full basis-full border-t border-border pt-2">
        <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">More filters</summary>
        <div className="mt-2 grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-4">
      <label className="grid min-w-0 w-full  gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Employment
        <Select name="employment" defaultValue={query.data.employment} className="min-h-11 w-full md:min-h-9">
          <option value="ALL">All</option><option value="FULL_TIME">Full-time</option><option value="INTERNSHIP">Internship</option><option value="CONTRACT">Contract</option>
        </Select></label>
      <label className="grid min-w-0 w-full  gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Work mode
        <Select name="mode" defaultValue={query.data.mode} className="min-h-11 w-full md:min-h-9">
          <option value="ALL">All</option><option value="ONSITE">On-site</option><option value="HYBRID">Hybrid</option><option value="REMOTE">Remote</option>
        </Select></label>
      <label className="grid min-w-0 w-full  gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Deadline
        <Select name="deadline" defaultValue={query.data.deadline} className="min-h-11 w-full md:min-h-9">
          <option value="ALL">Any</option><option value="TODAY">Today (IST)</option><option value="SOON">Within 7 days</option><option value="PAST">Recorded deadline passed</option><option value="UNKNOWN">Not recorded</option>
        </Select></label>
      <label className="grid min-w-0 w-full  gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Sort
        <Select name="sort" defaultValue={query.data.sort} className="min-h-11 w-full md:min-h-9">
          <option value="RECENT">Newest first</option>
          <option value="DEADLINE">Deadline first</option>
          <option value="TITLE">Title A–Z</option>
        </Select>
      </label>

        </div>
      </details>
      <Button type="submit" variant="secondary" className="min-h-11 w-full md:min-h-9 md:w-auto">Search</Button>
      <Link href={recruiterDrivesHref({view: "ALL", collegeId: selectedCollege, q: "",employment:"ALL",mode:"ALL",deadline:"ALL",page:1,sort:"RECENT"})} className="inline-flex min-h-11 items-center py-2 text-sm text-primary-text hover:text-[var(--lms-primary-text)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Reset</Link>
    </form>
    {requestView.length>0?<section aria-label="Your drive requests" className="space-y-3">
      <h2 className="text-[var(--lms-font-lg)] font-semibold leading-[26px] text-[var(--lms-heading)] min-[768px]:text-[var(--lms-font-xl)] min-[768px]:leading-7">Your drive requests</h2>
      <ul className="min-w-0 divide-y divide-border border-y border-border">{requestView.map(req=>{
        const draft=req.draft&&typeof req.draft==="object"?req.draft:{};
        const title=typeof draft.title==="string"?draft.title:"Drive request";
        const editable=req.status==="REQUEST"||req.status==="SENT_BACK";
        return <li key={req.id} className="min-w-0 py-4">
          <p className="min-w-0 break-words font-semibold text-foreground">{title}</p>
          <p className="mt-1"><StatusBadge tone={req.status==="REJECTED"||req.status==="CANCELLED"?"error":req.status==="SENT_BACK"?"warning":req.status==="DRAFT"?"info":"info"}>
            {recruiterRequestLegacyLabel(req.status)}
          </StatusBadge><span className="ml-2 text-xs text-muted-foreground" title="Saved request lifecycle">{requestStageLabel(req.status)}</span></p>
          {req.status==="SENT_BACK"?<Alert tone="warning" className="mt-2">
            Placement-cell feedback: {req.decisionNote??"Please contact the placement cell for the requested changes."}
          </Alert>:null}
          <p className="mt-2 text-xs text-muted-foreground">Requested {req.createdAt.toLocaleDateString("en-IN",{timeZone:"Asia/Kolkata"})}</p>
          <dl className="mt-2 grid gap-x-4 gap-y-1 text-xs text-body sm:grid-cols-2 lg:grid-cols-3">
            {([
              ["Location",draft.location],["Job type",draft.employmentType],["Drive mode",draft.driveMode],
              ["Minimum CGPA",draft.minimumCgpa],["Passing year",draft.passingYear],["CTC (LPA)",draft.ctcLpa],
              ["Fixed (LPA)",draft.fixedLpa],["Variable (LPA)",draft.variableLpa],
              ["Stipend / month (INR)",draft.stipendMonthlyInr],
            ] as const).filter((entry)=>typeof entry[1]==="string"&&entry[1].trim()).map(([label,value])=>
              <div key={label}><dt className="inline font-semibold">{label}: </dt><dd className="inline">{String(value)}</dd></div>)}
            {Array.isArray(draft.branches)&&draft.branches.length>0?<div>
              <dt className="inline font-semibold">Branches: </dt>
              <dd className="inline">{draft.branches.filter((item):item is string=>typeof item==="string").join(", ")}</dd>
            </div>:null}
          </dl>
          {editable?<Link href={"/hr/drives/new?collegeId="+encodeURIComponent(selectedCollege)+"&"+(req.status==="SENT_BACK"?"fix":"edit")+"="+encodeURIComponent(req.id)}
            className="mt-3 inline-flex min-h-11 md:min-h-9 items-center text-sm font-semibold text-primary-text underline hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
            {req.status==="SENT_BACK"?"Fix and Resend":"Edit your request"}
          </Link>:null}
          {editable?<RecruiterRequestCancelButton requestId={req.id} collegeId={selectedCollege} updatedAt={req.updatedAt.toISOString()}/>:null}
          {["REJECTED","CANCELLED"].includes(req.status)?<Link
            href={"/hr/drives/new?collegeId="+encodeURIComponent(selectedCollege)+"&copy="+encodeURIComponent(req.id)}
            className="mt-3 inline-flex min-h-11 md:min-h-9 items-center text-sm font-semibold text-primary-text underline hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
            Hire again with changes
          </Link>:null}
          {req.status==="REJECTED"&&req.decisionNote?<p className="mt-2 text-sm text-body">Declined: “{req.decisionNote}”</p>:null}
          {req.approvedJobId && req.status==="DRAFT"?
            <Alert tone="info" className="mt-2">Approved · draft. The placement cell will publish this drive before students can apply.</Alert>:null}
          {req.approvedJobId && req.status!=="DRAFT"?<Link href={"/recruiter/drives/"+encodeURIComponent(req.approvedJobId)+"?tab=overview&returnTo="+encodeURIComponent(returnTo)}
            className="mt-2 block text-sm text-primary-text underline min-h-11 md:min-h-9 hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Open published drive</Link>:null}
        </li>;
      })}</ul>
    </section>:null}
    {query.data.view==="WAITING" && requestView.length===0
      ? <div className="space-y-2">
          <EmptyState title="No drives sent for review" description="Choose another drive stage to see more."/>
          <Link href={recruiterDrivesHref({...query.data,view:"ALL",page:1})} className="mt-2 inline-flex min-h-11 md:min-h-9 items-center font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#1a95a1]">View all drives</Link>
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
            className="mt-2 inline-flex min-h-11 md:min-h-9 items-center font-semibold text-primary-text underline hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
            {totals.all===0?"Request a drive":query.data.q?"Clear search":"View all drives"}
          </Link>
        </div>
        : null}
    {query.data.view!=="WAITING" && pageResult.rows.length>0?<RecruiterPlacementPortfolio now={now} jobs={pageResult.rows} counts={visibleCounts} unansweredRequests={unansweredRequests}
        sheetScopeKey={context.user.id+":"+selectedCollege}
        returnTo={recruiterDrivesHref({...query.data,collegeId:selectedCollege})} />:null}
    {query.data.view !== "WAITING" ? <div className="flex min-w-0 flex-wrap items-center justify-between gap-3"><p className="text-sm text-body">{pageResult.total===0?"No matching drives":
        "Showing "+(Math.min(pageResult.total,(pageResult.page-1)*pageResult.pageSize+1))+"–"+
        Math.min(pageResult.total,pageResult.page*pageResult.pageSize)+" of "+pageResult.total.toLocaleString("en-IN")}</p>{pageResult.pages>1 ? <Pagination label="Drive pages" page={pageResult.page} pageCount={pageResult.pages} hrefForPage={page=>recruiterDrivesHref({...query.data,collegeId:selectedCollege,page})}/> : null}</div>:null}
    <Link href="/hr/round-results" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline underline-offset-4 md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Review round results →</Link>
    <p className="text-xs text-muted-foreground">Request history is saved. Placement-cell approval and external sending remain unavailable until the registered employer-request workflow is ready.</p>
  </div>;
}
