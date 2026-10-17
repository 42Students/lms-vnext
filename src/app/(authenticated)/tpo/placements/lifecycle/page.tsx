import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import {TpoDriveRequestActions} from "@/components/tpo/tpo-drive-request-actions";
import {TpoRemindNonApplicants} from "@/components/placements/tpo-remind-non-applicants";
import {TpoDriveCloneAction} from "@/components/placements/tpo-drive-clone-action";
import {TpoDriveSavedViews} from "@/components/placements/tpo-drive-saved-views";
import {TpoBulkDriveReminder} from "@/components/placements/tpo-bulk-drive-reminder";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import {StatusBadge} from "@/components/ui/status-badge";
import { hasMembershipRole } from "@/modules/identity/context";
import { getTpoDriveLifecycleList } from "@/modules/placements/tpo-drive-lifecycle-list-service";
import {driveRequestStatusTone,driveRequestStatusLabel,TPO_REQUESTS_COPY,tpoDriveStatusLabel,tpoDriveStatusTone,tpoDriveWhereItIs,tpoDriveEmploymentLabel,tpoDriveWorkModeLabel} from "@/modules/placements/tpo-drive-lifecycle-list-model";
type Search = { cohortId?:string|string[];ownerUserId?:string|string[];companyId?:string|string[];seasonId?: string | string[]; view?: string | string[];search?:string|string[];deadline?:string|string[];workMode?:string|string[];employmentType?:string|string[];sort?:string|string[];minApplied?:string|string[];maxApplied?:string|string[];minOffers?:string|string[];maxOffers?:string|string[];payCategory?:string|string[];attention?:string|string[];journey?:string|string[];display?:string|string[];page?:string|string[] };
function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
export default async function TpoDriveLifecyclePage({ searchParams }: { searchParams: Promise<Search> }) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "TPO")) redirect("/dashboard");
  const params = await searchParams;
  const data = await getTpoDriveLifecycleList(context, {
    ...(first(params.seasonId) ? { seasonId: first(params.seasonId) } : {}),
    ...(first(params.companyId)?{companyId:first(params.companyId)}:{}),
    ...(first(params.cohortId)?{cohortId:first(params.cohortId)}:{}),
    ...(first(params.ownerUserId)?{ownerUserId:first(params.ownerUserId)}:{}),
    ...(first(params.view) ? { view: first(params.view) } : {}),
    ...(first(params.search)?{search:first(params.search)}:{}),
    ...(first(params.deadline)?{deadline:first(params.deadline)}:{}),
    ...(first(params.workMode)?{workMode:first(params.workMode)}:{}),
    ...(first(params.employmentType)?{employmentType:first(params.employmentType)}:{}),
    ...(first(params.sort)?{sort:first(params.sort)}:{}),
    ...(first(params.minApplied)?{minApplied:first(params.minApplied)}:{}),
    ...(first(params.maxApplied)?{maxApplied:first(params.maxApplied)}:{}),
    ...(first(params.minOffers)?{minOffers:first(params.minOffers)}:{}),
    ...(first(params.maxOffers)?{maxOffers:first(params.maxOffers)}:{}),
    ...(first(params.payCategory)?{payCategory:first(params.payCategory)}:{}),
    ...(first(params.attention)?{attention:first(params.attention)}:{}),
    ...(first(params.journey)?{journey:first(params.journey)}:{}),
    ...(first(params.display)?{display:first(params.display)}:{}),
    ...(first(params.page)?{page:first(params.page)}:{}),
  });
  const savedViewScope=context.user.id+":"+context.membership.collegeId;
  const exportParams=new URLSearchParams({
    view:data.view,search:data.search,deadline:data.deadline,
    ...(data.companyId?{companyId:data.companyId}:{}),
    ...(data.cohortId?{cohortId:data.cohortId}:{}),
    ...(data.ownerUserId?{ownerUserId:data.ownerUserId}:{}),
    payCategory:data.payCategory,
    attention:data.attention,
    journey:data.journey,
    display:data.display,
    ...(data.minApplied!==undefined?{minApplied:String(data.minApplied)}:{}),
    ...(data.maxApplied!==undefined?{maxApplied:String(data.maxApplied)}:{}),
    ...(data.minOffers!==undefined?{minOffers:String(data.minOffers)}:{}),
    ...(data.maxOffers!==undefined?{maxOffers:String(data.maxOffers)}:{}),
    workMode:data.workMode,employmentType:data.employmentType,
    sort:data.sort,page:String(data.page),
    ...(data.season?{seasonId:data.season.id}:{}),
  });
  const exportHref=(scope:"ALL"|"PAGE")=>{
    const q=new URLSearchParams(exportParams);q.set("scope",scope);
    return "/api/placements/tpo/drives/export?"+q.toString();
  };
  const metrics=[["Drafts",data.counts.drafts],["Live",data.counts.live],["Closed",data.counts.closed],
   ["Deadlines in 7 days",data.counts.deadlinesNextSevenDays]] as const;
  function pageHref(page:number){return {pathname:"/tpo/placements/lifecycle",query:{
   ...(data.season?{seasonId:data.season.id}:{}),...(data.companyId?{companyId:data.companyId}:{}),...(data.cohortId?{cohortId:data.cohortId}:{}),...(data.ownerUserId?{ownerUserId:data.ownerUserId}:{}),view:data.view,search:data.search,deadline:data.deadline,workMode:data.workMode,employmentType:data.employmentType,sort:data.sort,payCategory:data.payCategory,
   attention:data.attention,
   journey:data.journey,
   display:data.display,
   ...(data.minApplied!==undefined?{minApplied:data.minApplied}:{}),
   ...(data.maxApplied!==undefined?{maxApplied:data.maxApplied}:{}),
   ...(data.minOffers!==undefined?{minOffers:data.minOffers}:{}),
   ...(data.maxOffers!==undefined?{maxOffers:data.maxOffers}:{}),page,
  }};}
  return <div className="space-y-6">
    <TpoDriveSavedViews scopeKey={savedViewScope}/>
    <PageHeader eyebrow="TPO" title="Drives"
      description="Review requests, prepare drafts and run every placement drive from one workspace." />
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Link href="/tpo/placements/overview" className="text-sm font-semibold text-primary-text hover:underline">Operations overview</Link>
      <Link href="/tpo/placements/new" className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">Create drive</Link>
    </div>
    <form action="/tpo/placements/lifecycle" method="get"
      className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">
      <label className="min-w-40 flex-1 text-sm font-semibold text-body">Season
        <select name="seasonId" defaultValue={data.season?.id ?? ""} disabled={!data.seasons.length}
          className="mt-2 block min-h-11 w-full rounded-md border border-border bg-surface px-3 text-foreground">
          <option value="">All college seasons</option>
          {data.seasons.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </label>
      <label className="min-w-40 flex-1 text-sm font-semibold text-body">Batch
        <select name="cohortId" defaultValue={data.cohortId??""}
          className="mt-2 block min-h-11 w-full rounded-md border border-border bg-surface px-3 text-foreground">
          <option value="">All batches</option>
          {data.batches.map(batch=><option key={batch.id} value={batch.id}>{batch.programName} · {batch.name}</option>)}
        </select>
      </label>
      <label className="min-w-40 flex-1 text-sm font-semibold text-body">Company
        <select name="companyId" defaultValue={data.companyId??""}
          className="mt-2 block min-h-11 w-full rounded-md border border-border bg-surface px-3 text-foreground">
          <option value="">All companies</option>
          {data.companies.map(company=><option key={company.id} value={company.id}>{company.name}</option>)}
        </select>
      </label>
      {data.view!=="REQUESTS"?<label className="min-w-40 flex-1 text-sm font-semibold text-body">Created by
        <select name="ownerUserId" defaultValue={data.ownerUserId??""}
          className="mt-2 block min-h-11 w-full rounded-md border border-border bg-surface px-3 text-foreground">
          <option value="">Any creator</option>
          {data.owners.map(owner=><option key={owner.id} value={owner.id}>{owner.name??"College staff"}</option>)}
        </select>
      </label>:null}
      <label className="min-w-36 flex-1 text-sm font-semibold text-body">Lifecycle
        <select name="view" defaultValue={data.view}
          className="mt-2 block min-h-11 w-full rounded-md border border-border bg-surface px-3 text-foreground">
          <option value="ALL">All jobs</option><option value="REQUESTS">Requests</option><option value="DRAFT">Drafts</option>
          <option value="LIVE">Live</option><option value="CLOSED">Closed</option>
        </select>
      </label>
      <label className="min-w-40 flex-1 text-sm font-semibold text-body">Company or drive
       <input name="search" defaultValue={data.search} maxLength={100}
        className="mt-2 block min-h-11 w-full rounded-md border border-border bg-surface px-3 text-foreground"/>
      </label>
      <label className="min-w-36 flex-1 text-sm font-semibold text-body">Deadline state
        <select name="deadline" defaultValue={data.deadline} className="mt-2 block min-h-11 w-full rounded-md border border-border bg-surface px-3 text-foreground">
          <option value="ALL">All deadlines</option>
          <option value="TODAY">Today (IST)</option>
          <option value="DUE_SOON">Live · next 7 days</option>
          <option value="LATER">Later than 7 days</option>
          <option value="OVERDUE">Live · passed</option><option value="UNSET">No recorded deadline</option>
        </select>
      </label>
      <label className="min-w-36 flex-1 text-sm font-semibold text-body">Card columns
        <select name="display" defaultValue={data.display} className="mt-2 block min-h-11 w-full rounded-md border border-border bg-surface px-3 text-foreground">
          <option value="DETAILED">Detailed</option><option value="COMPACT">Compact</option>
        </select>
      </label>
      <label className="min-w-36 flex-1 text-sm font-semibold text-body">Where it is
        <select name="journey" defaultValue={data.journey}
          className="mt-2 block min-h-11 w-full rounded-md border border-border bg-surface px-3 text-foreground">
          <option value="ALL">Every stage</option>
          <option value="TAKING_APPLICATIONS">Taking applications</option>
          <option value="RUNNING_ROUNDS">Rounds in progress</option>
          <option value="OFFERS_ISSUED">Offers issued</option>
          <option value="COMPLETE">Closed or cancelled</option>
        </select>
      </label>
      <label className="min-w-36 flex-1 text-sm font-semibold text-body">Work mode
        <select name="workMode" defaultValue={data.workMode} className="mt-2 block min-h-11 w-full rounded-md border border-border bg-surface px-3 text-foreground">
          <option value="ALL">All modes</option><option value="ONSITE">On-site</option>
          <option value="REMOTE">Remote</option><option value="HYBRID">Hybrid</option>
        </select>
      </label>
      <label className="min-w-36 flex-1 text-sm font-semibold text-body">Employment type
        <select name="employmentType" defaultValue={data.employmentType} className="mt-2 block min-h-11 w-full rounded-md border border-border bg-surface px-3 text-foreground">
          <option value="ALL">All employment</option><option value="FULL_TIME">Full-time</option>
          <option value="INTERNSHIP">Internship</option><option value="CONTRACT">Contract</option>
        </select>
      </label>
      <label className="min-w-36 flex-1 text-sm font-semibold text-body">Sort drives
        <select name="sort" defaultValue={data.sort} className="mt-2 block min-h-11 w-full rounded-md border border-border bg-surface px-3 text-foreground">
          <option value="COMPANY">Company name</option><option value="DEADLINE_ASC">Earliest recorded deadline</option>
          <option value="DEADLINE_DESC">Latest recorded deadline</option>
        </select>
      </label>
      <label className="min-w-32 flex-1 text-sm font-semibold text-body">Min. applied
        <input name="minApplied" type="number" min={0} max={100000} defaultValue={data.minApplied??""}
          className="mt-2 block min-h-11 w-full rounded-md border border-border bg-surface px-3 text-foreground"/>
      </label>
      <label className="min-w-32 flex-1 text-sm font-semibold text-body">Max. applied
        <input name="maxApplied" type="number" min={0} max={100000} defaultValue={data.maxApplied??""}
          className="mt-2 block min-h-11 w-full rounded-md border border-border bg-surface px-3 text-foreground"/>
      </label>
      <label className="min-w-32 flex-1 text-sm font-semibold text-body">Min. offers
        <input name="minOffers" type="number" min={0} max={100000} defaultValue={data.minOffers??""}
          className="mt-2 block min-h-11 w-full rounded-md border border-border bg-surface px-3 text-foreground"/>
      </label>
      <label className="min-w-32 flex-1 text-sm font-semibold text-body">Max. offers
        <input name="maxOffers" type="number" min={0} max={100000} defaultValue={data.maxOffers??""}
          className="mt-2 block min-h-11 w-full rounded-md border border-border bg-surface px-3 text-foreground"/>
      </label>
      <label className="min-w-36 flex-1 text-sm font-semibold text-body">Pay category
        <select name="payCategory" defaultValue={data.payCategory}
          className="mt-2 block min-h-11 w-full rounded-md border border-border bg-surface px-3 text-foreground">
          <option value="ALL">All categories</option><option value="REGULAR">Regular</option>
          <option value="DREAM">Dream</option>
        </select>
      </label>
      <button type="submit" className="min-h-11 rounded-md border border-primary bg-primary px-4 text-sm font-semibold text-on-primary">Apply</button>
    </form>
    <div className="flex flex-wrap gap-3 text-sm">
      <Link href={exportHref("PAGE")} className="inline-flex min-h-10 items-center rounded-md border border-border px-4 font-semibold text-primary-text">
        Export shown page (CSV)
      </Link>
      <Link href={exportHref("ALL")} className="inline-flex min-h-10 items-center rounded-md border border-border px-4 font-semibold text-primary-text">
        Export all matching drives (CSV)
      </Link>
    </div>
    <nav aria-label="Needs doing" className="flex flex-wrap gap-2 rounded-xl border border-border bg-surface p-3">
      <span className="mr-2 self-center text-sm font-semibold">Needs doing:</span>
      {([
       ["NO_APPLICANTS","Nobody has applied",data.attentionCounts.noApplicants],
       ["NO_DEADLINE","Live with no deadline",data.attentionCounts.noDeadline],
       ["DUE_SOON","Close in the next 7 days",data.attentionCounts.dueSoon],
       ["OVERDUE","Deadline passed, still open",data.attentionCounts.overdue],
       ["ALL","All drives",data.counts.total],
      ] as const).map(([attention,label,n])=><Link key={attention} href={{
        pathname:"/tpo/placements/lifecycle",query:{
          ...(data.season?{seasonId:data.season.id}:{}),
          attention,view:"ALL",page:1,
        },
       }} className={"inline-flex min-h-10 items-center rounded-md border px-3 text-sm "+
       (data.attention===attention?"border-primary bg-primary-subtle font-semibold":"border-border")}>
       {label} · {n}
      </Link>)}
      <Link className="inline-flex min-h-10 items-center rounded-md border border-border px-3 text-sm"
       href="/tpo/placements/lifecycle?view=REQUESTS">Waiting for your review</Link>
    </nav>
    <nav aria-label="Drive status tabs" className="flex flex-wrap gap-2">
      {([["REQUESTS","Requests",data.needsReviewCount],["LIVE","Live",data.statusCounts.live],["DRAFT","Drafts",data.statusCounts.drafts],["CLOSED","Closed",data.statusCounts.closed],["ALL","All jobs",data.statusCounts.all]] as const).map(([view,label,total])=>
        <Link key={view} href={{pathname:"/tpo/placements/lifecycle",query:{view,search:"",page:1}}}
          aria-current={data.view===view?"page":undefined}
          className={"inline-flex min-h-11 items-center gap-2 rounded border px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-primary "+(data.view===view?"border-primary bg-primary-subtle text-primary-text":"border-border")}>
          {label}<span className={"rounded-full px-2 py-0.5 tabular-nums "+(view==="REQUESTS"&&total>0?"bg-amber-100 text-amber-900":"bg-muted text-body")}>{total}</span>
        </Link>)}
    </nav>
    {data.view==="REQUESTS" ? (!data.requestsAvailable ?
      <EmptyState title={TPO_REQUESTS_COPY.tab} description={TPO_REQUESTS_COPY.unavailable}/> :
      <section aria-label="Recruiter drive requests" className="space-y-3">
        <p role="status" className="text-sm">{data.totalMatching} recruiter drive requests</p>
        {data.requestRows.length===0?<EmptyState title="No requests" description="No recruiter drive requests need review."/>:
          data.requestRows.map(item=><article key={item.id} className="rounded border border-border bg-surface p-4">
            <h2 className="font-semibold">{item.company} · {item.title}</h2>
            <StatusBadge tone={driveRequestStatusTone(item.status)}>{driveRequestStatusLabel(item.status)}</StatusBadge>
            <p className="text-xs text-muted-foreground">Request ID: {item.id}</p>
            {item.status==="REQUEST"||item.status==="SENT_BACK"?
              <TpoDriveRequestActions requestId={item.id} status={item.status}/>:
              item.approvedJobId?<Link href={"/tpo/placements/jobs/"+item.approvedJobId}
                className="text-primary-text underline">Open draft</Link>:null}
          </article>)}
        <nav className="flex justify-between">
          {data.page>1?<Link href={pageHref(data.page-1)}>Previous</Link>:<span/>}
          {data.page<data.totalPages?<Link href={pageHref(data.page+1)}>Next</Link>:null}
        </nav>
      </section>
    ) : <>
      <section aria-label="Drive lifecycle counts" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {metrics.map(([name,n]) =>
          <div key={name} className="rounded-xl border border-border bg-surface p-4">
            <p className="text-xs text-body">{name}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{n}</p>
          </div>)}
      </section>
      <p className="text-sm text-body">Requests are tracked separately from drafts and published drives.</p>
      <p role="status" className="text-sm text-body">{data.totalMatching} matching drives · Page {data.page} of {data.totalPages}.
       Counts cover the selected college season (or all seasons) and search across every page.</p>
      {data.rows.length === 0 ?
        <div className="space-y-3">
          <EmptyState
            title={data.view==="LIVE"?"No live drives yet":
             data.view==="DRAFT"?"No draft drives yet":
             data.view==="CLOSED"?"No closed drives match these filters":"No matching drives"}
            description={data.view==="LIVE"?"Published opportunities appear here once ready.":
             data.view==="DRAFT"?"Create a drive to start planning the next hiring opportunity.":
             data.view==="CLOSED"?"Completed and cancelled opportunities appear here.":
              "No non-archived jobs match the selected season and filters."} />
          <Link href="/tpo/placements/new" className="inline-flex min-h-11 items-center rounded border border-border px-4 text-sm font-semibold text-primary-text">Create drive</Link>
        </div> :
        <form action="/api/placements/tpo/drives/export" method="get" aria-label="Selected drive export" className="grid gap-3">
          {Array.from(exportParams.entries()).map(([key,value])=><input type="hidden" key={key} name={key} value={value}/>)}
          <input type="hidden" name="scope" value="SELECTED"/>
          <p className="text-sm text-body">Select up to 25 drives shown on this page to export just those rows.</p>
          {data.rows.map((job) => <article key={job.id} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <label className="mb-2 flex items-center gap-2 text-sm">
                 <input name="ids" type="checkbox" value={job.id} aria-label={"Select "+job.company+" "+job.title}/>
                 Select for export
                </label>
                <h2 className="font-semibold text-foreground">{job.company} · {job.title}</h2>
                <p className="flex flex-wrap items-center gap-2 text-sm text-body"><StatusBadge tone={tpoDriveStatusTone(job.status)}>{tpoDriveStatusLabel(job.status)}</StatusBadge><span>{tpoDriveEmploymentLabel(job.employmentType)} · {tpoDriveWorkModeLabel(job.workMode)}</span></p>
                {data.display==="DETAILED"?<dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-body">
                  <div className="flex gap-1"><dt>Applied:</dt><dd className="font-semibold tabular-nums">{job.appliedCount}</dd></div>
                  <div className="flex gap-1"><dt>Created by:</dt><dd>{job.createdBy??"College staff"}</dd></div>
                  <div className="flex gap-1"><dt>Job type:</dt><dd>{tpoDriveEmploymentLabel(job.employmentType)}</dd></div>
                  <div className="flex gap-1"><dt>Mode:</dt><dd>{tpoDriveWorkModeLabel(job.workMode)}</dd></div>
                  <div className="flex gap-1"><dt>Pay:</dt><dd className="font-semibold">
                    {job.minimumAnnualCtcInr == null && job.maximumAnnualCtcInr == null
                      ? "Not recorded"
                      : "₹" + (job.minimumAnnualCtcInr != null
                        ? (job.minimumAnnualCtcInr / 100000).toLocaleString("en-IN") : "—") +
                        (job.maximumAnnualCtcInr != null
                          ? "–" + (job.maximumAnnualCtcInr / 100000).toLocaleString("en-IN") : "") + " LPA"}
                    {job.isDream ? " · Dream" : " · Regular"}
                    {job.stipendPerMonthInr!=null?" · Stipend ₹"+job.stipendPerMonthInr.toLocaleString("en-IN")+"/month":""}
                  </dd></div>
                </dl>:null}
                <p className="mt-2 text-sm font-semibold text-foreground">
                  Where it is: {tpoDriveWhereItIs(job,data.asOf)}
                </p>
                <p className="text-xs text-body">
                  {job.roundsCompleted} of {job.roundCount} rounds completed · {job.offersMade} active offers
                </p>
                <p className="text-xs text-body">Deadline: {job.applicationDeadline
                  ? new Date(job.applicationDeadline).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})
                  +" IST": "Not recorded"}</p></div>
              <div className="flex flex-wrap items-center gap-2">
                <Link href={"/tpo/placements/jobs/"+job.id} className="inline-flex min-h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Open drive</Link>
                <details className="relative">
                  <summary aria-label={"More actions for "+job.company+" "+job.title} className="flex min-h-10 cursor-pointer list-none items-center rounded-md border border-border px-3 text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-primary">More ···</summary>
                  <nav aria-label={"Drive links for "+job.title} className="absolute right-0 z-10 mt-1 min-w-48 space-y-1 rounded-md border border-border bg-surface p-2 shadow-lg">
                    <Link className="block rounded px-3 py-2 text-sm text-primary-text hover:bg-primary-subtle" href={"/tpo/placements/jobs/"+job.id+"/applicants"}>Applicants</Link>
                    <Link className="block rounded px-3 py-2 text-sm text-primary-text hover:bg-primary-subtle" href={"/tpo/placements/jobs/"+job.id+"/rounds"}>Rounds and schedule</Link>
                    <Link className="block rounded px-3 py-2 text-sm text-primary-text hover:bg-primary-subtle" href={"/tpo/placements/jobs/"+job.id+"/offers"}>Offers</Link>
                    <Link className="block rounded px-3 py-2 text-sm text-primary-text hover:bg-primary-subtle"
                      href={"/tpo/placements/jobs/"+job.id+"/applications-export"}>Export applicants</Link>
                    <Link className="block rounded px-3 py-2 text-sm text-primary-text hover:bg-primary-subtle"
                      href={"/tpo/placements/jobs/"+job.id+"/share-preview"}>Share with company</Link>
                    {job.status==="PUBLISHED"?<Link
                      className="block rounded px-3 py-2 text-sm text-primary-text hover:bg-primary-subtle"
                      href={"/tpo/placements/jobs/"+job.id+"/extend-deadline"}>
                      Set or extend deadline
                    </Link>:null}
                    {job.status==="PUBLISHED"?<Link
                      className="block rounded px-3 py-2 text-sm text-primary-text hover:bg-primary-subtle"
                      href={"/tpo/placements/jobs/"+job.id+"/close-preview"}>
                      Review and close drive
                    </Link>:null}
                    {job.status==="PUBLISHED"?<TpoRemindNonApplicants jobId={job.id}/>:null}
                    {["CLOSED","CANCELLED"].includes(job.status)?<TpoDriveCloneAction jobId={job.id}/>:null}
                  </nav>
                </details>
              </div>
            </div></article>)}
          <div className="flex flex-wrap items-start gap-3">
          <button type="submit" className="min-h-11 justify-self-start rounded border border-primary px-4 text-sm font-semibold text-primary-text">
            Export selected drives (CSV)
          </button>
           <TpoBulkDriveReminder/>
          </div>
        </form>}
      <nav aria-label="Drive pages" className="flex flex-wrap items-center justify-between gap-3">
       {data.page>1?<Link href={pageHref(data.page-1)} className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Previous</Link>:<span/>}
       {data.page<data.totalPages?<Link href={pageHref(data.page+1)} className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Next</Link>:null}
      </nav>
    </>}
  </div>;
}
