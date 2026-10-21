import { DateInput } from "@/components/ui/date-input";
import { Select } from "@/components/ui/select";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { driveListHref, driveQueryFromSearch } from "@/modules/placements/college-drive-read-model";
import { listCollegeDrives } from "@/modules/placements/college-drive-read-service";
import {CollegeDriveBulkActions} from "@/components/placements/college-drive-bulk-actions";
import {CollegeDriveDeadlineAction} from "@/components/placements/college-drive-deadline-action";
import {CollegeDriveRowLifecycleAction} from "@/components/placements/college-drive-row-lifecycle-action";
import {CollegeDriveArchiveAction} from "@/components/placements/college-drive-archive-action";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {StatusBadge} from "@/components/ui/status-badge";
import {CollegeDrivesRefreshButton} from "@/components/placements/college-drives-refresh-button";
import {CollegeDrivesQuickFilters} from "@/components/placements/college-drives-quick-filters";
import {CollegeDriveCreateDialog} from "@/components/placements/college-drive-create-dialog";
import {PlacementJobCreateWorkspace} from "@/components/placements/placement-job-create-workspace";
import {hasMembershipRole} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";

export default async function CollegeDrivesPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await getCurrentRequestContext();
  if (!context.membership) return <div className="min-w-0 space-y-4">
    <PageHeader title="Jobs"/>
    <ErrorState title="Admin not assigned to a college"
      description="Contact your administrator to assign a college before managing placement jobs."
      action={<Link href="/dashboard"
        className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Back to dashboard</Link>} />
  </div>;
  const params = await searchParams;
  const query = driveQueryFromSearch({
    ...params,
    status:params.status ?? "ALL",
  });
  if (!query) return <div className="space-y-4">
    <PageHeader title="Jobs" />
    <ErrorState title="Invalid drive filters" description="Search, status, season, company or page is invalid."
      action={<Link href="/college/placements/drives" className="inline-flex min-h-11 md:min-h-9 items-center hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Clear filters</Link>} />
  </div>;
  let data: Awaited<ReturnType<typeof listCollegeDrives>>;
  try {
    data = await listCollegeDrives(context,query);
  } catch (error) {
    if (error instanceof AuthorizationError) throw error;
    return <div className="min-w-0 space-y-4">
      <PageHeader title="Jobs" actions={<CollegeDrivesRefreshButton/>}/>
      <p role="status" className="border-l-2 border-[var(--lms-warning)] bg-[var(--lms-warning-subtle)] p-3 text-sm text-body">Couldn't refresh drives. Search and filters are preserved; no stale rows are shown from an unverified college or filter scope.</p>
      <form method="get" role="search" aria-label="Drive filters" className="flex min-w-0 flex-wrap items-end gap-3 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4">
       <CollegeDrivesQuickFilters q={query.q} status={query.status}/>
       <Button type="submit">Filter</Button>
      </form>
      <ErrorState title="Failed to load jobs. Please try again."
        description="The drive list could not be loaded. No changes were made."
        action={<Link href={driveListHref(query)}
          className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Try Again</Link>}/>
    </div>;
  }
  // A closed/expired deadline is distinct from an administrator closing a job.
  // Every date is presented in the college's India-time legacy format.
  if(data.total>0&&query.page>data.totalPages)redirect(driveListHref({...query,page:data.totalPages}));
  const formatter = new Intl.DateTimeFormat("en-IN",{day:"2-digit",month:"short",year:"numeric",timeZone:"Asia/Kolkata"});
  const expired=(job:(typeof data.items)[number])=>Boolean(job.applicationDeadline&&job.applicationDeadline.getTime()<Date.now());
  const jobStatus=(job:(typeof data.items)[number])=>{
    const ended=job.status==="PUBLISHED"&&expired(job);
    return <StatusBadge tone={job.status==="PUBLISHED"?(ended?"warning":"success"):job.status==="DRAFT"?"neutral":"warning"}>
      {job.status==="PUBLISHED"?(ended?"Open · Expired":"Open"):
       job.status==="DRAFT"?"Draft":job.status==="CLOSED"?"Closed":job.status==="ARCHIVED"?"Archived":job.status}
    </StatusBadge>;
  };
  const columns:DataTableColumn<(typeof data.items)[number]>[]=[
    {key:"drive",header:"Job Title",mobilePriority:"primary",className:"min-w-[240px] md:sticky md:left-0 md:z-10 md:bg-surface",cell:item=>
     <div className="min-w-0 space-y-1">
      <div>{jobStatus(item)}</div>
      <Link href={"/college/placements/jobs/"+encodeURIComponent(item.id)+"/overview?returnTo="+encodeURIComponent(driveListHref(query))}
        className="inline-flex min-h-11 items-center break-words font-semibold text-link underline-offset-2 hover:underline md:min-h-9">
        {item.title}
      </Link>
      <p className="min-w-0 break-words text-xs text-muted-foreground">{item.companyName||"—"}</p>
     </div>},
    {key:"type",header:"Type",className:"min-w-[100px]",cell:item=><StatusBadge tone="neutral">{item.type.replaceAll("_"," ")}</StatusBadge>},
    {key:"location",header:"Location",className:"min-w-[120px]",cell:item=>item.locations.join(", ")||"—"},
    {key:"deadline",header:"Deadline",className:"min-w-[130px]",cell:item=>item.applicationDeadline?
     <span className={"inline-flex items-center gap-1 "+(expired(item)?"text-[var(--lms-warning-text)] line-through":"")}>
      <svg aria-hidden="true" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7">
       <rect x="3.5" y="5.5" width="17" height="15" rx="2"/><path d="M7.5 3v5M16.5 3v5M3.5 10.5h17"/>
      </svg>{formatter.format(item.applicationDeadline)}
     </span>:"—"},
    {key:"posted",header:"Posted",className:"min-w-[130px]",cell:item=>formatter.format(item.publishedAt??item.createdAt)},
    {key:"applicants",header:"Applicants",className:"min-w-[90px]",cell:item=>item.applicants},
    {key:"actions",header:"Actions",mobilePriority:"action",className:"min-w-[260px] md:sticky md:right-0 md:z-10 md:bg-surface",cell:item=><div className="flex min-w-0 flex-wrap items-center gap-2">
      <Link href={"/college/placements/jobs/"+encodeURIComponent(item.id)+"/applications?returnTo="+encodeURIComponent(driveListHref(query))} aria-label={"View Applications for "+item.title}
        className="inline-flex min-h-11 md:min-h-[var(--lms-control-height)] items-center font-semibold text-link underline hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">View Applications</Link>
      <Link href={"/college/placements/jobs/"+encodeURIComponent(item.id)+"/settings?returnTo="+encodeURIComponent(driveListHref(query))} aria-label={"Edit "+item.title}
        className="inline-flex min-h-11 md:min-h-[var(--lms-control-height)] items-center font-semibold text-link underline hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Edit</Link>
      <CollegeDriveRowLifecycleAction jobId={item.id} title={item.title} status={item.status}/>
      {item.status!=="ARCHIVED"?<details className="min-w-0 w-full">
        <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold text-[var(--lms-error)] md:min-h-9">
          Delete / archive drive
        </summary>
        <div className="mt-2 max-w-md">
          <CollegeDriveArchiveAction jobId={item.id}/>
        </div>
      </details>:null}
      {item.status==="PUBLISHED"?<CollegeDriveDeadlineAction jobId={item.id}
        title={item.title} currentDeadline={item.applicationDeadline?.toISOString()??null}/>:null}
    </div>},
  ];

  return <div className="space-y-6">
    <PageHeader title="Jobs"
      description="College-owned placement jobs. Filter, review applications or edit a job without leaving the college's placements workspace."
      actions={<div className="flex flex-wrap items-center gap-3">
        <CollegeDrivesRefreshButton/>
        {hasMembershipRole(context,"COLLEGE_ADMIN")?<CollegeDriveCreateDialog>
          <PlacementJobCreateWorkspace context={context}
            collegeId={context.membership.collegeId} basePath="/college/placements"/>
        </CollegeDriveCreateDialog>:null}
        <Link href="/college/placements/new"
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] bg-[var(--lms-button-primary)] px-4 text-sm font-semibold text-on-primary md:min-h-9 hover:bg-[var(--lms-button-primary-hover)]">
          Full-page editor
        </Link>
        <Link href="/college/placements"
          className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">
          All drives / Placements
        </Link>
      </div>} />
    <form method="get" role="search" aria-label="Drive filters" className="grid md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 min-w-0 gap-[var(--lms-space-2)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)] max-[767px]:grid-cols-1">
      <CollegeDrivesQuickFilters q={query.q} status={query.status}/>
      <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Season
        <Select name="seasonId" defaultValue={query.seasonId ?? ""}>
          <option value="">All seasons</option>
          {data.seasons.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      </label>
      <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Company
        <Select name="relationshipId" defaultValue={query.relationshipId ?? ""}
         >
          <option value="">All companies</option>
          {data.companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </label>
      <details className="min-w-0 border-t border-border pt-2 md:col-span-2 lg:col-span-4 xl:col-span-6"
        open={Boolean(query.deadlineAfter||query.deadlineBefore||query.minimumApplicants||query.sort!=="TITLE")||undefined}>
        <summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Advanced filters</summary>
        <div className="grid min-w-0 gap-[var(--lms-space-3)] pt-3 md:grid-cols-2 lg:grid-cols-4">
      <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Deadline from
        <DateInput mode="date" name="deadlineAfter" defaultValue={query.deadlineAfter??""}
          />
      </label>
      <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Deadline on or before
        <DateInput mode="date" name="deadlineBefore" defaultValue={query.deadlineBefore??""}
          />
      </label>
      <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">At least N applicants
        <Input type="number" name="minimumApplicants" min={0} max={100000}
          defaultValue={query.minimumApplicants??""}
          />
      </label>
      <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Sort
        <Select name="sort" defaultValue={query.sort}>
          <option value="TITLE">Title A–Z</option><option value="DEADLINE">Deadline first</option>
          <option value="NEWEST">Newest created</option><option value="APPLICANTS">Most applicants</option>
        </Select>
      </label>
      <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold text-[var(--lms-neutral-400)]">
        Rows per page
        <Select name="pageSize" defaultValue={String(query.pageSize)}>
          <option value="10">10</option><option value="20">20</option>
          <option value="50">50</option><option value="100">100</option>
        </Select>
      </label>
        </div>
      </details>
      <Button type="submit" className="w-full self-end min-[768px]:w-auto">Filter</Button>
      <Link href="/college/placements/drives" className="inline-flex min-h-11 items-center justify-center px-3 text-sm font-semibold text-link underline md:min-h-9">Clear filters</Link>
    </form>
    <CollegeDriveBulkActions key={JSON.stringify(query)} drives={data.items}/>
    <section className="space-y-2" aria-label="Persisted drives">
      <p role="status" className="text-sm text-body leading-[1.6]">{data.total.toLocaleString("en-IN")} matching persisted drives</p>
      <div className="hidden md:block"><DataTable caption="College placement jobs" columns={columns} rows={data.items} mobileMode="scroll"
        getRowKey={item=>item.id}
        empty={<div className="min-w-0 space-y-2 text-sm text-body" role="status">
          <p>{data.total===0 && query.status==="ALL" && !query.q && !query.seasonId && !query.relationshipId
            ?"No drives yet":data.total===0?"No drives match these filters in this college.":"No rows on this page. Choose an earlier page."}</p>
          {data.total===0 && query.status==="ALL" && !query.q &&
            !query.seasonId && !query.relationshipId?
            <p>Create the first job for this college.</p>:null}
          {data.total===0?<Link href="/college/placements/new"
            className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Create Job</Link>:null}
          <Link href="/college/placements/drives" className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Clear filters</Link>
        </div>} /></div>
      <div className="grid min-w-0 gap-3 md:hidden" aria-label="College placement jobs mobile cards">
       {data.items.map(item=><article key={item.id} className="min-w-0 space-y-3 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
         <Link href={"/college/placements/jobs/"+encodeURIComponent(item.id)+"/overview?returnTo="+encodeURIComponent(driveListHref(query))}
          className="min-w-0 flex-1 break-words font-semibold text-link underline-offset-2 hover:underline">{item.title}</Link>
         {jobStatus(item)}
        </div>
        <p className="break-words text-sm text-muted-foreground">{item.companyName||"—"}</p>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
         <div><dt className="text-xs text-muted-foreground">Location</dt><dd className="break-words">{item.locations.join(", ")||"—"}</dd></div>
         <div><dt className="text-xs text-muted-foreground">Deadline</dt><dd className={expired(item)?"line-through text-[var(--lms-warning-text)]":""}>{item.applicationDeadline?formatter.format(item.applicationDeadline):"—"}</dd></div>
         <div><dt className="text-xs text-muted-foreground">Type</dt><dd>{item.type.replaceAll("_"," ")}</dd></div>
         <div><dt className="text-xs text-muted-foreground">Applicants</dt><dd>{item.applicants}</dd></div>
        </dl>
        <div className="flex flex-wrap items-center gap-3 border-t border-[var(--lms-canvas-border)] pt-3">
         <Link href={"/college/placements/jobs/"+encodeURIComponent(item.id)+"/applications?returnTo="+encodeURIComponent(driveListHref(query))}
          aria-label={"View Applications for "+item.title} className="min-h-11 text-sm font-semibold text-link underline">View Applications</Link>
         <Link href={"/college/placements/jobs/"+encodeURIComponent(item.id)+"/settings?returnTo="+encodeURIComponent(driveListHref(query))}
          aria-label={"Edit "+item.title} className="min-h-11 text-sm font-semibold text-link underline">Edit</Link>
         <CollegeDriveRowLifecycleAction jobId={item.id} title={item.title} status={item.status}/>
         {item.status!=="ARCHIVED"?<details className="min-w-0 w-full">
          <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold text-[var(--lms-error)]">Delete / archive drive</summary>
          <CollegeDriveArchiveAction jobId={item.id}/>
         </details>:null}
         {item.status==="PUBLISHED"?<CollegeDriveDeadlineAction jobId={item.id} title={item.title}
          currentDeadline={item.applicationDeadline?.toISOString()??null}/>:null}
        </div>
       </article>)}
       {data.items.length===0?<p role="status" className="p-4 text-sm text-body">
        {data.total===0&&query.status==="ALL"&&!query.q?"No drives yet":"No drives match these filters"}
        {" "}<Link href="/college/placements/new" className="font-semibold text-link underline">Create Job</Link>
       </p>:null}
      </div>
    </section>
    <nav aria-label="Drive pages" className="flex min-w-0 flex-wrap items-center justify-between gap-3 text-sm">
      <span>Page {data.query.page} of {data.totalPages} · {data.total===0?"0 jobs":((data.query.page-1)*data.query.pageSize+1)+"–"+Math.min(data.query.page*data.query.pageSize,data.total)+" of "+data.total+" jobs"}</span><div className="flex flex-wrap gap-3">
        {query.page>1?<Link className="inline-flex min-h-11 items-center rounded-[8px] md:rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-white px-[var(--lms-space-3)] text-[var(--lms-font-base)] font-[650] text-[var(--lms-link-text)] md:min-h-[var(--lms-control-height)] hover:border-[var(--lms-primary)] hover:bg-[rgba(38,186,199,0.07)] hover:text-[var(--lms-primary-text)] active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-subtle)] active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]" href={driveListHref({...query,page:query.page-1})}>Previous</Link>:null}
        {query.page<data.totalPages?<Link className="inline-flex min-h-11 items-center rounded-[8px] md:rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-white px-[var(--lms-space-3)] text-[var(--lms-font-base)] font-[650] text-[var(--lms-link-text)] md:min-h-[var(--lms-control-height)] hover:border-[var(--lms-primary)] hover:bg-[rgba(38,186,199,0.07)] hover:text-[var(--lms-primary-text)] active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-subtle)] active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]" href={driveListHref({...query,page:query.page+1})}>Next</Link>:null}
      </div>
    </nav>
  </div>;
}
