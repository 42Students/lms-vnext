import { Dropdown } from "@/components/ui/dropdown";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import {TpoDriveRequestActions} from "@/components/tpo/tpo-drive-request-actions";
import {TpoRemindNonApplicants} from "@/components/placements/tpo-remind-non-applicants";
import {TpoDriveCloneAction} from "@/components/placements/tpo-drive-clone-action";
import {TpoDriveSavedViews} from "@/components/placements/tpo-drive-saved-views";
import {TpoDriveActOnPanel} from "@/components/placements/tpo-drive-act-on-panel";
import {TpoBulkDriveDeadline} from "@/components/placements/tpo-bulk-drive-deadline";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert } from "@/components/ui/alert";
import {StatusBadge} from "@/components/ui/status-badge";
import {Tabs} from "@/components/ui/tabs";
import { AuthorizationError, can } from "@/modules/permissions/policy";
import { getTpoDriveLifecycleList } from "@/modules/placements/tpo-drive-lifecycle-list-service";
import {driveRequestStatusTone,driveRequestStatusLabel,TPO_REQUESTS_COPY,tpoDriveStatusLabel,tpoDriveStatusTone,tpoDriveWhereItIs,tpoDriveEmploymentLabel,tpoDriveWorkModeLabel} from "@/modules/placements/tpo-drive-lifecycle-list-model";
import {Select} from "@/components/ui/select";
import {listPlacementJobTypeChoices} from "@/modules/placements/tpo-configuration-read-service";
import {Input} from "@/components/ui/input";
import {Checkbox} from "@/components/ui/checkbox";
import {Button} from "@/components/ui/button";
import {TpoLifecycleRefreshAction,TpoLifecycleStaleSnapshot} from "@/components/placements/tpo-lifecycle-stale-snapshot";
import { Table } from "@/components/ui/table";
import { Heading } from "@/components/ui/heading";
import { TextLink } from "@/components/ui/text-link";
import { Label } from "@/components/ui/label";
import { Disclosure } from "@/components/ui/disclosure";
import { ButtonLink } from "@/components/ui/button-link";
import { istDayMonthYearFormatter, istDateFormatter, formatDateTimeIst } from "@/lib/format-date";
import { formatNumberIN } from "@/lib/safe-format";
import { createDateFormatter } from "@/lib/format-date";
import { formatDateWith } from "@/lib/format-date";
import { DEFAULT_TIME_ZONE } from "@/config/locale";
import { first } from "@/lib/shared";
type Search = { request?:string|string[]; cohortId?:string|string[];ownerUserId?:string|string[];companyId?:string|string[];seasonId?: string | string[]; view?: string | string[];tab?:string|string[];search?:string|string[];deadline?:string|string[];workMode?:string|string[];recruiterDriveMode?:string|string[];employmentType?:string|string[];jobTypeLabel?:string|string[];sort?:string|string[];minApplied?:string|string[];maxApplied?:string|string[];minOffers?:string|string[];maxOffers?:string|string[];payCategory?:string|string[];attention?:string|string[];journey?:string|string[];display?:string|string[];page?:string|string[] };
export default async function TpoDriveLifecyclePage({ searchParams }: { searchParams: Promise<Search> }) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !can(context,"placements.manage",{collegeId:context.membership.collegeId})) redirect("/dashboard");
  const params = await searchParams;
  if(params.request!==undefined&&(typeof params.request!=="string"||
     !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.request)))
    return <main className="min-w-0 space-y-4"><PageHeader title="Drive requests"/>
      <Alert tone="error">Invalid recruiter request selection. <TextLink href="/tpo/placements/lifecycle?view=REQUESTS">Reset</TextLink></Alert>
    </main>;

  // Legacy /tpo/drives links use ?tab=requests|drafts|live|closed.
  const oldTab=first(params.tab)?.trim().toLowerCase();
  const mappedTab: "REQUESTS"|"DRAFT"|"LIVE"|"CLOSED"|undefined=
    oldTab==="requests"?"REQUESTS":oldTab==="drafts"?"DRAFT":
    oldTab==="live"?"LIVE":oldTab==="closed"?"CLOSED":undefined;
  let data: Awaited<ReturnType<typeof getTpoDriveLifecycleList>>;
  const retryQuery=new URLSearchParams();
  for(const [key,value] of Object.entries(params)){
    const item=first(value);
    if(item && item.length<=100)retryQuery.set(key,item);
  }
  const retryHref="/tpo/placements/lifecycle"+(retryQuery.size?"?"+retryQuery.toString():"");
  // Do not reuse a drive snapshot across membership or filter changes.
  const snapshotKey=context.membership.id+":"+retryQuery.toString();
  try {
    data = await getTpoDriveLifecycleList(context, {
    ...(first(params.seasonId) ? { seasonId: first(params.seasonId) } : {}),
    ...(first(params.companyId)?{companyId:first(params.companyId)}:{}),
    ...(first(params.cohortId)?{cohortId:first(params.cohortId)}:{}),
    ...(first(params.ownerUserId)?{ownerUserId:first(params.ownerUserId)}:{}),
    ...(first(params.view) ? { view: first(params.view) } : mappedTab?{view:mappedTab}:{}),
    ...(first(params.search)?{search:first(params.search)}:{}),
    ...(first(params.deadline)?{deadline:first(params.deadline)}:{}),
    ...(first(params.workMode)?{workMode:first(params.workMode)}:{}),
    ...(first(params.recruiterDriveMode)?{recruiterDriveMode:first(params.recruiterDriveMode)}:{}),
    ...(first(params.employmentType)?{employmentType:first(params.employmentType)}:{}),
    ...(first(params.jobTypeLabel)?{jobTypeLabel:first(params.jobTypeLabel)}:{}),
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
  } catch (error) {
    // A revoked live TPO grant must reach the authenticated error boundary.
    // Never present retained private drives as a mere transient refresh failure.
    if (error instanceof AuthorizationError) throw error;
    return <TpoLifecycleStaleSnapshot key={snapshotKey} failed>
      <main className="min-w-0 space-y-4">
        <PageHeader eyebrow="TPO" title="Drives" />
        <Alert tone="error">Could not load drives.</Alert>
        <p className="text-sm text-muted-foreground">The drives were not loaded. Your filters are preserved.</p>
        <TpoLifecycleRefreshAction label="Retry" />
      </main>
    </TpoLifecycleStaleSnapshot>;
  }
  let jobTypes: Awaited<ReturnType<typeof listPlacementJobTypeChoices>>;
  let supportError=false;
  try { jobTypes=await listPlacementJobTypeChoices(context,context.membership.collegeId); }
  catch { jobTypes=[];supportError=true; }
  const requestPreview=data.view==="REQUESTS"?data:
    data.needsReviewCount>0?
      await getTpoDriveLifecycleList(context,{view:"REQUESTS",page:"1"}).catch(error=>{
        if(error instanceof AuthorizationError)throw error;
        return null;
      }):null;
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
    workMode:data.workMode,recruiterDriveMode:data.recruiterDriveMode,employmentType:data.employmentType,
    ...(data.jobTypeLabel?{jobTypeLabel:data.jobTypeLabel}:{}),
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
   ...(data.season?{seasonId:data.season.id}:{}),...(data.companyId?{companyId:data.companyId}:{}),...(data.cohortId?{cohortId:data.cohortId}:{}),...(data.ownerUserId?{ownerUserId:data.ownerUserId}:{}),view:data.view,search:data.search,deadline:data.deadline,workMode:data.workMode,recruiterDriveMode:data.recruiterDriveMode,employmentType:data.employmentType,
   ...(data.jobTypeLabel?{jobTypeLabel:data.jobTypeLabel}:{}),sort:data.sort,payCategory:data.payCategory,
   attention:data.attention,
   journey:data.journey,
   display:data.display,
   ...(data.minApplied!==undefined?{minApplied:data.minApplied}:{}),
   ...(data.maxApplied!==undefined?{maxApplied:data.maxApplied}:{}),
   ...(data.minOffers!==undefined?{minOffers:data.minOffers}:{}),
   ...(data.maxOffers!==undefined?{maxOffers:data.maxOffers}:{}),page,
  }};}
  const selectedDriveRequestId=typeof params.request==="string"?params.request:null;
  const selectedDriveRequest=data.requestsAvailable&&data.view==="REQUESTS"?
    selectedDriveRequestId?data.requestRows.find(row=>row.id===selectedDriveRequestId)??null:
    data.requestRows.find(row=>row.reviewRequired)??data.requestRows[0]??null:null;
  const requestHref=(id?:string)=>{
    const query=new URLSearchParams(retryQuery);
    query.set("view","REQUESTS");
    if(id)query.set("request",id);else query.delete("request");
    return "/tpo/placements/lifecycle?"+query.toString();
  };
  const advancedFiltersActive = Boolean(data.companyId || data.ownerUserId || data.deadline !== "ALL" ||
    data.journey !== "ALL" || data.workMode !== "ALL" || data.recruiterDriveMode !== "ALL" || data.employmentType !== "ALL" || Boolean(data.jobTypeLabel) ||
    data.payCategory !== "ALL" || data.display !== "DETAILED" || data.sort !== "COMPANY" ||
    data.minApplied !== undefined || data.maxApplied !== undefined ||
    data.minOffers !== undefined || data.maxOffers !== undefined);
  return <TpoLifecycleStaleSnapshot key={snapshotKey} failed={false}>
    <div className="min-w-0 space-y-4">
    <PageHeader eyebrow="TPO" title="Drives"
      description="Review requests, prepare drafts and run every placement drive from one workspace."
      actions={<>
        <TpoLifecycleRefreshAction />
        <Dropdown mobileSheet align="end" label="More drive actions" trigger="More">
          <nav aria-label="Drive navigation and exports" className="grid min-w-48 gap-1 text-sm">
            <ButtonLink variant="secondary" href="/tpo/placements/overview">Operations overview</ButtonLink>
            <ButtonLink variant="secondary" href="/tpo/placements/recorded-outside">Recorded outside · history</ButtonLink>
            <ButtonLink variant="secondary" href={exportHref("PAGE")}>Export shown page (CSV)</ButtonLink>
            <ButtonLink variant="secondary" href={exportHref("ALL")}>Export all matching drives (CSV)</ButtonLink>
          </nav>
        </Dropdown>
        <ButtonLink variant="primary" href="/tpo/placements/new" className="w-full md:w-auto"><span aria-hidden="true" className="mr-2 text-base font-bold">＋</span>Create drive</ButtonLink>
      </>} />
    {data.needsReviewCount>0?<section aria-label="Recruiters asked for a drive"
     data-testid="tpo.drives.request-cards" className="space-y-2">
     <Heading level={2} size="xs" className="uppercase tracking-wide text-muted-foreground">
      Recruiters asked for a drive · {data.needsReviewCount}
     </Heading>
     {requestPreview?.requestsAvailable?<div className="grid gap-3 md:grid-cols-2">
      {requestPreview.requestRows.filter(item=>item.reviewRequired).slice(0,2).map(item=>
       <article key={item.id} className="min-w-0 rounded-xl border border-warning-border bg-warning-subtle p-4">
        <div className="flex flex-wrap justify-between gap-2">
         <Heading level={3} className="text-foreground">{item.company} · {item.title}</Heading>
         <StatusBadge tone={driveRequestStatusTone(item.status)}>{driveRequestStatusLabel(item.status)}</StatusBadge>
        </div>
        <p className="mt-2 text-sm text-body">{item.recruiterEmail??"Recruiter contact unavailable"}
         {" · "}Asked {istDayMonthYearFormatter
          .format(new Date(item.createdAt))}</p>
        {item.accessEnded?<p className="mt-1 text-xs font-semibold text-warning-text">
         Recruiter access ended. The placement cell must complete the review.</p>:null}
        <ButtonLink variant="primary" href={"/tpo/placements/lifecycle?view=REQUESTS&page=1&request="+encodeURIComponent(item.id)}
         className="mt-3">
         Review request
        </ButtonLink>
       </article>)}
     </div>:<Alert tone="warning">Recruiter requests could not be loaded. The drive list is unaffected.
      <TextLink href="/tpo/placements/lifecycle?view=REQUESTS&page=1"
       className="ml-2 inline-flex min-h-11 items-center">Open requests</TextLink>
     </Alert>}
    </section>:null}
    <nav aria-label="Needs doing" className="flex flex-wrap gap-2">
      <span className="mr-2 self-center text-sm font-semibold">Needs doing:</span>
      <TextLink variant="bare" href="/tpo/placements/lifecycle?view=REQUESTS&page=1"
        aria-current={data.view==="REQUESTS"?"page":undefined}
        className={"inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border px-3 text-sm "+
         (data.view==="REQUESTS"?"border-primary bg-primary-subtle font-semibold":"border-border")}>
        Waiting for your review · {data.needsReviewCount}
      </TextLink>
      {([
       ["NO_APPLICANTS","Nobody has applied",data.attentionCounts.noApplicants],
       ["NO_DEADLINE","Live with no deadline",data.attentionCounts.noDeadline],
       ["DUE_SOON","Close in the next 7 days",data.attentionCounts.dueSoon],
       ["OVERDUE","Deadline passed, still open",data.attentionCounts.overdue],
       ["ALL","All drives",data.counts.total],
      ] as const).map(([attention,label,n])=><TextLink variant="bare" key={attention} href={{
        pathname:"/tpo/placements/lifecycle",query:{
          ...(data.season?{seasonId:data.season.id}:{}),
          attention:data.attention===attention?"ALL":attention,view:"ALL",page:1,
        },
       }} aria-current={data.attention===attention&&data.view==="ALL"?"page":undefined} className={"inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border px-3 text-sm "+
       (data.attention===attention?"border-primary bg-primary-subtle font-semibold":"border-border")}>
       {label} · {n}
      </TextLink>)}
    </nav>
    <Tabs ariaLabel="Drive status tabs" value={data.view} renderPanel={false}
      items={([["REQUESTS","Requests",data.needsReviewCount],["DRAFT","Drafts",data.statusCounts.drafts],
       ["LIVE","Live",data.statusCounts.live],["CLOSED","Closed",data.statusCounts.closed]] as const).map(([view,label,count])=>({
        value:view,label,count,href:"/tpo/placements/lifecycle?"+
         new URLSearchParams({view,search:"",page:"1"}).toString(),
       }))}/>
    <TextLink href="/tpo/placements/lifecycle?view=ALL" aria-current={data.view==="ALL"?"page":undefined}
      className="inline-flex min-h-9 items-center">All jobs · {data.statusCounts.all}</TextLink>
    <section aria-label="Active drive status pane" className="min-w-0 space-y-4 border-t border-[var(--lms-canvas-border)] pt-4">
    {/* The authenticated shell already supplies the one legacy white canvas:
        filters, table, and status tabs share this continuous surface. */}
    <form role="search" aria-label="placements lifecycle filters" action="/tpo/placements/lifecycle" method="get"
      className="min-w-0 space-y-3 border-b border-[var(--lms-canvas-border)] pb-4">
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <Label className="min-w-[180px] flex-1">Season
        <Select name="seasonId" defaultValue={data.season?.id ?? ""} disabled={!data.seasons.length}
          className="mt-[6px] block w-full">
          <option value="">All college seasons</option>
          {data.seasons.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      </Label>
      <Label className="min-w-[180px] flex-1 max-md:min-w-0 max-md:basis-full">Batch
        <Select name="cohortId" defaultValue={data.cohortId??""}
          className="mt-[6px] block w-full">
          <option value="">All batches</option>
          {data.batches.map(batch=><option key={batch.id} value={batch.id}>{batch.programName} · {batch.name}</option>)}
        </Select>
      </Label>

      <Label className="min-w-[180px] flex-1">Company or drive
       <Input name="search" defaultValue={data.search} maxLength={100}
        className="mt-[6px] block w-full"/>
      </Label>
      </div>
      <div className="flex min-w-0 flex-wrap items-start gap-3">
        <Disclosure title="Filters" defaultOpen={advancedFiltersActive} className="min-w-0 w-full flex-1 basis-full sm:basis-0">
          <div className="grid min-w-0 grid-cols-1 gap-3 pt-3 sm:grid-cols-2 lg:grid-cols-3">
          <Heading level={3} className="sm:col-span-2 lg:col-span-3 text-foreground">Drive</Heading>
      <Heading level={3} className="sm:col-span-2 lg:col-span-3 mt-2 text-foreground">People</Heading>
      <Label className="min-w-[180px] flex-1">Company
        <Select name="companyId" defaultValue={data.companyId??""}
          className="mt-[6px] block w-full">
          <option value="">All companies</option>
          {data.companies.map(company=><option key={company.id} value={company.id}>{company.name}</option>)}
        </Select>
      </Label>
      {data.view!=="REQUESTS"?<Label className="min-w-[180px] flex-1 max-md:min-w-0 max-md:basis-full">Created by
        <Select name="ownerUserId" defaultValue={data.ownerUserId??""}
          className="mt-[6px] block w-full">
          <option value="">Any creator</option>
          {data.owners.map(owner=><option key={owner.id} value={owner.id}>{owner.name??"College staff"}</option>)}
        </Select>
      </Label>:null}
      <Label className="min-w-[144px] flex-1 max-md:min-w-0 max-md:basis-full">Lifecycle
        <Select name="view" defaultValue={data.view}
          className="mt-[6px] block w-full">
          <option value="ALL">All jobs</option><option value="REQUESTS">Requests</option><option value="DRAFT">Drafts</option>
          <option value="LIVE">Live</option><option value="CLOSED">Closed</option>
        </Select>
      </Label>

      <Heading level={3} className="sm:col-span-2 lg:col-span-3 mt-2 text-foreground">Timing</Heading>
      <Label className="min-w-[144px] flex-1">Applications close
        <Select name="deadline" defaultValue={data.deadline} className="mt-[6px] block w-full">
          <option value="ALL">All deadlines</option>
          <option value="TODAY">Today (IST)</option>
          <option value="DUE_SOON">This week</option>
          <option value="LATER">Later than 7 days</option>
          <option value="OVERDUE">Passed</option><option value="UNSET">No deadline</option>
        </Select>
      </Label>
      <Label className="min-w-[144px] flex-1">Visible columns
        <Select name="display" defaultValue={data.display} className="mt-[6px] block w-full">
          <option value="DETAILED">Default columns</option><option value="COMPACT">Compact columns</option>
        </Select>
      </Label>
      <Label className="min-w-[144px] flex-1 max-md:min-w-0 max-md:basis-full">Where it is
        <Select name="journey" defaultValue={data.journey}
          className="mt-[6px] block w-full">
          <option value="ALL">Every stage</option>
          <option value="TAKING_APPLICATIONS">Taking applications</option>
          <option value="RUNNING_ROUNDS">Rounds in progress</option>
          <option value="OFFERS_ISSUED">Offers issued</option>
          <option value="COMPLETE">Closed or cancelled</option>
        </Select>
      </Label>
      <Label className="min-w-[144px] flex-1">Work mode
        <Select name="workMode" defaultValue={data.workMode} className="mt-[6px] block w-full">
          <option value="ALL">All modes</option><option value="ONSITE">On-site</option>
          <option value="REMOTE">Remote</option><option value="HYBRID">Hybrid</option>
        </Select>
      </Label>
      <Label className="min-w-[144px] flex-1">Drive mode
        <Select name="recruiterDriveMode" defaultValue={data.recruiterDriveMode} className="mt-[6px] block w-full">
          <option value="ALL">All drive modes</option>
          <option value="ON_CAMPUS">On campus</option>
          <option value="POOL">Pool campus</option>
          <option value="OFF_CAMPUS">Off campus</option>
        </Select>
      </Label>
      <Label className="min-w-[144px] flex-1">Job type
        <Select name="jobTypeLabel" defaultValue={data.jobTypeLabel??""} className="mt-[6px] block w-full">
          <option value="">All job types</option>
          {jobTypes.map(type=><option key={type.label} value={type.label}>{type.label}</option>)}
          {data.jobTypeLabel&&!jobTypes.some(type=>type.label===data.jobTypeLabel)?
            <option value={data.jobTypeLabel}>{data.jobTypeLabel} (historic)</option>:null}
        </Select>
        {data.employmentType!=="ALL"?<input type="hidden" name="employmentType" value={data.employmentType}/>:null}
      </Label>
      <Label className="min-w-[144px] flex-1">Sort drives
        <Select name="sort" defaultValue={data.sort} className="mt-[6px] block w-full">
          <option value="COMPANY">Company name</option><option value="DEADLINE_ASC">Earliest recorded deadline</option>
          <option value="DEADLINE_DESC">Latest recorded deadline</option>
        </Select>
      </Label>
      <Heading level={3} className="sm:col-span-2 lg:col-span-3 mt-2 text-foreground">Pay and response</Heading>
      <Label className="min-w-32 flex-1">Min. applied
        <Input name="minApplied" type="number" disabled={!data.countsAvailable} min={0} max={100000} defaultValue={data.minApplied??""}
          className="mt-[6px] block w-full"/>
      </Label>
      <Label className="min-w-32 flex-1">Max. applied
        <Input name="maxApplied" type="number" disabled={!data.countsAvailable} min={0} max={100000} defaultValue={data.maxApplied??""}
          className="mt-[6px] block w-full"/>
      </Label>
      <Label className="min-w-32 flex-1">Min. offers
        <Input name="minOffers" type="number" disabled={!data.countsAvailable} min={0} max={100000} defaultValue={data.minOffers??""}
          className="mt-[6px] block w-full"/>
      </Label>
      <Label className="min-w-32 flex-1">Max. offers
        <Input name="maxOffers" type="number" disabled={!data.countsAvailable} min={0} max={100000} defaultValue={data.maxOffers??""}
          className="mt-[6px] block w-full"/>
      </Label>
      <Label className="min-w-[144px] flex-1 max-md:min-w-0 max-md:basis-full">Pay category
        <Select name="payCategory" defaultValue={data.payCategory}
          className="mt-[6px] block w-full">
          <option value="ALL">All categories</option><option value="REGULAR">Regular</option>
          <option value="DREAM">Dream</option>
        </Select>
      </Label>

          </div>
        </Disclosure>
        <Button type="submit" className="w-full sm:w-auto">Apply</Button>
      </div>
    </form>
    {!data.countsAvailable?<Alert tone="warning">Could not load applicant and pipeline counts. Count-dependent filters are unavailable; the drive list remains accessible. Refresh to retry.</Alert>:null}
    {supportError?<Alert tone="warning">Job type filters are unavailable. The drive list remains available; retry to load the missing filter choices. <TextLink href={retryHref} className="ml-2 inline-flex min-h-11 items-center md:min-h-9">Retry missing data</TextLink></Alert>:null}
    <TpoDriveSavedViews scopeKey={savedViewScope}/>

    {data.view==="REQUESTS" ? (!data.requestsAvailable ?
      <EmptyState title={TPO_REQUESTS_COPY.tab} description={TPO_REQUESTS_COPY.unavailable}
        action={<TextLink href="/tpo/placements/overview" className="inline-flex min-h-11 items-center text-sm md:min-h-9">Operations overview</TextLink>}/> :
      <section aria-label="Recruiter drive requests" className="space-y-3">
        <p role="status" className="text-sm leading-[1.6]">{data.totalMatching} recruiter drive requests</p>
        {data.requestRows.length>0?<div className="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(250px,350px)_minmax(0,1fr)]" data-testid="tpo.drives.prototype-request-review">
         <aside className="min-w-0 overflow-hidden rounded-xl border border-border bg-surface" aria-label="Recruiter drive request queue">
          <Heading level={3} size="xs" className="border-b border-border px-4 py-3 uppercase tracking-wide text-muted-foreground">Recruiters asked for a drive</Heading>
          <ul className="divide-y divide-border">{data.requestRows.map(item=><li key={item.id}>
           <TextLink variant="bare" href={requestHref(item.id)} aria-current={selectedDriveRequest?.id===item.id?"page":undefined}
            className={"block min-h-11 px-4 py-3 hover:bg-primary-subtle "+(selectedDriveRequest?.id===item.id?
             "border-l-2 border-primary bg-primary-subtle":"")}>
            <strong className="block break-words text-sm text-foreground">{item.company} · {item.title}</strong>
            <span className="mt-1 block text-xs text-body">{driveRequestStatusLabel(item.status)} ·
             {" "}{createDateFormatter("en-IN", {timeZone:DEFAULT_TIME_ZONE,day:"numeric",month:"short"}).format(new Date(item.createdAt))}</span>
           </TextLink>
          </li>)}</ul>
         </aside>
         <section aria-label="Selected recruiter drive request" className="min-w-0 rounded-xl border border-border bg-surface">
          {selectedDriveRequest?<><header className="border-b border-border p-4">
           <TextLink href="/tpo/placements/lifecycle?view=REQUESTS" className="inline-flex min-h-11 items-center text-xs md:min-h-9">Back to requests</TextLink>
           <p className="mt-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">A recruiter asked for a drive</p>
           <Heading level={2} size="xl" className="mt-1 break-words text-foreground">{selectedDriveRequest.company} · {selectedDriveRequest.title}</Heading>
           <p className="mt-1 text-sm text-body">Requested {istDateFormatter.format(new Date(selectedDriveRequest.createdAt))} · {driveRequestStatusLabel(selectedDriveRequest.status)}</p>
          </header>
          <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_270px]">
           <div className="min-w-0 space-y-3">
            <Heading level={3} size="xs" className="uppercase tracking-wide text-muted-foreground">What they asked for · checked for you</Heading>
            <dl className="divide-y divide-border text-sm">
             {([
              ["Role",selectedDriveRequest.title],["Company",selectedDriveRequest.company],
              ["Recruiter email",selectedDriveRequest.recruiterEmail??"Not recorded"],
              ["Recruiter phone",selectedDriveRequest.recruiterPhone??"Not recorded"],
              ["Verification",selectedDriveRequest.verificationStatus],
             ] as const).map(([label,value])=><div key={label} className="grid grid-cols-[130px_minmax(0,1fr)] gap-2 py-3">
              <dt className="text-body">{label}</dt><dd className="min-w-0 break-words font-semibold text-foreground">{value}</dd>
             </div>)}
            </dl>
            {selectedDriveRequest.changes?<section className="space-y-2">
             <Heading level={3} size="xs" className="uppercase tracking-wide text-muted-foreground">What changed since the previous request</Heading>
             {selectedDriveRequest.changes.filter(change=>change.changed).length===0?
              <p className="text-sm text-body">No changes in the compared categories.</p>:
              <dl className="divide-y divide-border">{selectedDriveRequest.changes.filter(change=>change.changed).map(change=>
               <div key={change.label} className="py-3 text-sm">
                <dt className="font-semibold">{change.label}</dt>
                <dd className="mt-1 break-words text-body">Before: {change.before||"Not provided"} · Now: {change.after||"Not provided"}</dd>
               </div>)}</dl>}
            </section>:null}
            <p className="text-xs leading-5 text-muted-foreground">Eligibility, pay, dates and student fit must be verified in the draft before publishing. This preview does not infer a learner audience.</p>
           </div>
           <aside className="min-w-0 space-y-3 rounded-lg border border-border p-4" aria-label="Your answer">
            <Heading level={3} size="lg">Your answer</Heading>
            {selectedDriveRequest.accessEnded?<Alert tone="warning">Recruiter access ended. Finish the review as the placement cell.</Alert>:null}
            {selectedDriveRequest.status==="REQUEST"||selectedDriveRequest.status==="SENT_BACK"?
             <><p className="text-sm text-body">Approve creates an unpublished draft. You can review dates, eligibility and audience before separately publishing.</p>
              <TpoDriveRequestActions requestId={selectedDriveRequest.id} status={selectedDriveRequest.status}/>
             </>:selectedDriveRequest.approvedJobId?
              <ButtonLink variant="primary" href={"/tpo/placements/jobs/"+selectedDriveRequest.approvedJobId}>Review unpublished draft</ButtonLink>:
              <p className="text-sm text-body">This request has already been decided.</p>}
            <p className="border-t border-border pt-3 text-xs leading-5 text-muted-foreground">Your decision is version checked, recorded in the audit history, and notified in-app. No recruiter email is assumed delivered.</p>
           </aside>
          </div></>:<div role="status" className="space-y-3 p-5">
           <Heading level={3}>This request is not on the current authorized page.</Heading>
           <p className="text-sm text-body">No other request was substituted. Return to the queue or change pages.</p>
           <TextLink href={requestHref()} className="inline-flex min-h-11 items-center">Clear selection</TextLink>
          </div>}
         </section>
        </div>:null}
        <Disclosure title="Advanced recruiter request list and change history">
         <div className="pt-3">
        {data.requestRows.length===0?<EmptyState title="No drive requests waiting" description="No recruiter drive requests need review."
            action={<TextLink href="/tpo/placements/lifecycle?view=DRAFT" className="inline-flex min-h-11 items-center text-sm md:min-h-9">Drafts</TextLink>}/>:
          data.requestRows.map(item=><article key={item.id} className="border-b border-border py-4">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <Heading level={2} className="min-w-0 break-words">{item.company} · {item.title}</Heading>
              <StatusBadge tone={driveRequestStatusTone(item.status)}>{driveRequestStatusLabel(item.status)}</StatusBadge>
            </div>
            <p className="text-xs text-muted-foreground">Request ID: {item.id}</p>
            <section aria-label="Recruiter contact" className="mt-2 space-y-1 text-sm">
             <Heading level={3}>Recruiter</Heading>
             <p>Email: {item.recruiterEmail??"Not recorded"} · Phone: {item.recruiterPhone??"Not recorded"}</p>
             {item.verificationStatus!=="VERIFIED"?<p className="text-[var(--lms-gold-accent)]">Unverified</p>:null}
             {item.accessEnded?<Alert tone="error">Recruiter access ended. Finish this drive yourself.</Alert>:null}
             <TextLink href={"/tpo/recruiters?search="+encodeURIComponent(item.recruiterEmail??"")}>Open recruiter</TextLink>
            </section>
            {item.changes?<Disclosure title="What changed since the last request" ariaLabel="What changed since the last request" className="mt-3">
              <div className="space-y-2 pb-2">
              {!item.changes.some(change=>change.changed)?<p>Nothing that we compare changed.</p>:
               <dl className="grid gap-2">{item.changes.filter(change=>change.changed).map(change=><div key={change.label} className="border-b border-border py-2">
                <dt className="font-semibold">{change.label}</dt>
                <dd>Before: {change.before||"Not provided"}</dd>
                <dd>Now: {change.after||"Not provided"}</dd>
               </div>)}</dl>}
              </div>
            </Disclosure>:null}
            {item.status==="REQUEST"||item.status==="SENT_BACK"?
              <TpoDriveRequestActions requestId={item.id} status={item.status}/>:
              item.approvedJobId?<TextLink href={"/tpo/placements/jobs/"+item.approvedJobId}>Open draft</TextLink>:null}
          </article>)}
         </div>
        </Disclosure>
        <nav aria-label="Drive request pagination" className="flex justify-between">
          {data.page>1?<TextLink href={pageHref(data.page-1)} className="inline-flex min-h-11 items-center md:min-h-9">Previous</TextLink>:<span/>}
          {data.page<data.totalPages?<TextLink href={pageHref(data.page+1)} className="inline-flex min-h-11 items-center md:min-h-9">Next</TextLink>:null}
        </nav>
      </section>
    ) : <>
      <section aria-label="Drive lifecycle counts" className="grid min-w-0 grid-cols-1 gap-0 border-y border-[var(--lms-canvas-border)] md:grid-cols-4">
        {metrics.map(([name,n]) =>
          <div key={name} className="min-w-0 border-b border-[var(--lms-canvas-border)] px-[var(--lms-space-4)] py-[var(--lms-space-3)] md:border-b-0 md:border-r md:last:border-r-0">
            <p className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">{name}</p>
            <p className="mt-2 text-[24px] font-semibold leading-[1.3] tabular-nums text-[var(--lms-heading)]">{n}</p>
          </div>)}
      </section>
      <p className="text-sm text-body">Requests are tracked separately from drafts and published drives.</p>
      <p role="status" className="text-sm text-body leading-[1.6]">{data.totalMatching} matching drives · Page {data.page} of {data.totalPages}.
       Counts cover the selected college season (or all seasons) and search across every page.</p>
      {data.rows.length === 0 ?
        <div className="space-y-3">
          <EmptyState
            title={data.view==="LIVE"?"No live drives yet":
             data.view==="DRAFT"?"No draft drives yet":
             data.view==="CLOSED"?"No closed drives yet":"No drives found."}
            description={data.view==="LIVE"?"Published opportunities appear here once ready.":
             data.view==="DRAFT"?"Create a drive to start planning the next hiring opportunity.":
             data.view==="CLOSED"?"Completed and cancelled opportunities appear here.":
              "No non-archived jobs match the selected season and filters."} action={<ButtonLink variant="secondary" href="/tpo/placements/new" className="w-full sm:w-auto">Create drive</ButtonLink>} />

        </div> :
        <div className="min-w-0 space-y-3">
         <div className="min-w-0 overflow-x-auto rounded-xl border border-border bg-surface" role="region"
          aria-label="Prototype drive operations table" data-testid="tpo.drives.prototype-list" tabIndex={0}>
          <Table className="min-w-[860px]">
           <thead><tr className="bg-surface-secondary text-xs font-bold uppercase tracking-wide text-muted-foreground">
            <th scope="col" className="w-[27%] px-4 py-3">Drive</th>
            <th scope="col" className="w-[27%] px-4 py-3">Where it is</th>
            <th scope="col" className="w-[21%] px-4 py-3">Next</th>
            <th scope="col" className="w-[17%] px-4 py-3">Needs you</th>
            <th scope="col" className="w-[8%] px-4 py-3">Who</th>
           </tr></thead>
           <tbody className="divide-y divide-border">{data.rows.map(job=>{
            const href="/tpo/placements/jobs/"+encodeURIComponent(job.id);
            const next=job.nextRoundAt?new Date(job.nextRoundAt):null;
            const nextEvent=next&&Number.isFinite(next.getTime())?
             "Next round "+formatDateWith(next, "en-IN", {timeZone:DEFAULT_TIME_ZONE,day:"numeric",month:"short",hour:"numeric",minute:"2-digit"}):
             job.applicationDeadline&&new Date(job.applicationDeadline).getTime()>new Date(data.asOf).getTime()?
              "Applications close "+formatDateWith(new Date(job.applicationDeadline), "en-IN", {timeZone:DEFAULT_TIME_ZONE,day:"numeric",month:"short"}):
             job.offersMade>0?"Review recorded offers":"No next event recorded";
            const task=job.status==="PUBLISHED"&&!job.applicationDeadline?
             {label:"Set a deadline",href:href+"/extend-deadline"}:
             job.status==="PUBLISHED"&&job.offersMade>0?
              {label:"Review offers",href:href+"/offers"}:
             job.status==="PUBLISHED"&&job.roundCount>job.roundsCompleted?
              {label:"Review rounds",href:href+"/rounds"}:
             job.status==="DRAFT"?{label:"Review draft",href}:null;
            return <tr key={job.id} className="hover:bg-primary-subtle">
             <td className="px-4 py-3 align-top">
              <TextLink href={href} className="inline-flex min-h-11 items-center break-words text-foreground md:min-h-9">{job.company}</TextLink>
              <p className="text-xs leading-5 text-body">{job.title} · {job.minimumAnnualCtcInr!=null?
               formatNumberIN((job.minimumAnnualCtcInr/100000))+" LPA":"CTC not recorded"}</p>
              <p className="mt-1 text-xs text-muted-foreground">{job.jobTypeLabel??tpoDriveEmploymentLabel(job.employmentType)}
               {job.isDream?" · Dream":""}</p>
             </td>
             <td className="px-4 py-3 align-top">
              <p className="font-semibold tabular-nums text-foreground">{job.appliedCount??"—"} applied
               {" · "}{job.roundsCompleted} of {job.roundCount} rounds
               {" · "}{job.offersMade} offers</p>
              <p className="mt-1 text-xs text-body">{tpoDriveWhereItIs(job,data.asOf)}</p>
             </td>
             <td className="px-4 py-3 align-top"><p className="font-semibold text-foreground">{nextEvent}</p>
              <p className="mt-1 text-xs text-body">{tpoDriveStatusLabel(job.status)}</p>
             </td>
             <td className="px-4 py-3 align-top">{task?
              <ButtonLink variant="secondary" href={task.href}>{task.label}</ButtonLink>:
              <span className="text-xs text-muted-foreground">Nothing recorded as due</span>}
             </td>
             <td className="px-4 py-3 align-top text-xs text-body">{job.createdBy??"College staff"}</td>
            </tr>;
           })}</tbody>
          </Table>
         </div>
         <p className="text-xs leading-5 text-muted-foreground">
          Ordered and filtered through the same authorized lifecycle query. Counts are recorded application, round and offer facts, not inferred shortlist totals.
          <TextLink href="/tpo/placements/recorded-outside" className="ml-1">Record an outside drive</TextLink>.
         </p>
         <Disclosure title="Advanced drive table, bulk actions and exports" className="min-w-0">
          <div className="min-w-0 pt-3">
        <form action="/api/placements/tpo/drives/export" method="get" aria-label="Selected drive export" className="grid gap-3">
          {Array.from(exportParams.entries()).map(([key,value])=><Input type="hidden" key={key} name={key} value={value}/>)}
          <Input type="hidden" name="scope" value="SELECTED"/>
          <p className="text-sm text-body">Select up to 25 drives shown on this page to export or act on those rows. Closing or cancelling requires a separate server-verified preview and confirmation.</p>
          <div className="min-w-0 overflow-x-auto rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)]" role="region"
            aria-label="Drives data table" tabIndex={0}>
            <Table className="min-w-[1152px]">
              <caption className="sr-only">Drives in the selected status tab. Scroll horizontally for all columns and drive actions.</caption>
              <thead className="bg-[var(--lms-neutral-50)] text-[13px] font-semibold text-[var(--lms-neutral-400)]">
                <tr className="border-b border-[var(--lms-canvas-border)]">
                  <th scope="col" aria-sort={data.sort==="COMPANY"?"ascending":"none"} className="min-w-[212px] px-3 py-3">
                    <TextLink href={{...pageHref(1),query:{...pageHref(1).query,sort:"COMPANY"}}}>Drive</TextLink>
                  </th>
                  <th scope="col" className="min-w-[160px] px-3 py-3">Where it is</th>
                  <th scope="col" className="min-w-[112px] px-3 py-3">Mode</th>
                  {data.display==="DETAILED"?<th scope="col" className="min-w-[120px] px-3 py-3">Owner</th>:null}
                  <th scope="col" className="min-w-[120px] px-3 py-3">Job type</th>
                  {data.display==="DETAILED"?<th scope="col" className="min-w-[124px] px-3 py-3">Pay</th>:null}
                  <th scope="col" className="px-3 py-3 text-right">Applied</th>
                  <th scope="col" aria-sort={data.sort==="DEADLINE_ASC"?"ascending":data.sort==="DEADLINE_DESC"?"descending":"none"}
                    className="min-w-[160px] px-3 py-3">
                    <TextLink href={{...pageHref(1),query:{...pageHref(1).query,
                      sort:data.sort==="DEADLINE_ASC"?"DEADLINE_DESC":"DEADLINE_ASC"}}}>Deadline</TextLink>
                  </th>
                  <th scope="col" className="px-3 py-3">Status</th>
                  <th scope="col" className="min-w-[192px] px-3 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--lms-canvas-border)]">
              {data.rows.map(job=><tr key={job.id} className="align-top hover:bg-[var(--lms-neutral-50)]">
                <td className="px-3 py-3">
                  <div className="flex min-w-0 items-start gap-2">
                    <Checkbox name="ids" value={job.id} aria-label={"Select "+job.company+" "+job.title}/>
                    <div className="min-w-0">
                      <TextLink href={"/tpo/placements/jobs/"+job.id}>{job.company} · {job.title}</TextLink>
                      <p className="mt-1 text-xs text-muted-foreground">{job.roundsCompleted} of {job.roundCount} rounds · {job.offersMade} offers</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">{tpoDriveWhereItIs(job,data.asOf)}</td>
                <td className="px-3 py-3">
                  {job.recruiterDriveMode==="ON_CAMPUS"?"On campus":
                   job.recruiterDriveMode==="POOL"?"Pool campus":
                   job.recruiterDriveMode==="OFF_CAMPUS"?"Off campus":"Not recorded"}
                  <span className="mt-1 block text-xs text-muted-foreground">Work: {tpoDriveWorkModeLabel(job.workMode)}</span>
                </td>
                {data.display==="DETAILED"?<td className="px-3 py-3">{job.createdBy??"College staff"}</td>:null}
                <td className="px-3 py-3">{job.jobTypeLabel??tpoDriveEmploymentLabel(job.employmentType)}</td>
                {data.display==="DETAILED"?<td className="px-3 py-3">
                  {job.minimumAnnualCtcInr==null&&job.maximumAnnualCtcInr==null?"Not recorded":
                   "₹"+(job.minimumAnnualCtcInr!=null?formatNumberIN((job.minimumAnnualCtcInr/100000)):"—")+
                   (job.maximumAnnualCtcInr!=null?"–"+formatNumberIN((job.maximumAnnualCtcInr/100000)):"")+" LPA"}
                  {job.isDream?<span className="mt-1 block text-xs">Dream</span>:null}
                  {job.stipendPerMonthInr!=null?<span className="mt-1 block text-xs">₹{formatNumberIN(job.stipendPerMonthInr)}/month</span>:null}
                </td>:null}
                <td className="px-3 py-3 text-right tabular-nums">{job.appliedCount??"Unknown"}</td>
                <td className="px-3 py-3">
                  {job.applicationDeadline?formatDateTimeIst(new Date(job.applicationDeadline))+" IST":"No deadline"}
                </td>
                <td className="px-3 py-3"><StatusBadge tone={tpoDriveStatusTone(job.status)}>{tpoDriveStatusLabel(job.status)}</StatusBadge></td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <ButtonLink variant="secondary" href={"/tpo/placements/jobs/"+job.id}>Open drive</ButtonLink>
                <Dropdown mobileSheet align="end" label={"More for "+job.company} trigger="···">
                   <nav aria-label={"Drive links for "+job.title} className="min-w-48 space-y-1">
                    <ButtonLink variant="secondary" href={"/tpo/placements/jobs/"+job.id+"/applicants"}>Applicants</ButtonLink>
                    <ButtonLink variant="secondary" href={"/tpo/placements/jobs/"+job.id+"/rounds"}>Rounds and schedule</ButtonLink>
                    <ButtonLink variant="secondary" href={"/tpo/placements/jobs/"+job.id+"/offers"}>Offers</ButtonLink>
                    <ButtonLink variant="secondary"
                      href={"/tpo/placements/jobs/"+job.id+"/applications-export"}>Export applicants</ButtonLink>
                    <ButtonLink variant="secondary"
                      href={"/tpo/placements/jobs/"+job.id+"/share-preview"}>Share with company</ButtonLink>
                    {job.status==="PUBLISHED"?<ButtonLink variant="secondary"
                      className="block"
                      href={"/tpo/placements/jobs/"+job.id+"/extend-deadline"}>
                      Set or extend deadline
                    </ButtonLink>:null}
                    {job.status==="PUBLISHED"?<ButtonLink variant="secondary"
                      className="block"
                      href={"/tpo/placements/jobs/"+job.id+"/close-preview"}>
                      Review and close drive
                    </ButtonLink>:null}
                    {job.status==="PUBLISHED" && !job.recordedOutside &&
                      !!job.applicationDeadline && job.applicationDeadline>data.asOf
                      ?<TpoRemindNonApplicants jobId={job.id}/>:null}
                    {["CLOSED","CANCELLED"].includes(job.status)?<TpoDriveCloneAction jobId={job.id}/>:null}
                  </nav>
                </Dropdown>
                  </div>
                  {job.status==="PUBLISHED"&&(job.recordedOutside||!job.applicationDeadline||job.applicationDeadline<=data.asOf)?
                    <p className="mt-1 text-xs text-muted-foreground">Reminder unavailable: outside drive or deadline passed/unset.</p>:null}
                </td>
              </tr>)}
              </tbody>
            </Table>
          </div>
          <div className="flex flex-wrap items-start gap-3">
          <Button variant="secondary" type="submit" className="justify-self-start">
            Export selected drives (CSV)
          </Button>
           <TpoDriveActOnPanel/>
           <TpoBulkDriveDeadline totalMatching={data.totalMatching}/>
          </div>
        </form>
          </div>
         </Disclosure>
        </div>}
      <nav aria-label="Drive pages" className="flex flex-wrap items-center justify-between gap-3">
       {data.page>1?<ButtonLink variant="secondary" href={pageHref(data.page-1)}>Previous</ButtonLink>:<span/>}
       {data.page<data.totalPages?<ButtonLink variant="secondary" href={pageHref(data.page+1)}>Next</ButtonLink>:null}
      </nav>
    </>}
    </section>
    </div>
  </TpoLifecycleStaleSnapshot>;
}
