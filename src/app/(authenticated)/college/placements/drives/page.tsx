import { DateInput } from "@/components/ui/date-input";
import { Select } from "@/components/ui/select";
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
import {CollegeDriveEditDialog} from "@/components/placements/college-drive-edit-dialog";
import {PlacementJobCreateWorkspace} from "@/components/placements/placement-job-create-workspace";
import {hasMembershipRole} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {resolveOptionalModuleAccess} from "@/modules/module-access/service";
import {CollegeDrivesCapture,CollegeDrivesStaleFallback} from "@/components/placements/college-drives-last-good";
import { Label } from "@/components/ui/label";
import { Disclosure } from "@/components/ui/disclosure";
import { TextLink } from "@/components/ui/text-link";
import { ButtonLink } from "@/components/ui/button-link";
import { formatNumberIN } from "@/lib/safe-format";
import { createDateFormatter } from "@/lib/format-date";

export default async function CollegeDrivesPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await getCurrentRequestContext();
  if (!context.membership) return <div className="min-w-0 space-y-4">
    <PageHeader title="Jobs"/>
    <ErrorState title="Admin not assigned to a college"
      description="Contact your administrator to assign a college before managing placement jobs."
      action={<TextLink href="/dashboard"
        className="inline-flex min-h-11 items-center md:min-h-9">Back to dashboard</TextLink>} />
  </div>;
  // An active college membership is not itself a College Admin grant.
  // Reject wrong-role callers before resolving college module settings.
  if (!hasMembershipRole(context, "COLLEGE_ADMIN")) redirect("/dashboard");
  const moduleAccess = await resolveOptionalModuleAccess(context);
  if (!moduleAccess.placements.enabled) return <div className="min-w-0 space-y-4">
    <PageHeader title="Jobs"/>
    <ErrorState title="Placements unavailable"
      description="Placements is turned off for this college. Ask a Super Admin to enable Placements in Module Access before managing placement jobs."
      action={<TextLink href="/college/module-access" className="inline-flex min-h-11 items-center md:min-h-9">View college module access</TextLink>} />
  </div>;
  const params = await searchParams;
  const query = driveQueryFromSearch({
    ...params,
    status:params["status"] ?? "ALL",
  });
  if (!query) return <div className="space-y-4">
    <PageHeader title="Jobs" />
    <ErrorState title="Invalid drive filters" description="Search, status, season, company or page is invalid."
      action={<TextLink href="/college/placements/drives" className="inline-flex min-h-11 md:min-h-9 items-center">Clear filters</TextLink>} />
  </div>;
  let data: Awaited<ReturnType<typeof listCollegeDrives>>;
  try {
    data = await listCollegeDrives(context,query);
  } catch (error) {
    if (error instanceof AuthorizationError) throw error;
    return <div className="min-w-0 space-y-4">
      <PageHeader title="Jobs" actions={<CollegeDrivesRefreshButton/>}/>
      <CollegeDrivesStaleFallback retryHref={driveListHref(query)}/>
      <form method="get" role="search" aria-label="Drive filters" className="flex min-w-0 flex-wrap items-end gap-3 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4">
       <CollegeDrivesQuickFilters q={query.q} status={query.status}/>
       <Button type="submit">Filter</Button>
      </form>
    </div>;
  }
  // A closed/expired deadline is distinct from an administrator closing a job.
  // Every date is presented in the college's India-time legacy format.
  if(data.total>0&&query.page>data.totalPages)redirect(driveListHref({...query,page:data.totalPages}));
  const formatter = createDateFormatter("en-IN", {day:"2-digit",month:"short",year:"numeric",timeZone:"Asia/Kolkata"});
  const expired=(job:(typeof data.items)[number])=>Boolean(job.applicationDeadline&&job.applicationDeadline.getTime()<Date.now());
  const jobStatus=(job:(typeof data.items)[number])=>{
    const ended=job.status==="PUBLISHED"&&expired(job);
    return <StatusBadge tone={job.status==="PUBLISHED"?(ended?"warning":"success"):job.status==="DRAFT"?"neutral":"warning"}>
      {job.status==="PUBLISHED"?(ended?"Open · Expired":"Open"):
       job.status==="DRAFT"?"Draft":job.status==="CLOSED"?"Closed":job.status==="ARCHIVED"?"Archived":job.status}
    </StatusBadge>;
  };
  const columns:DataTableColumn<(typeof data.items)[number]>[]=[
    {key:"drive",header:"Job Title",mobilePriority:"primary",className:"min-w-[240px] md:sticky md:left-0 md:z-(--lms-z-raised) md:bg-surface",cell:item=>
     <div className="min-w-0 space-y-1">
      <div>{jobStatus(item)}</div>
      <TextLink href={"/college/placements/jobs/"+encodeURIComponent(item.id)+"/overview?returnTo="+encodeURIComponent(driveListHref(query))}
        className="inline-flex min-h-11 items-center break-words md:min-h-9">
        {item.title}
      </TextLink>
      <p className="min-w-0 break-words text-xs text-muted-foreground">{item.companyName||"—"}</p>
     </div>},
    {key:"type",header:"Type",className:"min-w-[100px]",cell:item=><StatusBadge tone="neutral">{item.type.replaceAll("_"," ")}</StatusBadge>},
    {key:"location",header:"Location",className:"min-w-[120px]",cell:item=>item.locations.join(", ")||"—"},
    {key:"deadline",header:"Deadline",className:"min-w-[132px]",cell:item=>item.applicationDeadline?
     <span className={"inline-flex items-center gap-1 "+(expired(item)?"text-[var(--lms-warning-text)] line-through":"")}>
      <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7">
       <rect x="3.5" y="5.5" width="17" height="15" rx="2"/><path d="M7.5 3v5M16.5 3v5M3.5 10.5h17"/>
      </svg>{formatter.format(item.applicationDeadline)}
     </span>:"—"},
    {key:"posted",header:"Posted",className:"min-w-[132px]",cell:item=>formatter.format(item.publishedAt??item.createdAt)},
    {key:"applicants",header:"Applicants",className:"min-w-[92px]",cell:item=>item.applicants},
    {key:"actions",header:"Actions",mobilePriority:"action",className:"min-w-[260px] md:sticky md:right-0 md:z-(--lms-z-raised) md:bg-surface",cell:item=><div className="flex min-w-0 flex-wrap items-center gap-2">
      <TextLink href={"/college/placements/jobs/"+encodeURIComponent(item.id)+"/applications?returnTo="+encodeURIComponent(driveListHref(query))} aria-label={"View Applications for "+item.title}
        className="inline-flex min-h-11 md:min-h-[var(--lms-control-height)] items-center">View Applications</TextLink>
      {item.status==="DRAFT"
        ?<CollegeDriveEditDialog jobId={item.id} title={item.title} fullEditorHref={"/college/placements/jobs/"+encodeURIComponent(item.id)+"/settings?returnTo="+encodeURIComponent(driveListHref(query))}/>
        :<TextLink href={"/college/placements/jobs/"+encodeURIComponent(item.id)+"/settings?returnTo="+encodeURIComponent(driveListHref(query))}
          aria-label={"Edit "+item.title} className="inline-flex min-h-11 items-center">Edit</TextLink>}
      <CollegeDriveRowLifecycleAction jobId={item.id} title={item.title} status={item.status}/>
      {item.status!=="ARCHIVED"?<Disclosure title="Delete / archive drive" className="min-w-0 w-full">
        <div className="mt-2 max-w-md">
          <CollegeDriveArchiveAction jobId={item.id}/>
        </div>
      </Disclosure>:null}
      {item.status==="PUBLISHED"?<CollegeDriveDeadlineAction jobId={item.id}
        title={item.title} currentDeadline={item.applicationDeadline?.toISOString()??null}/>:null}
    </div>},
  ];

  return <CollegeDrivesCapture><div className="space-y-6">
    <PageHeader title="Jobs"
      description="College-owned placement jobs. Filter, review applications or edit a job without leaving the college's placements workspace."
      actions={<div className="flex flex-wrap items-center gap-3">
        <CollegeDrivesRefreshButton/>
        <ButtonLink variant="secondary" href="/college/placements/student-lookup">
          Look up a student&apos;s placement status →
        </ButtonLink>
        {hasMembershipRole(context,"COLLEGE_ADMIN")?<CollegeDriveCreateDialog>
          <PlacementJobCreateWorkspace context={context}
            collegeId={context.membership.collegeId} basePath="/college/placements"/>
        </CollegeDriveCreateDialog>:null}
        <ButtonLink variant="primary" href="/college/placements/new">
          Create Job
        </ButtonLink>
        <TextLink href="/college/placements"
          className="inline-flex min-h-11 items-center md:min-h-9">
          All drives / Placements
        </TextLink>
      </div>} />
    <form method="get" role="search" aria-label="Drive filters" className="grid md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 min-w-0 gap-[var(--lms-space-2)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)] max-md:grid-cols-1">
      <CollegeDrivesQuickFilters q={query.q} status={query.status}/>
      <Label stack>Season
        <Select name="seasonId" defaultValue={query.seasonId ?? ""}>
          <option value="">All seasons</option>
          {data.seasons.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      </Label>
      <Label stack>Company
        <Select name="relationshipId" defaultValue={query.relationshipId ?? ""}
         >
          <option value="">All companies</option>
          {data.companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </Label>
      <Disclosure title="Advanced filters" defaultOpen={Boolean(query.deadlineAfter||query.deadlineBefore||query.minimumApplicants||query.sort!=="TITLE")||undefined} className="min-w-0 md:col-span-2 lg:col-span-4 xl:col-span-6">
        <div className="grid min-w-0 gap-[var(--lms-space-3)] pt-3 md:grid-cols-2 lg:grid-cols-4">
      <Label stack>Deadline from
        <DateInput mode="date" name="deadlineAfter" defaultValue={query.deadlineAfter??""}
          />
      </Label>
      <Label stack>Deadline on or before
        <DateInput mode="date" name="deadlineBefore" defaultValue={query.deadlineBefore??""}
          />
      </Label>
      <Label stack>At least N applicants
        <Input type="number" name="minimumApplicants" min={0} max={100000}
          defaultValue={query.minimumApplicants??""}
          />
      </Label>
      <Label stack>Sort
        <Select name="sort" defaultValue={query.sort}>
          <option value="TITLE">Title A–Z</option><option value="DEADLINE">Deadline first</option>
          <option value="NEWEST">Newest created</option><option value="APPLICANTS">Most applicants</option>
        </Select>
      </Label>
      <Label stack>
        Rows per page
        <Select name="pageSize" defaultValue={String(query.pageSize)}>
          <option value="10">10</option><option value="20">20</option>
          <option value="50">50</option><option value="100">100</option>
        </Select>
      </Label>
        </div>
      </Disclosure>
      <Button type="submit" className="w-full self-end md:w-auto">Filter</Button>
      <TextLink href="/college/placements/drives" className="inline-flex min-h-11 items-center justify-center px-3 text-sm md:min-h-9">Clear filters</TextLink>
    </form>
    <CollegeDriveBulkActions key={JSON.stringify(query)} drives={data.items}/>
    <section className="space-y-2" aria-label="Persisted drives">
      <p role="status" className="text-sm text-body leading-[1.6]">{formatNumberIN(data.total)} matching persisted drives</p>
      <div className="hidden md:block"><DataTable caption="College placement jobs" columns={columns} rows={data.items} mobileMode="scroll"
        getRowKey={item=>item.id}
        empty={<div className="min-w-0 space-y-2 text-sm text-body" role="status">
          <p>{data.total===0 && query.status==="ALL" && !query.q && !query.seasonId && !query.relationshipId
            ?"No drives yet":data.total===0?"No drives match these filters in this college.":"No rows on this page. Choose an earlier page."}</p>
          {data.total===0 && query.status==="ALL" && !query.q &&
            !query.seasonId && !query.relationshipId?
            <p>Create the first job for this college.</p>:null}
          {data.total===0?<TextLink href="/college/placements/new"
            className="inline-flex min-h-11 items-center md:min-h-9">Create Job</TextLink>:null}
          <TextLink href="/college/placements/drives" className="inline-flex min-h-11 items-center md:min-h-9">Clear filters</TextLink>
        </div>} /></div>
      <div className="grid min-w-0 gap-3 md:hidden" aria-label="College placement jobs mobile cards">
       {data.items.map(item=><article key={item.id} className="min-w-0 space-y-3 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
         <TextLink href={"/college/placements/jobs/"+encodeURIComponent(item.id)+"/overview?returnTo="+encodeURIComponent(driveListHref(query))}
          className="min-w-0 flex-1 break-words">{item.title}</TextLink>
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
         <TextLink href={"/college/placements/jobs/"+encodeURIComponent(item.id)+"/applications?returnTo="+encodeURIComponent(driveListHref(query))}
          aria-label={"View Applications for "+item.title} className="min-h-11 text-sm">View Applications</TextLink>
         {item.status==="DRAFT"
          ?<CollegeDriveEditDialog jobId={item.id} title={item.title} fullEditorHref={"/college/placements/jobs/"+encodeURIComponent(item.id)+"/settings?returnTo="+encodeURIComponent(driveListHref(query))}/>
          :<TextLink href={"/college/placements/jobs/"+encodeURIComponent(item.id)+"/settings?returnTo="+encodeURIComponent(driveListHref(query))}
            aria-label={"Edit "+item.title} className="min-h-11 text-sm">Edit</TextLink>}
         <CollegeDriveRowLifecycleAction jobId={item.id} title={item.title} status={item.status}/>
         {item.status!=="ARCHIVED"?<Disclosure title="Delete / archive drive" className="min-w-0 w-full">
          <CollegeDriveArchiveAction jobId={item.id}/>
         </Disclosure>:null}
         {item.status==="PUBLISHED"?<CollegeDriveDeadlineAction jobId={item.id} title={item.title}
          currentDeadline={item.applicationDeadline?.toISOString()??null}/>:null}
        </div>
       </article>)}
       {data.items.length===0?<p role="status" className="p-4 text-sm text-body">
        {data.total===0&&query.status==="ALL"&&!query.q?"No drives yet":"No drives match these filters"}
        {" "}<TextLink href="/college/placements/new">Create Job</TextLink>
       </p>:null}
      </div>
    </section>
    <nav aria-label="Drive pages" className="flex min-w-0 flex-wrap items-center justify-between gap-3 text-sm">
      <span>Page {data.query.page} of {data.totalPages} · {data.total===0?"0 jobs":((data.query.page-1)*data.query.pageSize+1)+"–"+Math.min(data.query.page*data.query.pageSize,data.total)+" of "+data.total+" jobs"}</span><div className="flex flex-wrap gap-3">
        {query.page>1?<ButtonLink variant="secondary" href={driveListHref({...query,page:query.page-1})}>Previous</ButtonLink>:null}
        {query.page<data.totalPages?<ButtonLink variant="secondary" href={driveListHref({...query,page:query.page+1})}>Next</ButtonLink>:null}
      </div>
    </nav>
  </div></CollegeDrivesCapture>;
}
