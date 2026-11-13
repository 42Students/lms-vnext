import { Select } from "@/components/ui/select";
import { Disclosure } from "@/components/ui/disclosure";
import {Checkbox} from "@/components/ui/checkbox";
import {FilterChipLink} from "@/components/ui/filter-chip";
import {StatusBadge} from "@/components/ui/status-badge";
import {Pagination} from "@/components/ui/pagination";
import {TpoGeneralRequestsPanel} from "@/components/placements/tpo-general-requests-panel";
import {placementTableExists} from "@/modules/placements/staged-tables";
import {TpoSafeCsvDownload} from "@/components/tpo/tpo-safe-csv-download";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import {requireTpoBatchActor} from "@/modules/placements/tpo-batch-workspace-read-service";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { TpoRequestDecisionControl } from "@/components/placements/tpo-request-decision-control";
import {TpoRequestBulkDecision} from "@/components/placements/tpo-request-bulk-decision";
import {TpoSequentialRequestReview} from "@/components/placements/tpo-sequential-request-review";
import {TpoRequestPrototypeWorkspace} from "@/components/tpo/tpo-request-prototype-workspace";
import {TpoRequestPageClipboard} from "@/components/placements/tpo-request-page-clipboard";
import {TpoStudentNudgePanel} from "@/components/tpo/tpo-student-nudge-panel";
import { hasMembershipRole } from "@/modules/identity/context";
import {tpoRequestsExportHref} from "@/modules/placements/tpo-requests-page-csv-model";
import {GLOBAL_TPO_REQUEST_TYPES,TPO_REQUEST_STATUSES,tpoRequestStatusCounts,tpoRequestAgeLabel,tpoRequestContextLink,tpoNextRoundCue,parseGlobalTpoRequestFilters,globalTpoRequestFirstPageHref,tpoRequestClearAdvancedHref} from "@/modules/placements/tpo-global-requests-model";
import { getTpoGlobalRequestsInbox } from "@/modules/placements/tpo-global-requests-service";
import {listPlacementJobs} from "@/modules/placements/job-service";
import {getTpoAfterCollegeForRoster} from "@/modules/placements/tpo-after-college-roster-service";
import {afterCollegeDisplay,AFTER_COLLEGE_OUTCOMES,AFTER_COLLEGE_LABELS} from "@/modules/placements/tpo-after-college-model";
import {tpoRequestAttentionOnPage} from "@/modules/placements/tpo-request-attention-model";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {AuthorizationError} from "@/modules/permissions/policy";
import { Table } from "@/components/ui/table";
import { Heading } from "@/components/ui/heading";
import { Label } from "@/components/ui/label";
import { TextLink } from "@/components/ui/text-link";
import { ButtonLink } from "@/components/ui/button-link";
import { formatNumberIN } from "@/lib/safe-format";
import { createDateFormatter } from "@/lib/format-date";

import { ROLE } from "@/modules/identity/roles";
import { DEFAULT_TIME_ZONE } from "@/config/locale";
export const dynamic = "force-dynamic";
type Params = { request?:string|string[];proof?:string|string[];branchId?:string|string[];
 registration?:string|string[];afterCollege?:string|string[];urgentOnly?:string|string[]; jobId?:string|string[]; age?:string|string[]; sort?:string|string[]; requestType?:string|string[]; status?: string | string[]; search?: string | string[]; page?: string | string[]; pageSize?: string | string[] };
