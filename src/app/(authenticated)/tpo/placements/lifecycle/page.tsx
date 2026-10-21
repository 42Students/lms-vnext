import Link from "next/link";
import { Dropdown } from "@/components/ui/dropdown";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import {TpoDriveRequestActions} from "@/components/tpo/tpo-drive-request-actions";
import {TpoRemindNonApplicants} from "@/components/placements/tpo-remind-non-applicants";
import {TpoDriveCloneAction} from "@/components/placements/tpo-drive-clone-action";
import {TpoDriveSavedViews} from "@/components/placements/tpo-drive-saved-views";
import {TpoDriveActOnPanel} from "@/components/placements/tpo-drive-act-on-panel";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert } from "@/components/ui/alert";
import {StatusBadge} from "@/components/ui/status-badge";
import {Tabs} from "@/components/ui/tabs";
import { can } from "@/modules/permissions/policy";
import { getTpoDriveLifecycleList } from "@/modules/placements/tpo-drive-lifecycle-list-service";
import {driveRequestStatusTone,driveRequestStatusLabel,TPO_REQUESTS_COPY,tpoDriveStatusLabel,tpoDriveStatusTone,tpoDriveWhereItIs,tpoDriveEmploymentLabel,tpoDriveWorkModeLabel} from "@/modules/placements/tpo-drive-lifecycle-list-model";
import {Select} from "@/components/ui/select";
import {listPlacementJobTypeChoices} from "@/modules/placements/tpo-configuration-read-service";
import {Input} from "@/components/ui/input";
import {Checkbox} from "@/components/ui/checkbox";
import {Button} from "@/components/ui/button";
type Search = { cohortId?:string|string[];ownerUserId?:string|string[];companyId?:string|string[];seasonId?: string | string[]; view?: string | string[];tab?:string|string[];search?:string|string[];deadline?:string|string[];workMode?:string|string[];recruiterDriveMode?:string|string[];employmentType?:string|string[];jobTypeLabel?:string|string[];sort?:string|string[];minApplied?:string|string[];maxApplied?:string|string[];minOffers?:string|string[];maxOffers?:string|string[];payCategory?:string|string[];attention?:string|string[];journey?:string|string[];display?:string|string[];page?:string|string[] };
function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
export default async function TpoDriveLifecyclePage({ searchParams }: { searchParams: Promise<Search> }) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !can(context,"placements.manage",{collegeId:context.membership.collegeId})) redirect("/dashboard");
  const params = await searchParams;
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
  } catch {
    return <main className="min-w-0 space-y-4">
      <PageHeader eyebrow="TPO" title="Drives" />
      <Alert tone="error">Could not load drives.</Alert>
      <p className="text-sm text-muted-foreground">The drives were not loaded. Your filters are preserved.</p>
      <a href={retryHref} className="inline-flex min-h-11 items-center font-semibold text-primary-text underline underline-offset-4 md:min-h-9">Retry</a>
    </main>;
  }
  let jobTypes: Awaited<ReturnType<typeof listPlacementJobTypeChoices>>;
  let supportError=false;
  try { jobTypes=await listPlacementJobTypeChoices(context,context.membership.collegeId); }
  catch { jobTypes=[];supportError=true; }
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
  const advancedFiltersActive = Boolean(data.companyId || data.ownerUserId || data.deadline !== "ALL" ||
    data.journey !== "ALL" || data.workMode !== "ALL" || data.recruiterDriveMode !== "ALL" || data.employmentType !== "ALL" || Boolean(data.jobTypeLabel) ||
    data.payCategory !== "ALL" || data.display !== "DETAILED" || data.sort !== "COMPANY" ||
    data.minApplied !== undefined || data.maxApplied !== undefined ||
    data.minOffers !== undefined || data.maxOffers !== undefined);
  return <div className="min-w-0 space-y-4">
    <PageHeader eyebrow="TPO" title="Drives"
      description="Review requests, prepare drafts and run every placement drive from one workspace."
      actions={<>
        <Dropdown mobileSheet align="end" label="More drive actions" trigger="More">
          <nav aria-label="Drive navigation and exports" className="grid min-w-48 gap-1 text-sm">
            <Link href="/tpo/placements/overview" className="rounded-[var(--lms-control-radius)] px-3 py-2 font-semibold text-primary-text hover:bg-primary-subtle">Operations overview</Link>
            <Link href="/tpo/placements/recorded-outside" className="rounded-[var(--lms-control-radius)] px-3 py-2 font-semibold text-primary-text hover:bg-primary-subtle">Recorded outside · history</Link>
            <Link href={exportHref("PAGE")} className="rounded-[var(--lms-control-radius)] px-3 py-2 font-semibold text-primary-text hover:bg-primary-subtle">Export shown page (CSV)</Link>
            <Link href={exportHref("ALL")} className="rounded-[var(--lms-control-radius)] px-3 py-2 font-semibold text-primary-text hover:bg-primary-subtle">Export all matching drives (CSV)</Link>
          </nav>
        </Dropdown>
        <Link href="/tpo/placements/new" className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-button-primary)] bg-[var(--lms-button-primary)] px-4 text-sm font-[650] text-[var(--lms-on-primary)] hover:border-[var(--lms-button-primary-hover)] hover:bg-[var(--lms-button-primary-hover)] focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[rgba(38,186,199,0.35)] md:min-h-9 md:w-auto"><span aria-hidden="true" className="mr-2 text-base font-bold">＋</span>Create drive</Link>
      </>} />
    <nav aria-label="Needs doing" className="flex flex-wrap gap-2">
      <span className="mr-2 self-center text-sm font-semibold">Needs doing:</span>
      <Link href="/tpo/placements/lifecycle?view=REQUESTS&page=1"
        aria-current={data.view==="REQUESTS"?"page":undefined}
        className={"inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border px-3 text-sm "+
         (data.view==="REQUESTS"?"border-primary bg-primary-subtle font-semibold":"border-border")}>
        Waiting for your review · {data.needsReviewCount}
      </Link>
      {([
       ["NO_APPLICANTS","Nobody has applied",data.attentionCounts.noApplicants],
       ["NO_DEADLINE","Live with no deadline",data.attentionCounts.noDeadline],
       ["DUE_SOON","Close in the next 7 days",data.attentionCounts.dueSoon],
       ["OVERDUE","Deadline passed, still open",data.attentionCounts.overdue],
       ["ALL","All drives",data.counts.total],
      ] as const).map(([attention,label,n])=><Link key={attention} href={{
        pathname:"/tpo/placements/lifecycle",query:{
          ...(data.season?{seasonId:data.season.id}:{}),
          attention:data.attention===attention?"ALL":attention,view:"ALL",page:1,
        },
       }} aria-current={data.attention===attention&&data.view==="ALL"?"page":undefined} className={"inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border px-3 text-sm "+
       (data.attention===attention?"border-primary bg-primary-subtle font-semibold":"border-border")}>
       {label} · {n}
      </Link>)}
    </nav>
    <Tabs ariaLabel="Drive status tabs" value={data.view} renderPanel={false}
      items={([["REQUESTS","Requests",data.needsReviewCount],["DRAFT","Drafts",data.statusCounts.drafts],
       ["LIVE","Live",data.statusCounts.live],["CLOSED","Closed",data.statusCounts.closed]] as const).map(([view,label,count])=>({
        value:view,label,count,href:"/tpo/placements/lifecycle?"+
         new URLSearchParams({view,search:"",page:"1"}).toString(),
       }))}/>
    <Link href="/tpo/placements/lifecycle?view=ALL" aria-current={data.view==="ALL"?"page":undefined}
      className="inline-flex min-h-9 items-center font-semibold text-link underline">All jobs · {data.statusCounts.all}</Link>
    <section aria-label="Active drive status pane" className="min-w-0 space-y-4 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] p-3 sm:p-4">
    <form role="search" aria-label="placements lifecycle filters" action="/tpo/placements/lifecycle" method="get"
      className="min-w-0 space-y-3 border-b border-[var(--lms-canvas-border)] pb-4">
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <label className="min-w-[180px] flex-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Season
        <Select name="seasonId" defaultValue={data.season?.id ?? ""} disabled={!data.seasons.length}
          className="mt-[6px] block w-full">
          <option value="">All college seasons</option>
          {data.seasons.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      </label>
      <label className="min-w-[180px] flex-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] max-[767px]:min-w-0 max-[767px]:basis-full">Batch
        <Select name="cohortId" defaultValue={data.cohortId??""}
          className="mt-[6px] block w-full">
          <option value="">All batches</option>
          {data.batches.map(batch=><option key={batch.id} value={batch.id}>{batch.programName} · {batch.name}</option>)}
        </Select>
      </label>

      <label className="min-w-[180px] flex-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Company or drive
       <Input name="search" defaultValue={data.search} maxLength={100}
        className="mt-[6px] block w-full"/>
      </label>
      </div>
      <div className="flex min-w-0 flex-wrap items-start gap-3">
        <details open={advancedFiltersActive} className="min-w-0 w-full flex-1 basis-full sm:basis-0">
          <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold text-primary-text md:min-h-9">Filters</summary>
          <div className="grid min-w-0 grid-cols-1 gap-3 pt-3 sm:grid-cols-2 lg:grid-cols-3">
          <h3 className="sm:col-span-2 lg:col-span-3 font-semibold text-foreground">Drive</h3>
      <h3 className="sm:col-span-2 lg:col-span-3 mt-2 font-semibold text-foreground">People</h3>
      <label className="min-w-[180px] flex-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Company
        <Select name="companyId" defaultValue={data.companyId??""}
          className="mt-[6px] block w-full">
          <option value="">All companies</option>
          {data.companies.map(company=><option key={company.id} value={company.id}>{company.name}</option>)}
        </Select>
      </label>
      {data.view!=="REQUESTS"?<label className="min-w-[180px] flex-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] max-[767px]:min-w-0 max-[767px]:basis-full">Created by
        <Select name="ownerUserId" defaultValue={data.ownerUserId??""}
          className="mt-[6px] block w-full">
          <option value="">Any creator</option>
          {data.owners.map(owner=><option key={owner.id} value={owner.id}>{owner.name??"College staff"}</option>)}
        </Select>
      </label>:null}
      <label className="min-w-[144px] flex-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] max-[767px]:min-w-0 max-[767px]:basis-full">Lifecycle
        <Select name="view" defaultValue={data.view}
          className="mt-[6px] block w-full">
          <option value="ALL">All jobs</option><option value="REQUESTS">Requests</option><option value="DRAFT">Drafts</option>
          <option value="LIVE">Live</option><option value="CLOSED">Closed</option>
        </Select>
      </label>

      <h3 className="sm:col-span-2 lg:col-span-3 mt-2 font-semibold text-foreground">Timing</h3>
      <label className="min-w-[144px] flex-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Applications close
        <Select name="deadline" defaultValue={data.deadline} className="mt-[6px] block w-full">
          <option value="ALL">All deadlines</option>
          <option value="TODAY">Today (IST)</option>
          <option value="DUE_SOON">This week</option>
          <option value="LATER">Later than 7 days</option>
          <option value="OVERDUE">Passed</option><option value="UNSET">No deadline</option>
        </Select>
      </label>
      <label className="min-w-[144px] flex-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Visible columns
        <Select name="display" defaultValue={data.display} className="mt-[6px] block w-full">
          <option value="DETAILED">Default columns</option><option value="COMPACT">Compact columns</option>
        </Select>
      </label>
      <label className="min-w-[144px] flex-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] max-[767px]:min-w-0 max-[767px]:basis-full">Where it is
        <Select name="journey" defaultValue={data.journey}
          className="mt-[6px] block w-full">
          <option value="ALL">Every stage</option>
          <option value="TAKING_APPLICATIONS">Taking applications</option>
          <option value="RUNNING_ROUNDS">Rounds in progress</option>
          <option value="OFFERS_ISSUED">Offers issued</option>
          <option value="COMPLETE">Closed or cancelled</option>
        </Select>
      </label>
      <label className="min-w-[144px] flex-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Work mode
        <Select name="workMode" defaultValue={data.workMode} className="mt-[6px] block w-full">
          <option value="ALL">All modes</option><option value="ONSITE">On-site</option>
          <option value="REMOTE">Remote</option><option value="HYBRID">Hybrid</option>
        </Select>
      </label>
      <label className="min-w-[144px] flex-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Drive mode
        <Select name="recruiterDriveMode" defaultValue={data.recruiterDriveMode} className="mt-[6px] block w-full">
          <option value="ALL">All drive modes</option>
          <option value="ON_CAMPUS">On campus</option>
          <option value="POOL">Pool campus</option>
          <option value="OFF_CAMPUS">Off campus</option>
        </Select>
      </label>
      <label className="min-w-[144px] flex-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Job type
        <Select name="jobTypeLabel" defaultValue={data.jobTypeLabel??""} className="mt-[6px] block w-full">
          <option value="">All job types</option>
          {jobTypes.map(type=><option key={type.label} value={type.label}>{type.label}</option>)}
          {data.jobTypeLabel&&!jobTypes.some(type=>type.label===data.jobTypeLabel)?
            <option value={data.jobTypeLabel}>{data.jobTypeLabel} (historic)</option>:null}
        </Select>
        {data.employmentType!=="ALL"?<input type="hidden" name="employmentType" value={data.employmentType}/>:null}
      </label>
      <label className="min-w-[144px] flex-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Sort drives
        <Select name="sort" defaultValue={data.sort} className="mt-[6px] block w-full">
          <option value="COMPANY">Company name</option><option value="DEADLINE_ASC">Earliest recorded deadline</option>
          <option value="DEADLINE_DESC">Latest recorded deadline</option>
        </Select>
      </label>
      <h3 className="sm:col-span-2 lg:col-span-3 mt-2 font-semibold text-foreground">Pay and response</h3>
      <label className="min-w-32 flex-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Min. applied
        <Input name="minApplied" type="number" min={0} max={100000} defaultValue={data.minApplied??""}
          className="mt-[6px] block w-full"/>
      </label>
      <label className="min-w-32 flex-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Max. applied
        <Input name="maxApplied" type="number" min={0} max={100000} defaultValue={data.maxApplied??""}
          className="mt-[6px] block w-full"/>
      </label>
      <label className="min-w-32 flex-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Min. offers
        <Input name="minOffers" type="number" min={0} max={100000} defaultValue={data.minOffers??""}
          className="mt-[6px] block w-full"/>
      </label>
      <label className="min-w-32 flex-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Max. offers
        <Input name="maxOffers" type="number" min={0} max={100000} defaultValue={data.maxOffers??""}
          className="mt-[6px] block w-full"/>
      </label>
      <label className="min-w-[144px] flex-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] max-[767px]:min-w-0 max-[767px]:basis-full">Pay category
        <Select name="payCategory" defaultValue={data.payCategory}
          className="mt-[6px] block w-full">
          <option value="ALL">All categories</option><option value="REGULAR">Regular</option>
          <option value="DREAM">Dream</option>
        </Select>
      </label>

          </div>
        </details>
        <Button type="submit" className="w-full sm:w-auto">Apply</Button>
      </div>
    </form>
    {supportError?<Alert tone="warning">Job type filters are unavailable. The drive list remains available; retry to load the missing filter choices.</Alert>:null}
    <TpoDriveSavedViews scopeKey={savedViewScope}/>

    {data.view==="REQUESTS" ? (!data.requestsAvailable ?
      <EmptyState title={TPO_REQUESTS_COPY.tab} description={TPO_REQUESTS_COPY.unavailable}
        action={<Link href="/tpo/placements/overview" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline md:min-h-9">Operations overview</Link>}/> :
      <section aria-label="Recruiter drive requests" className="space-y-3">
        <p role="status" className="text-sm leading-[1.6]">{data.totalMatching} recruiter drive requests</p>
        {data.requestRows.length===0?<EmptyState title="No drive requests waiting" description="No recruiter drive requests need review."
            action={<Link href="/tpo/placements/lifecycle?view=DRAFT" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline md:min-h-9">Drafts</Link>}/>:
          data.requestRows.map(item=><article key={item.id} className="border-b border-border py-4">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h2 className="min-w-0 break-words font-semibold">{item.company} · {item.title}</h2>
              <StatusBadge tone={driveRequestStatusTone(item.status)}>{driveRequestStatusLabel(item.status)}</StatusBadge>
            </div>
            <p className="text-xs text-muted-foreground">Request ID: {item.id}</p>
            <section aria-label="Recruiter contact" className="mt-2 space-y-1 text-sm">
             <h3 className="font-semibold">Recruiter</h3>
             <p>Email: {item.recruiterEmail??"Not recorded"} · Phone: {item.recruiterPhone??"Not recorded"}</p>
             {item.verificationStatus!=="VERIFIED"?<p className="text-[var(--lms-gold-accent)]">Unverified</p>:null}
             {item.accessEnded?<Alert tone="error">Recruiter access ended. Finish this drive yourself.</Alert>:null}
             <Link href={"/tpo/recruiters?search="+encodeURIComponent(item.recruiterEmail??"")}
              className="text-primary-text underline">Open recruiter</Link>
            </section>
            {item.changes?<details aria-label="What changed since the last request" className="mt-3 border-t border-border pt-3 text-sm">
              <summary className="min-h-11 cursor-pointer font-semibold md:min-h-9">What changed since the last request</summary>
              <div className="space-y-2 pb-2">
              {!item.changes.some(change=>change.changed)?<p>Nothing that we compare changed.</p>:
               <dl className="grid gap-2">{item.changes.filter(change=>change.changed).map(change=><div key={change.label} className="border-b border-border py-2">
                <dt className="font-semibold">{change.label}</dt>
                <dd>Before: {change.before||"Not provided"}</dd>
                <dd>Now: {change.after||"Not provided"}</dd>
               </div>)}</dl>}
              </div>
            </details>:null}
            {item.status==="REQUEST"||item.status==="SENT_BACK"?
              <TpoDriveRequestActions requestId={item.id} status={item.status}/>:
              item.approvedJobId?<Link href={"/tpo/placements/jobs/"+item.approvedJobId}
                className="text-primary-text underline">Open draft</Link>:null}
          </article>)}
        <nav aria-label="Drive request pagination" className="flex justify-between">
          {data.page>1?<Link href={pageHref(data.page-1)} className="inline-flex min-h-11 items-center font-semibold text-[var(--lms-link-text)] underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:text-[var(--lms-primary-text)]">Previous</Link>:<span/>}
          {data.page<data.totalPages?<Link href={pageHref(data.page+1)} className="inline-flex min-h-11 items-center font-semibold text-[var(--lms-link-text)] underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:text-[var(--lms-primary-text)]">Next</Link>:null}
        </nav>
      </section>
    ) : <>
      <section aria-label="Drive lifecycle counts" className="grid min-w-0 grid-cols-1 gap-0 border-y border-[var(--lms-canvas-border)] min-[768px]:grid-cols-4">
        {metrics.map(([name,n]) =>
          <div key={name} className="min-w-0 border-b border-[var(--lms-canvas-border)] px-[var(--lms-space-4)] py-[var(--lms-space-3)] min-[768px]:border-b-0 min-[768px]:border-r min-[768px]:last:border-r-0">
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
              "No non-archived jobs match the selected season and filters."} action={<Link href="/tpo/placements/new" className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-[650] text-primary-text sm:w-auto md:min-h-9">Create drive</Link>} />

        </div> :
        <form action="/api/placements/tpo/drives/export" method="get" aria-label="Selected drive export" className="grid gap-3">
          {Array.from(exportParams.entries()).map(([key,value])=><Input type="hidden" key={key} name={key} value={value}/>)}
          <Input type="hidden" name="scope" value="SELECTED"/>
          <p className="text-sm text-body">Select up to 25 drives shown on this page to export just those rows.</p>
          <div className="min-w-0 overflow-x-auto rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)]" role="region"
            aria-label="Drives data table" tabIndex={0}>
            <table className="w-full min-w-[1150px] border-collapse text-left text-sm">
              <caption className="sr-only">Drives in the selected status tab. Scroll horizontally for all columns and drive actions.</caption>
              <thead className="bg-[var(--lms-neutral-50)] text-[13px] font-semibold text-[var(--lms-neutral-400)]">
                <tr className="border-b border-[var(--lms-canvas-border)]">
                  <th scope="col" className="min-w-[210px] px-3 py-3">
                    <Link href={{...pageHref(1),query:{...pageHref(1).query,sort:"COMPANY"}}}
                      className="font-semibold text-primary-text underline underline-offset-4">Drive</Link>
                  </th>
                  <th scope="col" className="min-w-[160px] px-3 py-3">Where it is</th>
                  <th scope="col" className="min-w-[112px] px-3 py-3">Mode</th>
                  {data.display==="DETAILED"?<th scope="col" className="min-w-[120px] px-3 py-3">Owner</th>:null}
                  <th scope="col" className="min-w-[120px] px-3 py-3">Job type</th>
                  {data.display==="DETAILED"?<th scope="col" className="min-w-[125px] px-3 py-3">Pay</th>:null}
                  <th scope="col" className="px-3 py-3 text-right">Applied</th>
                  <th scope="col" aria-sort={data.sort==="DEADLINE_ASC"?"ascending":data.sort==="DEADLINE_DESC"?"descending":"none"}
                    className="min-w-[160px] px-3 py-3">
                    <Link href={{...pageHref(1),query:{...pageHref(1).query,
                      sort:data.sort==="DEADLINE_ASC"?"DEADLINE_DESC":"DEADLINE_ASC"}}}
                      className="font-semibold text-primary-text underline underline-offset-4">Deadline</Link>
                  </th>
                  <th scope="col" className="px-3 py-3">Status</th>
                  <th scope="col" className="min-w-[190px] px-3 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--lms-canvas-border)]">
              {data.rows.map(job=><tr key={job.id} className="align-top hover:bg-[var(--lms-neutral-50)]">
                <td className="px-3 py-3">
                  <div className="flex min-w-0 items-start gap-2">
                    <Checkbox name="ids" value={job.id} aria-label={"Select "+job.company+" "+job.title}/>
                    <div className="min-w-0">
                      <Link href={"/tpo/placements/jobs/"+job.id}
                        className="font-semibold text-primary-text underline underline-offset-4">{job.company} · {job.title}</Link>
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
                   "₹"+(job.minimumAnnualCtcInr!=null?(job.minimumAnnualCtcInr/100000).toLocaleString("en-IN"):"—")+
                   (job.maximumAnnualCtcInr!=null?"–"+(job.maximumAnnualCtcInr/100000).toLocaleString("en-IN"):"")+" LPA"}
                  {job.isDream?<span className="mt-1 block text-xs">Dream</span>:null}
                  {job.stipendPerMonthInr!=null?<span className="mt-1 block text-xs">₹{job.stipendPerMonthInr.toLocaleString("en-IN")}/month</span>:null}
                </td>:null}
                <td className="px-3 py-3 text-right tabular-nums">{job.appliedCount??"Unknown"}</td>
                <td className="px-3 py-3">
                  {job.applicationDeadline?new Date(job.applicationDeadline).toLocaleString("en-IN",{
                    dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"})+" IST":"No deadline"}
                </td>
                <td className="px-3 py-3"><StatusBadge tone={tpoDriveStatusTone(job.status)}>{tpoDriveStatusLabel(job.status)}</StatusBadge></td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={"/tpo/placements/jobs/"+job.id}
                      className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-primary-text md:min-h-9">Open drive</Link>
                <Dropdown mobileSheet align="end" label={"More for "+job.company} trigger="···">
                   <nav aria-label={"Drive links for "+job.title} className="min-w-48 space-y-1">
                    <Link className="block rounded-[var(--lms-control-radius)] px-3 py-2 text-sm text-primary-text hover:bg-primary-subtle inline-flex min-h-11 items-center md:min-h-[var(--lms-control-height)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]" href={"/tpo/placements/jobs/"+job.id+"/applicants"}>Applicants</Link>
                    <Link className="block rounded-[var(--lms-control-radius)] px-3 py-2 text-sm text-primary-text hover:bg-primary-subtle inline-flex min-h-11 items-center md:min-h-[var(--lms-control-height)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]" href={"/tpo/placements/jobs/"+job.id+"/rounds"}>Rounds and schedule</Link>
                    <Link className="block rounded-[var(--lms-control-radius)] px-3 py-2 text-sm text-primary-text hover:bg-primary-subtle inline-flex min-h-11 items-center md:min-h-[var(--lms-control-height)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]" href={"/tpo/placements/jobs/"+job.id+"/offers"}>Offers</Link>
                    <Link className="block rounded-[var(--lms-control-radius)] px-3 py-2 text-sm text-primary-text hover:bg-primary-subtle inline-flex min-h-11 items-center md:min-h-[var(--lms-control-height)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]"
                      href={"/tpo/placements/jobs/"+job.id+"/applications-export"}>Export applicants</Link>
                    <Link className="block rounded-[var(--lms-control-radius)] px-3 py-2 text-sm text-primary-text hover:bg-primary-subtle inline-flex min-h-11 items-center md:min-h-[var(--lms-control-height)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]"
                      href={"/tpo/placements/jobs/"+job.id+"/share-preview"}>Share with company</Link>
                    {job.status==="PUBLISHED"?<Link
                      className="block rounded-[var(--lms-control-radius)] px-3 py-2 text-sm text-primary-text hover:bg-primary-subtle inline-flex min-h-11 items-center md:min-h-[var(--lms-control-height)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]"
                      href={"/tpo/placements/jobs/"+job.id+"/extend-deadline"}>
                      Set or extend deadline
                    </Link>:null}
                    {job.status==="PUBLISHED"?<Link
                      className="block rounded-[var(--lms-control-radius)] px-3 py-2 text-sm text-primary-text hover:bg-primary-subtle inline-flex min-h-11 items-center md:min-h-[var(--lms-control-height)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]"
                      href={"/tpo/placements/jobs/"+job.id+"/close-preview"}>
                      Review and close drive
                    </Link>:null}
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
            </table>
          </div>
          <div className="flex flex-wrap items-start gap-3">
          <Button variant="secondary" type="submit" className="justify-self-start">
            Export selected drives (CSV)
          </Button>
           <TpoDriveActOnPanel/>
          </div>
        </form>}
      <nav aria-label="Drive pages" className="flex flex-wrap items-center justify-between gap-3">
       {data.page>1?<Link href={pageHref(data.page-1)} className="inline-flex min-h-11 items-center rounded-[8px] md:rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-[650] text-primary-text md:min-h-9 hover:bg-[rgba(38,186,199,0.07)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Previous</Link>:<span/>}
       {data.page<data.totalPages?<Link href={pageHref(data.page+1)} className="inline-flex min-h-11 items-center rounded-[8px] md:rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-[650] text-primary-text md:min-h-9 hover:bg-[rgba(38,186,199,0.07)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Next</Link>:null}
      </nav>
    </>}
    </section>
  </div>;
}