function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
function href(input: { status: string; age:string; sort:string; requestType:string; search: string; page: number; pageSize: number; urgentOnly?:boolean | undefined;jobId?:string | undefined;proof?:string | undefined;branchId?:string | undefined;registration?:string | undefined;afterCollege?:string | undefined }) {
  const p = new URLSearchParams();
  p.set("status", input.status);if(input.age!=="ALL")p.set("age",input.age);p.set("sort",input.sort);if(input.requestType!=="ALL")p.set("requestType",input.requestType); if (input.search) p.set("search", input.search);if(input.urgentOnly)p.set("urgentOnly","true");if(input.jobId)p.set("jobId",input.jobId);
  if(input.proof&&input.proof!=="ALL")p.set("proof",input.proof);
  if(input.branchId)p.set("branchId",input.branchId);
  if(input.registration&&input.registration!=="ALL")p.set("registration",input.registration);
  if(input.afterCollege&&input.afterCollege!=="ALL")p.set("afterCollege",input.afterCollege);
  p.set("page", String(input.page)); p.set("pageSize", String(input.pageSize));
  return "/tpo/requests?" + p.toString();
}
export default async function GlobalTpoRequestsPage({searchParams}:{searchParams:Promise<Params>}) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, ROLE.TPO)) {
    redirect("/dashboard");
  }
  // Reject a revoked/suspended TPO before even parsing the request URL.
  // The page loads job choices in parallel with the inbox, so a downstream
  // inbox-only persisted check is too late to protect that earlier read.
  await requireTpoBatchActor(context);
  const raw = await searchParams;
  if(raw.request!==undefined&&(typeof raw.request!=="string"||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw.request)))
   return <div className="min-w-0 space-y-4"><PageHeader title="Requests"/>
    <ErrorState title="Invalid request selection" description="Choose a request from the authorized queue."
     action={<TextLink href="/tpo/requests" className="inline-flex min-h-11 items-center">Reset selection</TextLink>}/>
   </div>;
  const parsed=parseGlobalTpoRequestFilters({
    status:first(raw.status),age:first(raw.age),sort:first(raw.sort),
    requestType:first(raw.requestType),search:first(raw.search),
    urgentOnly:first(raw.urgentOnly),jobId:first(raw.jobId),
    proof:first(raw.proof),branchId:first(raw.branchId),
    registration:first(raw.registration),afterCollege:first(raw.afterCollege),
    page:first(raw.page),pageSize:first(raw.pageSize),
  });
  if(!parsed.success)return <div className="min-w-0 space-y-6">
    <PageHeader title="Requests"
      description="What students have asked you to decide: withdrawals, off-campus offers, registration changes and disputes. Urgent ones come first."/>
    <ErrorState title="Invalid request filters" description="Check the request status, kind, age, sorting and page values. No request data was loaded."
      action={<TextLink href="/tpo/requests" className="inline-flex min-h-11 md:min-h-9 items-center text-[13px]">Clear invalid filters</TextLink>}/>
  </div>;
  const loaded=await Promise.all([
    getTpoGlobalRequestsInbox(context,parsed.data),
    listPlacementJobs(context,context.membership.collegeId),
  ]).then(value=>({ok:true as const,value})).catch(error=>{
    if(error instanceof AuthorizationError)throw error;
    return {ok:false as const};
  });
  if(!loaded.ok)return <div className="min-w-0 space-y-4">
    <PageHeader title="Requests"/>
    <ErrorState title="Couldn't load requests" description="This refresh failed. Try again without changing any decisions."
      action={<TextLink href="/tpo/requests" className="inline-flex min-h-11 items-center">Retry</TextLink>}/>
  </div>;
  const [data,jobChoices]=loaded.value;
  const outcomeResult=await getTpoAfterCollegeForRoster(context,data.requests.map(row=>row.membershipId));
  const statusCounts=tpoRequestStatusCounts(data.summary);
  const asOf=new Date();
  const attention=tpoRequestAttentionOnPage(data.requests,asOf);
  return <div className="min-w-0 space-y-6">
    <PageHeader title="Requests" description="What students have asked you to decide: withdrawals, off-campus offers, registration changes and disputes. Urgent ones come first." />
    <section aria-label="Requests panel" className="min-w-0 space-y-4 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
    <nav aria-label="Request history views" className="flex min-w-0 flex-wrap items-center gap-2">
      <FilterChipLink href={href({...data.query,status:"PENDING",age:"ALL",page:1})}
        selected={data.query.status==="PENDING"&&data.query.age==="ALL"}
        >{data.query.status==="PENDING"&&data.query.age==="ALL"?"Waiting ("+data.summary.pending+")":"Waiting"}</FilterChipLink>
      <FilterChipLink href={href({...data.query,status:"ALL",age:"LAST_30_DAYS",page:1})}
        selected={data.query.status==="ALL"&&data.query.age==="LAST_30_DAYS"}
        >Last 30 days</FilterChipLink>
      <FilterChipLink href={href({...data.query,status:"ALL",age:"ALL",page:1})}
        selected={data.query.status==="ALL"&&data.query.age==="ALL"}
        >All history</FilterChipLink>
    </nav>
    <Disclosure title="More request statuses" className="min-w-0" contentClassName="pt-[var(--lms-space-2)]">
    <nav aria-label="Request statuses" className="flex min-w-0 flex-wrap items-center gap-2">
      {TPO_REQUEST_STATUSES.map(status=>
        <FilterChipLink key={status} href={href({...data.query,status,page:1})} selected={data.query.status===status}
          >{status==="PENDING"?"Waiting":status.charAt(0)+status.slice(1).toLowerCase()} · {statusCounts[status]}</FilterChipLink>)}
    </nav>
    </Disclosure>
    <form method="get" action="/tpo/requests" className="grid min-w-0 grid-cols-1 items-end gap-[var(--lms-space-3)] border-b border-[var(--lms-canvas-border)] py-[var(--lms-space-4)] md:grid-cols-[auto_minmax(0,1fr)_auto]">
      <Input type="hidden" name="status" value={data.query.status}/>
      <Label className="flex min-h-11 items-center gap-2 md:min-h-9"><Checkbox name="urgentOnly" value="true" defaultChecked={data.query.urgentOnly===true}/> Urgent only</Label>
      <Label stack className="min-w-0">Search student, roll, drive or request type
        <Input name="search" defaultValue={data.query.search} type="search" maxLength={150} className="block min-h-11 w-full md:min-h-9" />
      </Label>
      <Button type="submit" className="min-h-11 w-full md:min-h-9 md:w-auto">Apply</Button>
      <Disclosure title="Advanced request filters" defaultOpen={data.query.proof!=="ALL"||
        Boolean(data.query.branchId)||data.query.registration!=="ALL"||
        data.query.afterCollege!=="ALL"} className="min-w-0 md:col-span-3" contentClassName="min-w-0 pt-[var(--lms-space-3)]">
        <div className="grid min-w-0 grid-cols-1 gap-[var(--lms-space-3)] md:grid-cols-2 lg:grid-cols-3">
         <Heading level={3} size="sm" className="text-foreground md:col-span-2 lg:col-span-3">Request</Heading>
      <Label stack className="min-w-0">Request kind<Select name="requestType" defaultValue={data.query.requestType} className="block min-h-11 w-full md:min-h-9">{GLOBAL_TPO_REQUEST_TYPES.map(type=><option key={type} value={type}>{type==="ALL"?"All request kinds":type==="APPLICATION_WITHDRAWAL"?"Withdrawal request":type==="ROUND_RESCHEDULE"?"Reschedule interview":type==="OFFER_EXTENSION"?"Extend offer deadline":type}</option>)}</Select></Label>
      <Label stack className="min-w-0">Drive<Select name="jobId" defaultValue={data.query.jobId??""} className="block min-h-11 w-full md:min-h-9">
       <option value="">All drives</option>
       {data.query.jobId&&!jobChoices.some(row=>row.job.id===data.query.jobId)?<option value={data.query.jobId}>Previously selected drive</option>:null}
       {jobChoices.map(row=><option value={row.job.id} key={row.job.id}>{row.company.name} · {row.job.title}</option>)}
      </Select></Label>
      <Label stack className="min-w-0">Proof
       <Select name="proof" defaultValue={data.query.proof} className="block min-h-11 w-full md:min-h-9">
        <option value="ALL">Any proof status</option>
        <option value="ATTACHED">Proof attached</option>
        <option value="MISSING">Proof missing</option>
       </Select>
      </Label>
      <Label stack className="min-w-0">Page size
        <Select name="pageSize" defaultValue={String(data.query.pageSize)} className="block min-h-11 w-full md:min-h-9">
          <option value="25">25</option><option value="50">50</option><option value="100">100</option><option value="500">500</option>
        </Select>
      </Label>
      <Label stack className="min-w-0">Waiting since / age<Select name="age" defaultValue={data.query.age} className="block min-h-11 w-full md:min-h-9"><option value="ALL">Any age</option><option value="TODAY">Asked today</option><option value="ONE_TO_TWO_DAYS">1–2 days</option><option value="OLDER_THAN_1_DAY">Older than 24 hours</option><option value="OLDER_THAN_2_DAYS">Older than 2 days</option><option value="OLDER_THAN_7_DAYS">Older than 7 days</option><option value="OLDER_THAN_30_DAYS">Older than 30 days</option><option value="LAST_30_DAYS">Last 30 days</option></Select></Label>
      <Label stack className="min-w-0">Order<Select name="sort" defaultValue={data.query.sort} className="block min-h-11 w-full md:min-h-9"><option value="URGENCY_FIRST">Urgent first</option><option value="NEWEST_FIRST">Newest first</option><option value="OLDEST_FIRST">Oldest first</option><option value="DECIDED_NEWEST">Decided on · newest</option><option value="DECIDED_OLDEST">Decided on · oldest</option></Select></Label>
         <Heading level={3} size="sm" className="text-foreground md:col-span-2 lg:col-span-3">Student</Heading>
         <Label stack className="min-w-0">Branch
          <Select name="branchId" defaultValue={data.query.branchId??""}>
           <option value="">All branches</option>
           {data.branches.map(branch=><option key={branch.id} value={branch.id}>{branch.name}</option>)}
          </Select>
         </Label>
         <Label stack className="min-w-0">Registration
          <Select name="registration" defaultValue={data.query.registration}>
           <option value="ALL">All registration choices</option>
           <option value="PLACEMENTS">Placements</option>
           <option value="HIGHER_STUDIES">Higher studies</option>
           <option value="NOT_INTERESTED">Not interested</option>
           <option value="NOT_REGISTERED">Not registered</option>
          </Select>
         </Label>
         <Label stack className="min-w-0">After college
          <Select name="afterCollege" defaultValue={data.query.afterCollege}>
           <option value="ALL">All after-college outcomes</option>
           <option value="NOT_RECORDED">Not recorded</option>
           {AFTER_COLLEGE_OUTCOMES.map(value=><option key={value} value={value}>{AFTER_COLLEGE_LABELS[value]}</option>)}
          </Select>
         </Label>
        </div>
      </Disclosure>
      <TextLink href={tpoRequestClearAdvancedHref(data.query.status)} className="inline-flex min-h-11 md:min-h-9 items-center text-[13px]">Clear search, age and drive filters</TextLink>
    </form>
    <section aria-label="Needs doing first" className="min-w-0 space-y-3 border-b border-[var(--lms-canvas-border)] py-4">
     <Heading level={2} size="base" className="leading-[26px] md:text-[18px] md:leading-7 lg:text-[20px] lg:leading-[30px]">Needs doing first</Heading>
     <p className="text-[14px] leading-5 text-[var(--lms-body-text)]">{data.summary.pending?data.summary.pending+" waiting for you.":"Nothing is waiting for you."}</p>
     <div className="flex flex-wrap gap-3 text-sm">
      <ButtonLink variant="secondary" href={href({...data.query,status:"PENDING",urgentOnly:true,page:1})} aria-current={data.query.urgentOnly?"page":undefined}>Urgent: a round within 24 hours · {attention.urgent}</ButtonLink>
      <ButtonLink variant="secondary" href={href({...data.query,status:"PENDING",age:"OLDER_THAN_2_DAYS",page:1})}
       aria-current={data.query.age==="OLDER_THAN_2_DAYS"?"page":undefined}>Waiting more than 2 days · {attention.waitingOverTwoDays}</ButtonLink>
      <ButtonLink variant="secondary" href={href({...data.query,status:"PENDING",proof:"MISSING",page:1})}
       aria-current={data.query.proof==="MISSING"?"page":undefined}>Proof missing · {data.requests.filter(row=>!row.proofAttached).length}</ButtonLink>
     </div>
     <p className="text-xs text-muted-foreground">Attention category numbers cover this visible request page only. Proof hints are text-based and are not verified attachment counts.</p>
    </section>
    <Disclosure title={"Actions · Act on all "+data.summary.pending+" waiting requests"} className="min-w-0" contentClassName="min-w-0 space-y-[var(--lms-space-4)] pt-[var(--lms-space-2)]">
    {data.query.status==="PENDING"?<TpoRequestBulkDecision rows={data.requests.filter(row=>row.status==="PENDING").map(row=>({
      id:row.id,studentName:row.studentName,requestType:row.requestType,
      expectedUpdatedAt:row.updatedAt.toISOString(),
      proofMissing:["OFF_CAMPUS_OFFER","ABSENCE_DISPUTE","CORRECTION_WITH_PROOF"].includes(row.requestType)&&!row.proofAttached,
    }))}/>:null}
    {data.query.status==="PENDING"?<TpoSequentialRequestReview
      requests={data.requests.filter(row=>row.status==="PENDING").map(row=>({
        id:row.id,studentName:row.studentName,requestType:row.requestType,
        reason:row.reason,jobTitle:row.jobTitle,companyName:row.companyName,
        expectedUpdatedAt:row.updatedAt.toISOString(),
      }))}/>:null}
    {data.query.status==="PENDING"?<TpoStudentNudgePanel
      rows={Array.from(new Map(data.requests.filter(row=>row.status==="PENDING")
        .map(row=>[row.membershipId,{id:row.membershipId,label:row.studentName,registered:null}])).values())}
    />:null}
    </Disclosure>
    <TpoRequestPrototypeWorkspace rows={data.requests.map(row=>({
     id:row.id,studentName:row.studentName,rollNumber:row.rollNumber??null,branchName:row.branchName??null,
     requestType:row.requestType,reason:row.reason,status:row.status,
     companyName:row.companyName??"",jobTitle:row.jobTitle??"",
     requestedAt:row.requestedAt,updatedAt:row.updatedAt,urgent:row.urgent===true,
     nextRoundAt:row.nextRoundAt??null,decidedBy:row.decidedBy??null,
     decidedAt:row.decidedAt??null,decisionNote:row.decisionNote??null,
     contextHref:tpoRequestContextLink(row).href,contextLabel:tpoRequestContextLink(row).label,
    }))} selectedId={typeof raw.request==="string"?raw.request:null}
     baseHref={href(data.query)} total={data.total} pendingTotal={data.summary.pending}/>
    <Disclosure title="Advanced request table, exports and additional request tools"
     className="min-w-0" contentClassName="min-w-0 space-y-4 pt-4">
    <p className="text-sm text-body">Showing {data.requests.length} of {formatNumberIN(data.total)} matching {data.query.status.toLowerCase()} requests. {data.summary.pending} pending across this college.</p>
    {data.requests.length===0?<EmptyState
      title={data.total>0?"This page is past the available request results.":data.query.status==="PENDING"?"Nothing is waiting for you":"No requests in this period"}
      {...(data.total===0?{description:"Withdrawals, off-campus offers, registration changes and disputes from students show up here."}:{})}
      action={<TextLink href={data.total>0?globalTpoRequestFirstPageHref(data.query):tpoRequestClearAdvancedHref(data.query.status)}
        className="inline-flex min-h-11 items-center">
        {data.total>0?"First matching page":"Reset filters"}
      </TextLink>}/>:
      <div className="min-w-0 overflow-x-auto" role="region" aria-label="Requests table" tabIndex={0}>
        <Table className="min-w-[952px]">
          <thead><tr className="border-y border-border bg-muted text-left text-foreground">
            <th scope="col" className="px-3 py-3">Request</th>
            <th scope="col" className="px-3 py-3">Student</th>
            <th scope="col" className="px-3 py-3">Drive</th>
            <th scope="col" className="px-3 py-3">What they asked</th>
            <th scope="col" className="px-3 py-3">Asked</th>
            {data.query.status!=="PENDING"?<>
              <th scope="col" className="px-3 py-3">Decided by</th>
              <th scope="col" className="px-3 py-3">Decided on</th>
              <th scope="col" className="px-3 py-3">Why</th>
            </>:null}
            <th scope="col" className="px-3 py-3">Action</th>
          </tr></thead>
          <tbody className="divide-y divide-border">
            {data.requests.map(request=>{
              const kind=request.requestType==="APPLICATION_WITHDRAWAL"?"Withdrawal request":
                request.requestType==="ROUND_RESCHEDULE"?"Reschedule interview":
                request.requestType==="OFFER_EXTENSION"?"Extend offer deadline":request.requestType.replaceAll("_"," ");
              const timestamp=createDateFormatter("en-IN", {
                timeZone:DEFAULT_TIME_ZONE,day:"numeric",month:"short",year:"numeric",hour:"numeric",minute:"2-digit",hour12:true,
              }).format(request.requestedAt);
              return <tr key={request.id} className="align-top hover:bg-primary-subtle">
                <td className="max-w-[180px] px-3 py-3">
                  <strong className="block break-words">{kind}</strong>
                  {request.urgent?<StatusBadge tone="warning">Urgent</StatusBadge>:null}
                </td>
                <td className="max-w-[180px] px-3 py-3">
                  <strong className="block break-words">{request.studentName}</strong>
                  <span className="text-xs text-muted-foreground">{request.rollNumber??"—"} · {request.branchName??"—"}</span>
                  {outcomeResult.available?<span className="mt-1 block text-xs text-muted-foreground">After college: {afterCollegeDisplay(outcomeResult.entries[request.membershipId]?.outcome)}</span>:null}
                </td>
                <td className="max-w-[180px] px-3 py-3">
                  <span className="block break-words">{request.companyName||request.jobTitle?
                    [request.companyName,request.jobTitle].filter(Boolean).join(" · "):"Not about a drive"}</span>
                  {request.nextRoundAt?<span className="mt-1 block text-xs text-muted-foreground">{tpoNextRoundCue(request,asOf)}</span>:null}
                </td>
                <td className="max-w-[232px] whitespace-pre-wrap break-words px-3 py-3">{request.reason||"—"}</td>
                <td className="whitespace-nowrap px-3 py-3">
                  <time dateTime={request.requestedAt.toISOString()} title={timestamp+" IST"}>
                    {tpoRequestAgeLabel(request.requestedAt,asOf)}
                  </time>
                </td>
                {data.query.status!=="PENDING"?<>
                  <td className="px-3 py-3">{request.decidedBy||"—"}</td>
                  <td className="whitespace-nowrap px-3 py-3">{request.decidedAt?createDateFormatter("en-IN", {
                    timeZone:DEFAULT_TIME_ZONE,day:"numeric",month:"short",hour:"numeric",minute:"2-digit",hour12:true,
                  }).format(request.decidedAt):"—"}</td>
                  <td className="max-w-[180px] break-words px-3 py-3">{request.decisionNote||"—"}</td>
                </>:null}
                <td className="min-w-[192px] px-3 py-3">
                  {request.status==="PENDING"?<TpoRequestDecisionControl requestId={request.id}
                    expectedUpdatedAt={request.updatedAt.toISOString()} requestType={request.requestType}/>:
                    <StatusBadge tone={request.status==="APPROVED"?"success":request.status==="REJECTED"?"error":"neutral"}>{request.status}</StatusBadge>}
                  <TextLink href={tpoRequestContextLink(request).href}
                    className="mt-2 inline-flex min-h-9 items-center">
                    {tpoRequestContextLink(request).label}
                  </TextLink>
                </td>
              </tr>;
            })}
          </tbody>
        </Table>
      </div>}
    <Pagination label="Request pages" page={data.page} pageCount={data.totalPages} hrefForPage={page=>href({...data.query,page})}/>
    <Disclosure title="Export and row tools" className="min-w-0" contentClassName="min-w-0 space-y-[var(--lms-space-4)] pt-[var(--lms-space-2)]">
    <TpoRequestPageClipboard rows={data.requests.map(row=>({
      id:row.id,student:row.studentName,number:row.rollNumber,
      kind:row.requestType,company:row.companyName,asked:row.requestedAt.toISOString(),
      status:row.status,decided:row.decidedAt?.toISOString()??null,
    }))}/>
    <TpoSafeCsvDownload href={tpoRequestsExportHref(data.query)} filename="tpo-requests.csv" label="Export filtered requests CSV" />
    </Disclosure>
    <Disclosure title="Other student requests" className="min-w-0" contentClassName="pt-[var(--lms-space-2)]">
    {(await placementTableExists("placement_learner_general_requests"))?<TpoGeneralRequestsPanel/>:null}
    </Disclosure>
    <p className="text-xs text-muted-foreground">CSV exports matching authorized requests across pages (up to 5,000), includes their recorded reasons and decisions, and neutralizes spreadsheet formulas. If the export is truncated, narrow the filters.</p>
    <p className="text-xs text-muted-foreground">Pending actions require explicit confirmation. The learner receives an in-app notice when a request is approved or rejected; no email is sent from this inbox.</p>
    </Disclosure>
    </section>
  </div>;
}
