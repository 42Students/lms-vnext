import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { PlacementsServiceError } from "@/modules/placements/errors";
import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { RecruiterResultControls } from "@/components/placements/recruiter-result-controls";
import { PageHeader } from "@/components/ui/page-header";
import { RecruiterDriveFocusRefresh } from "@/components/hr/recruiter-drive-focus-refresh";
import {RecruiterRoundInlineEditor} from "@/components/hr/recruiter-round-inline-editor";
import { StatusBadge } from "@/components/ui/status-badge";
import { hasActiveRecruiter } from "@/modules/identity/context";
import { getHrJobRead } from "@/modules/placements/hr-job-read-service";
import { hrSelectionReadyApplicationIds } from "@/modules/placements/hr-offer-selection-read-model";
import { HR_OFFER_STATES } from "@/modules/placements/hr-job-applicants-model";
import { buildHrDriveOverview } from "@/modules/placements/hr-drive-overview-model";
import { recruiterVisibleDriveFunnel } from "@/modules/placements/recruiter-drive-funnel-model";
import { projectRecruiterRoundResults } from "@/modules/placements/recruiter-round-results-read-model";
import { hrInlineRoundResultsHref, hrInlineRoundResultFilters } from "@/modules/placements/hr-inline-round-results-model";
import { buildHrApplicantDrawer } from "@/modules/placements/hr-applicant-drawer-model";
import {recruiterDriveProgressSteps,recruiterDriveNextAction} from "@/modules/placements/recruiter-drive-progress-model";
import { listRecruiterApplicantNotes } from "@/modules/placements/applicant-notes-service";
import {RecruiterPrivateRatingEditor} from "@/components/hr/recruiter-private-rating-editor";
import { ApplicantNotesPanel } from "@/components/placements/applicant-notes-panel";
import {placementTableExists} from "@/modules/placements/staged-tables";
import { focusedReviewNavigation } from "@/modules/placements/hr-focused-review-model";
import {RecruiterFocusedReviewShortcuts} from "@/components/placements/recruiter-focused-review-shortcuts";
import { hrScheduledRoundRows,hrRoundConflictLinks } from "@/modules/placements/hr-round-schedule-model";
import { recruiterDriveDraftHref } from "@/modules/placements/hr-drive-draft-links";
import { hrDriveMessagesHref } from "@/modules/placements/hr-drive-messages-link-model";
import {getRecruiterDriveConversations} from "@/modules/placements/hr-drive-conversation-service";
import {readRecruiterThreadMessages} from "@/modules/placements/tpo-messaging-service";
import {RecruiterConversationReplyForm} from "@/components/hr/recruiter-conversation-reply-form";
import {RecruiterConversationLiveRefresh} from "@/components/hr/recruiter-conversation-live-refresh";
import {getDriveChangeRequests} from "@/modules/placements/tpo-drive-change-request-service";
import {TpoDriveChangeRequests} from "@/components/placements/tpo-drive-change-requests";

function currentTimeMs(){return Date.now();}

function safeDriveReturnTo(raw:string|undefined){
 if(!raw)return "/recruiter/drives";
 try{
  const url=new URL(raw,"https://internal.invalid");
  if(url.origin!=="https://internal.invalid" ||
      !["/hr/drives","/recruiter/drives"].includes(url.pathname))return "/recruiter/drives";
  return url.pathname+url.search;
 }catch{return "/recruiter/drives";}
}
function formatCtc(
  value: number | null,
) {
  if (value == null) return null;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function recruiterOfferStatusLabel(status:string){
 const labels:Record<string,string>={
  SELECTED:"With the placement cell",PENDING_VERIFICATION:"Being verified",
  ISSUED:"Awaiting reply",ACCEPTED:"Accepted",DECLINED:"Declined",
  EXPIRED:"Expired",WITHDRAWN:"Withdrawn",REVOKED:"Withdrawn",
 };
 return labels[status]??status.replaceAll("_"," ");
}

export default async function HrPlacementJobPage({
  params,
  searchParams,
}: {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<{ tab?: string; stage?: string; applicant?: string; page?: string;
    offerPage?:string; offerState?:string;
    roundId?:string; outcome?:string; review?:string; returnTo?:string }>;
}) {
  const context =
    await getCurrentRequestContext();
  if (!hasActiveRecruiter(context)) {
    redirect("/dashboard");
  }

  const { jobId } = await params;
  const query = await searchParams;
  const returnTo = safeDriveReturnTo(query.returnTo);
  const returnQuery = "&returnTo="+encodeURIComponent(returnTo);
  let hiring: Awaited<ReturnType<typeof getHrJobRead>>;
  try {
    // Parse only the known params: extra ones (for example ?collegeId=) are ignored.
    const { tab, stage, applicant, page, offerPage, offerState, roundId, outcome } = query;
    // Legacy links use historical tab keys. Authorize the job with the
    // canonical read first, then redirect only within this recruiter job.
    const safeTab=tab==="interviews"||tab==="results"?"rounds":
      tab==="selections"?"offers":
      tab==="messages"||tab==="requests"||tab==="discussion"?"overview":tab;
    hiring = await getHrJobRead(context, jobId, {
      tab:safeTab, stage, applicant, page, offerPage, offerState, roundId, outcome,
    });
  } catch (error) {
    if ((error instanceof PlacementsServiceError && error.code === "PLACEMENT_JOB_NOT_FOUND") ||
        (error instanceof z.ZodError && !z.string().uuid().safeParse(jobId).success)) {
      notFound();
    }
    throw error;
  }
  const { workspace, filters, applicants, applicantsPage, offers, offersPage, offerSummary, offersTotal, selectionRows, selectionPage, selectionTotal, roundSlotCounts } = hiring;
  if(query.tab==="messages")redirect(hrDriveMessagesHref(workspace.job.id));
  const requestsTab=query.tab==="requests";
  const discussionTab=query.tab==="discussion";
  const requestData=(requestsTab||discussionTab)?await getDriveChangeRequests(context,workspace.job.id):null;
  const driveConversation=discussionTab?await getRecruiterDriveConversations(context,workspace.job.id):null;
  const selectedThread=driveConversation?.threads[0]??null;
  const threadMessages=selectedThread?
    await readRecruiterThreadMessages(context,selectedThread.id,1):null;
  if(query.tab==="interviews"||query.tab==="results"||query.tab==="selections"){
    const destination=query.tab==="selections"?"offers":"rounds";
    const search=new URLSearchParams({tab:destination,returnTo});
    if(query.roundId&&z.string().uuid().safeParse(query.roundId).success)search.set("roundId",query.roundId);
    redirect("/recruiter/drives/"+encodeURIComponent(workspace.job.id)+"?"+search.toString());
  }
  const reviewMode = z.enum(["1"]).optional().safeParse(query.review);
  if (!reviewMode.success) notFound();
  const focused = reviewMode.data === "1" && filters.tab === "applicants";
  // Step only through this server-authorized page of actively shortlisted applicants.
  const focusedIds = applicants.rows.filter(row => row.status === "SUBMITTED").map(row => row.id);
  const selectedId = focused ? (filters.applicant ?? focusedIds[0] ?? null) : filters.applicant;
  if (focused && selectedId && !focusedIds.includes(selectedId)) notFound();
  const selectedApplicant = buildHrApplicantDrawer(applicants.rows, selectedId);
  const focusedNavigation = focused && selectedId
    ? focusedReviewNavigation({candidateIds: focusedIds, currentId: selectedId})
    : null;
  const focusedHref = (id:string) => "/recruiter/drives/"+workspace.job.id+
    "?tab=applicants&stage="+filters.stage+"&page="+filters.page+"&review=1&applicant="+id+returnQuery;
  const now = new Date(currentTimeMs());

  const selectionReadyIds = new Set(hrSelectionReadyApplicationIds(workspace.rounds));
  const driveOverview = buildHrDriveOverview({job:workspace.job,applicants:applicants.counts,offers,rounds:workspace.rounds},now);
  if (filters.applicant && !selectedApplicant) notFound();
  let applicantNotes: Awaited<ReturnType<typeof listRecruiterApplicantNotes>> | null = null;
  if (selectedApplicant) {
    try {
      applicantNotes = await listRecruiterApplicantNotes(context, workspace.job.id, selectedApplicant.id);
    } catch (error) {
      // Withdrawn applicants are outside the notes scope; any other failure is real.
      if (!(error instanceof PlacementsServiceError && error.code === "PLACEMENT_APPLICATION_NOT_FOUND")) throw error;
    }
  }
  const selectedRound = workspace.rounds.find(round => round.id === filters.roundId) ??
    (filters.roundId ? null : workspace.rounds[0] ?? null);
  if (filters.roundId && !selectedRound) notFound();
  const inlineResults = selectedRound
    ? projectRecruiterRoundResults(workspace.rounds, selectedRound.id, filters.outcome)
    : null;
  const outcomeOptions = hrInlineRoundResultFilters(inlineResults?.counts);
  const roundSchedule=hrScheduledRoundRows(workspace.rounds);
  const formatRoundTime=(d:Date)=>new Intl.DateTimeFormat("en-IN",{
    timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(d);

  // Use one authorized mapping for both normal round editing and focused review.
  const resultControlRounds = workspace.rounds.map(
            (round) => ({
              id: round.id,
              sequence: round.sequence,
              kind: round.kind,
              name: round.name,
              status: round.status,
              scheduledAt:
                round.scheduledAt?.toISOString() ??
                null,
              timezone: round.timezone,
              mode: round.mode,
              venue: round.venue,
              meetingUrl: round.meetingUrl,
              resultsDueAt:
                round.resultsDueAt?.toISOString() ??
                null,
              participants:
                round.participants.map(
                  (participant) => ({
                    applicationId:
                      participant.applicationId,
                    displayName:
                      participant.displayName,
                    email:
                      participant.email,
                    result:
                      participant.result
                        ? {
                            id:
                              participant
                                .result.id,
                            status:
                              participant
                                .result.status,
                            outcome:
                              participant
                                .result.outcome as
                                | "PASS"
                                | "FAIL"
                                | "HOLD"
                                | "ABSENT",
                            waitlistRank:
                              participant
                                .result.waitlistRank,
                            scorePercent:
                              participant
                                .result.scorePercent,
                            reasonCategory:
                              participant
                                .result.reasonCategory as
                                | "APTITUDE"
                                | "TECHNICAL"
                                | "COMMUNICATION"
                                | "OTHER"
                                | null,
                            candidateMessage:
                              participant
                                .result.candidateMessage,
                          }
                        : null,
                  }),
                ),
            }),
          );

  const ctc =
    workspace.job.minimumAnnualCtcInr !=
      null ||
    workspace.job.maximumAnnualCtcInr !=
      null
      ? [
          formatCtc(
            workspace.job
              .minimumAnnualCtcInr,
          ),
          formatCtc(
            workspace.job
              .maximumAnnualCtcInr,
          ),
        ]
          .filter(Boolean)
          .join(" – ")
      : null;

  return (
    <div className="space-y-6">
      <RecruiterDriveFocusRefresh />
      <Link href={returnTo} className="inline-flex min-h-10 items-center text-sm font-semibold text-primary-text underline">
        ← Back to Drives
      </Link>
      <PageHeader
        title={workspace.job.title}
        description={workspace.job.employmentType.replaceAll("_"," ")+
          " · "+(workspace.job.locations.join(", ")||"Location to be decided")+
          " · "+applicants.counts.all+" applied · "+offersTotal+" offers · "+
          workspace.rounds.length+" rounds · Apply by "+
          (workspace.job.applicationDeadline?
            new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium"}).format(workspace.job.applicationDeadline):
            "Date to be decided")}
      />

      <section className="rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge
            tone={
              workspace.job.status ===
              "PUBLISHED"
                ? "success"
                : "neutral"
            }
          >
            {workspace.job.status==="PUBLISHED"?"Live":workspace.job.status==="CLOSED"?"Completed":workspace.job.status==="CANCELLED"?"Cancelled":workspace.job.status==="DRAFT"?"Sent for review":workspace.job.status.replaceAll("_"," ")}
          </StatusBadge>
          <StatusBadge>
            {workspace.job.employmentType
              .toLowerCase()
              .split("_")
              .join(" ")}
          </StatusBadge>
          <StatusBadge>
            {workspace.job.workMode.toLowerCase()}
          </StatusBadge>
        </div>
        <p className="mt-4 text-sm leading-6 text-body">
          {workspace.job.description}
        </p>
        <div className="mt-4 grid gap-3 text-sm text-body sm:grid-cols-2 xl:grid-cols-4">
          <p className="m-0">
            <span className="font-semibold text-foreground">
              Locations:
            </span>{" "}
            {workspace.job.locations.length
              ? workspace.job.locations.join(
                  ", ",
                )
              : "Not specified"}
          </p>
          <p className="m-0">
            <span className="font-semibold text-foreground">
              Openings:
            </span>{" "}
            {workspace.job.openings ??
              "Not specified"}
          </p>
          <p className="m-0">
            <span className="font-semibold text-foreground">
              CTC:
            </span>{" "}
            {ctc ?? "Not specified"}
          </p>
          <p className="m-0">
            <span className="font-semibold text-foreground">
              Employer access:
            </span>{" "}
            Exact college grant
          </p>
        </div>
      </section>

      {filters.tab === "overview" && !requestsTab && !discussionTab ? (
        <section className="space-y-4 rounded-xl border border-border bg-surface p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h2 className="text-lg font-semibold text-foreground">Drive overview</h2>
              <p className="mt-1 text-sm text-body">Employer-visible pipeline for this college. Applicants are limited to records shared by the placement cell; offer history may contain multiple versions per recipient.</p></div>
            {driveOverview.readOnly ? <StatusBadge tone="neutral">Read-only closed drive</StatusBadge> :
              <StatusBadge tone={driveOverview.deadlineState === "DUE_SOON" ? "warning":"info"}>
                {driveOverview.deadlineState==="DUE_SOON"?"Applications close soon":driveOverview.deadlineState==="PASSED"?"Application deadline passed":driveOverview.deadlineState.replaceAll("_"," ")}
              </StatusBadge>}
          </div>
          <section aria-label="What students see" className="rounded-lg border border-border bg-surface-secondary p-4">
            <h3 className="font-semibold text-foreground">What students see</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Student-facing draft facts are shown for reference. Exact publication and application access are controlled by the placement cell.
            </p>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="font-semibold text-foreground">Job type</dt><dd className="text-body">{workspace.job.employmentType.replaceAll("_"," ")}</dd></div>
              <div><dt className="font-semibold text-foreground">Mode</dt><dd className="text-body">{workspace.job.recruiterDriveMode==="OFF_CAMPUS"?"Off campus":"On campus"}</dd></div>
              <div><dt className="font-semibold text-foreground">CTC</dt><dd className="text-body">
                {workspace.job.ctcLpa!==null?workspace.job.ctcLpa+" LPA":ctc??"Not specified"}
                {workspace.job.fixedCtcLpa!==null?" · Fixed "+workspace.job.fixedCtcLpa+" LPA":""}
                {workspace.job.variableCtcLpa!==null?" · Variable "+workspace.job.variableCtcLpa+" LPA":""}
              </dd></div>
              <div><dt className="font-semibold text-foreground">Stipend</dt><dd className="text-body">{workspace.job.stipendPerMonthInr!==null?
                "₹"+new Intl.NumberFormat("en-IN").format(workspace.job.stipendPerMonthInr)+" / month":"Not specified"}</dd></div>
              <div><dt className="font-semibold text-foreground">Eligible branches</dt><dd className="break-words text-body">{workspace.job.eligibleBranches.length?
                workspace.job.eligibleBranches.join(", "):"No branch restriction recorded"}</dd></div>
              <div><dt className="font-semibold text-foreground">Passing year</dt><dd className="text-body">
                {workspace.job.eligiblePassingYear??"Not specified"}
              </dd></div>
              <div><dt className="font-semibold text-foreground">Apply by</dt><dd className="text-body">
                {workspace.job.applicationDeadline?
                  new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(workspace.job.applicationDeadline)+" IST":"Not specified"}
              </dd></div>
            </dl>
          </section>
          <section aria-labelledby="recruiter-shared-funnel-title"
            className="rounded-lg border border-border bg-surface p-4">
            <h3 id="recruiter-shared-funnel-title" className="font-semibold text-foreground">Hiring pipeline</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Only applicants shared by the placement cell are counted. Earlier or unshared applications are not visible to your employer account.
              Assessment and interview steps show recorded applied results; “—” means this drive has no such round. Offered/Hired count distinct employer-visible recipients, not historical offer versions.
            </p>
            <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Employer-visible stage funnel">
              {recruiterVisibleDriveFunnel({
                shared:applicants.counts.all,shortlisted:applicants.counts.shortlisted,
                rounds:workspace.rounds,
                offered:offerSummary.distinctOffered,hired:offerSummary.distinctHired,
              }).map(stage=><li key={stage.label} className="rounded-lg border border-border bg-surface-subtle p-3">
                <p className="text-xs font-semibold text-body">{stage.label}</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-foreground">{stage.count??"—"}</p>
                <div role="img" aria-label={stage.ofPrevious===null?"Percentage unavailable":stage.ofPrevious+"% of previous known stage"}
                  className="mt-2 h-2 overflow-hidden rounded-full bg-border">
                  <div className="h-full bg-primary" style={{width:(stage.ofPrevious??0)+"%"}}/>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{stage.ofPrevious===null?"No comparable previous count":stage.ofPrevious+"% of previous known stage"} · {stage.ofApplied===null?"Applied percentage unavailable":stage.ofApplied+"% of shared applicants"}</p>
              </li>)}
            </ol>
          </section>
          <ol aria-label="Drive progress" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {recruiterDriveProgressSteps(driveOverview).map(step=><li key={step.label}
              aria-current={step.state==="CURRENT"?"step":undefined}
              className={step.state==="CURRENT"
                ?"rounded-lg border border-primary bg-primary-subtle px-3 py-3 text-sm font-semibold text-primary-text"
                :"rounded-lg border border-border bg-surface-secondary px-3 py-3 text-sm text-body"}>
              <span className="block text-xs">{step.state==="COMPLETE"?"Done":step.state==="CURRENT"?"Current":"Upcoming"}</span>
              <span className="mt-1 block">{step.label}</span>
            </li>)}
          </ol>
          <div className="rounded-lg border border-border bg-surface-secondary p-4">
            <h3 className="font-semibold text-foreground">Next</h3>
            <p className="mt-1 text-sm text-body">{recruiterDriveNextAction(driveOverview).detail}</p>
            <Link href={recruiterDriveNextAction(driveOverview).tab
               ? "/recruiter/drives/"+workspace.job.id+"?tab="+recruiterDriveNextAction(driveOverview).tab+returnQuery
               : recruiterDriveDraftHref({collegeId:workspace.college.id,fromJobId:workspace.job.id})}
              className="mt-3 inline-flex min-h-10 items-center rounded-md border border-border px-3 font-semibold text-primary-text">
              {recruiterDriveNextAction(driveOverview).label}
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {label:"Shared applications (capped)",value:driveOverview.shared},
              {label:"Active shortlist",value:driveOverview.active},
              {label:"Withdrawn",value:driveOverview.withdrawn},
              {label:"Evaluative rounds completed",value:driveOverview.completedRounds+" / "+driveOverview.totalRounds},
              {label:"Issued offers (capped)",value:driveOverview.issuedOffers},
              {label:"Accepted offers (capped)",value:driveOverview.acceptedOffers},
            ].map(card=><div key={card.label} className="rounded-md border border-border bg-surface-secondary p-3">
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-foreground">{card.value}</p>
            </div>)}
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href={"/recruiter/drives/"+workspace.job.id+"?tab=applicants"+returnQuery} className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-primary-text">Review applicants</Link>
            <Link href={"/recruiter/drives/"+workspace.job.id+"?tab=rounds"+returnQuery} className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-primary-text">Rounds & results</Link>
            <Link href={"/recruiter/drives/"+workspace.job.id+"?tab=offers"+returnQuery} className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-primary-text">View offers</Link>
          </div>
        </section>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <Link href={recruiterDriveDraftHref({collegeId:workspace.college.id,fromJobId:workspace.job.id})}
          className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
          Hire again
        </Link>
        <Link href={recruiterDriveDraftHref({collegeId:workspace.college.id})}
          className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
          Request another drive
        </Link>
      </div>
      <nav aria-label="Hiring workspace tabs" className="flex flex-wrap gap-2">
        {(["overview", "applicants", "rounds", "offers"] as const).map(tab => (
          <Link key={tab} href={`/recruiter/drives/${workspace.job.id}?tab=${tab}${returnQuery}`}
            aria-current={filters.tab === tab ? "page" : undefined}
            className={`inline-flex min-h-10 items-center rounded-md border px-4 text-sm font-semibold capitalize ${filters.tab === tab ? "border-primary bg-primary-subtle text-primary-text" : "border-border text-body"}`}>
            {tab==="overview"?"Overview":tab==="applicants"?"Applicants ("+applicants.counts.all+")":
              tab==="rounds"?"Rounds & interviews":"Offers ("+offersTotal+")"}
          </Link>
        ))}
        <Link href={"/recruiter/drives/"+workspace.job.id+"?tab=requests"+returnQuery}
          aria-current={requestsTab?"page":undefined}
          className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
          Requests{requestData?" ("+requestData.requests.length+")":""}
        </Link>
        <Link href={"/recruiter/drives/"+workspace.job.id+"?tab=discussion"+returnQuery}
          aria-current={discussionTab?"page":undefined}
          className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
          Discussion
        </Link>
        <Link href={hrDriveMessagesHref(workspace.job.id)}
          className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
          Messages
        </Link>
      </nav>
      {discussionTab?<section aria-label="Drive discussion" className="space-y-4 rounded-xl border border-border bg-surface p-4 sm:p-5">
        <RecruiterConversationLiveRefresh/>
        <h2 className="text-lg font-semibold text-foreground">Discussion</h2>
        <p className="text-sm text-body">Private hiring-drive conversation with the placement cell. The company cannot read other recruiters&apos; conversations.</p>
        {requestData?.party==="COMPANY"&&requestData.requests.length>0?
          <div className="rounded-lg border border-border bg-surface-secondary p-3 text-sm">
            <p className="font-semibold text-foreground">Change-request activity · {requestData.requests.length} recorded</p>
            <p className="mt-1 text-body">Review submitted requests, college decisions and replies in the Requests tab.</p>
            <Link href={"/recruiter/drives/"+workspace.job.id+"?tab=requests"+returnQuery}
              className="mt-2 inline-flex min-h-10 items-center font-semibold text-primary-text underline">Open change requests →</Link>
          </div>:null}
        {threadMessages?<div className="space-y-3">
          <p className="text-xs text-muted-foreground">{threadMessages.total} recorded messages</p>
          <ol aria-label="Drive discussion history" className="max-h-[36rem] space-y-2 overflow-y-auto">
            {[...threadMessages.messages].reverse().map(message=><li key={message.id}
              className="rounded-lg border border-border bg-surface-subtle p-3">
              <p className="text-xs font-semibold text-muted-foreground">
                {message.senderType==="RECRUITER"?"You":message.senderDisplayName?"Placement cell · "+message.senderDisplayName:"Placement cell"} ·
                {" "}{new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",day:"numeric",month:"short",hour:"numeric",minute:"2-digit"}).format(message.createdAt)} IST
              </p>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm text-body">{message.body}</p>
            </li>)}
          </ol>
          <RecruiterConversationReplyForm threadId={selectedThread!.id}/>
          <Link href={"/hr/conversations/"+selectedThread!.id}
            className="inline-flex min-h-10 items-center text-sm font-semibold text-primary-text underline">Browse full conversation history</Link>
        </div>:<form method="post" action="/api/placements/recruiter/conversations/open" className="space-y-3">
          <input type="hidden" name="collegeId" value={workspace.college.id}/>
          <input type="hidden" name="jobId" value={workspace.job.id}/>
          <p className="text-sm text-body">No private drive discussion exists yet.</p>
          <button type="submit" className="min-h-11 rounded-md bg-primary px-4 font-semibold text-on-primary">Open drive discussion</button>
        </form>}
      </section>:null}
      {requestsTab&&requestData?.party==="COMPANY" ? <section className="space-y-4 rounded-xl border border-border bg-surface p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-foreground">Requests</h2>
        <p className="text-sm text-body">Suggest or discuss a change with the placement cell. Your college controls final approval.</p>
        {requestData.storageReady?<TpoDriveChangeRequests jobId={workspace.job.id} party="COMPANY"
          userId={context.user.id} requests={requestData.requests}/> :
         <p role="status" className="rounded-lg border border-warning p-3 text-sm text-body">{requestData.pendingMessage}</p>}
      </section>:null}
      {filters.tab === "applicants" ? (
        <section className="space-y-4 rounded-xl border border-border bg-surface p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="m-0 text-lg font-semibold text-foreground">Shared applicants</h2>
            {applicants.rows.some(row=>row.status==="SUBMITTED") ? <Link
              href={"/recruiter/drives/"+workspace.job.id+"?tab=applicants&stage="+filters.stage+"&page="+filters.page+"&review=1"+returnQuery}
              className="inline-flex min-h-10 items-center rounded-md border border-border px-3 text-sm font-semibold text-primary-text">
              Focused review
            </Link> : null}
            <Link href={"/api/placements/recruiter/jobs/"+workspace.job.id+"/applicants/export?stage="+filters.stage}
              className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
              Export shared applicants CSV
            </Link>
          </div>
          <p className="text-sm text-body">Only placement-cell-shortlisted applicants are visible to this employer. Private pending, held and rejected candidates are excluded. Counts include all authorized shared applications, while the list loads 25 per page.</p>
          <nav aria-label="Applicant stage" className="flex flex-wrap gap-2">
            {([["ALL", "All shared", applicants.counts.all], ["SHORTLISTED", "Active shortlist", applicants.counts.shortlisted],
              ["WITHDRAWN", "Withdrawn", applicants.counts.withdrawn]] as const).map(([stage, label, count]) => (
              <Link key={stage} href={`/recruiter/drives/${workspace.job.id}?tab=applicants&stage=${stage}${returnQuery}`}
                aria-current={filters.stage === stage ? "page" : undefined}
                className={`inline-flex min-h-10 items-center rounded-md border px-3 text-sm ${filters.stage === stage ? "border-primary bg-primary-subtle text-primary-text" : "border-border text-body"}`}>
                {label} ({count})
              </Link>
            ))}
          </nav>
          {applicants.rows.length ? <div className="grid gap-3 md:grid-cols-2">
            {applicants.rows.map(applicant => (
              <article key={applicant.id} className="min-w-0 rounded-lg border border-border bg-surface-subtle p-4">
                <p className="m-0 break-words font-semibold text-foreground">{applicant.name || "Unnamed applicant"}</p>
                <p className="mt-1 break-words text-sm text-body">{applicant.role}</p>
                {applicant.rollNumber?<p className="mt-1 text-xs text-body">Roll no. {applicant.rollNumber}</p>:null}
                {applicant.ugPercentage?<p className="mt-1 text-xs text-body">UG %: {applicant.ugPercentage}</p>:null}
                {applicant.tenthPercentage?<p className="mt-1 text-xs text-body">10th %: {applicant.tenthPercentage}</p>:null}
                {applicant.twelfthOrDiplomaPercentage?<p className="mt-1 text-xs text-body">12th / diploma %: {applicant.twelfthOrDiplomaPercentage}</p>:null}
                <div className="mt-2 flex flex-wrap gap-2"><StatusBadge>{applicant.status}</StatusBadge><StatusBadge>{applicant.screening}</StatusBadge></div>
                <p className="mt-2 text-xs text-muted-foreground">Applied {new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"}).format(applicant.submittedAt)}</p>
                <Link href={"/recruiter/drives/"+workspace.job.id+"?tab=applicants&stage="+filters.stage+"&page="+filters.page+"&applicant="+applicant.id+returnQuery}
                  className="mt-3 inline-flex min-h-10 items-center rounded-md border border-border px-3 text-sm font-semibold text-primary-text">Review applicant</Link>
              </article>
            ))}
          </div> : <p className="text-sm text-muted-foreground">{applicants.counts.all===0 ? "The placement cell has not shared the applicants yet" : "No shared applicants match this stage."}</p>}
          {selectedApplicant ? (<>
            <div aria-hidden="true" className="fixed inset-0 z-20 bg-black/40"/>
            <section id="recruiter-focused-review-dialog" role="dialog" aria-modal="true" aria-labelledby="hr-applicant-drawer-title"
              className="fixed inset-x-0 bottom-0 z-30 max-h-[85vh] overflow-y-auto rounded-t-2xl border border-border bg-surface p-5 shadow-xl sm:inset-x-auto sm:right-0 sm:top-0 sm:h-screen sm:max-h-screen sm:w-full sm:max-w-lg sm:rounded-none"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 id="hr-applicant-drawer-title" className="text-lg font-semibold text-foreground">{focused ? "Focused review" : "Applicant review"}</h3>
                <Link href={"/recruiter/drives/"+workspace.job.id+"?tab=applicants&stage="+filters.stage+"&page="+filters.page+returnQuery}
                  className="rounded-md border border-border px-3 py-2 text-sm text-foreground">Close</Link>
              </div>
              {<RecruiterFocusedReviewShortcuts
                closeHref={"/recruiter/drives/"+workspace.job.id+"?tab=applicants&stage="+filters.stage+"&page="+filters.page+returnQuery}
                previousHref={focusedNavigation?.previous?focusedHref(focusedNavigation.previous):null}
                nextHref={focusedNavigation?.next?focusedHref(focusedNavigation.next):null}/>}
              {focusedNavigation ? <nav aria-label="Step through shortlisted applicants" className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                <label className="flex min-w-40 flex-1 items-center gap-3">
                  <span className="shrink-0 text-body">{focusedNavigation.index+1} of {focusedNavigation.total} shared applicants on this page</span>
                  <progress aria-label="Focused review progress" value={focusedNavigation.index+1} max={focusedNavigation.total}
                    className="h-2 min-w-20 flex-1 accent-primary"/>
                </label>
                {focusedNavigation.previous ? <Link className="rounded-md border border-border px-3 py-2 text-primary-text" href={focusedHref(focusedNavigation.previous)}>Previous applicant</Link> : null}
                {focusedNavigation.next ? <Link className="rounded-md border border-border px-3 py-2 text-primary-text" href={focusedHref(focusedNavigation.next)}>Next applicant</Link> : null}
              </nav> : null}
              <dl className="mt-5 grid gap-4 text-sm">
                <div><dt className="text-muted-foreground">Applicant</dt><dd className="font-semibold text-foreground">{selectedApplicant.name}</dd></div>
                <div><dt className="text-muted-foreground">Role</dt><dd className="text-foreground">{selectedApplicant.role}</dd></div>
                <div><dt className="text-muted-foreground">Shared email</dt><dd className="break-all text-foreground">{selectedApplicant.email ?? "Not provided"}</dd></div>
                {selectedApplicant.rollNumber?<div><dt className="text-muted-foreground">Roll no.</dt><dd className="text-foreground">{selectedApplicant.rollNumber}</dd></div>:null}
                {selectedApplicant.ugPercentage?<div><dt className="text-muted-foreground">UG %</dt><dd className="text-foreground">{selectedApplicant.ugPercentage}</dd></div>:null}
                {selectedApplicant.tenthPercentage?<div><dt className="text-muted-foreground">10th %</dt><dd className="text-foreground">{selectedApplicant.tenthPercentage}</dd></div>:null}
                {selectedApplicant.twelfthOrDiplomaPercentage?<div><dt className="text-muted-foreground">12th / diploma %</dt><dd className="text-foreground">{selectedApplicant.twelfthOrDiplomaPercentage}</dd></div>:null}
                <div><dt className="text-muted-foreground">Application</dt><dd className="text-foreground">{selectedApplicant.status}</dd></div>
                <div><dt className="text-muted-foreground">Placement-cell screening</dt><dd className="text-foreground">{selectedApplicant.screening}</dd></div>
                <div><dt className="text-muted-foreground">Applied (IST)</dt><dd className="text-foreground">{new Intl.DateTimeFormat("en-IN", {dateStyle:"medium",timeZone:"Asia/Kolkata"}).format(selectedApplicant.submittedAt)}</dd></div>
              </dl>
              <RecruiterPrivateRatingEditor key={selectedApplicant.id}
                jobId={workspace.job.id} applicationId={selectedApplicant.id}/>
              {applicantNotes ? (
                <div className="mt-5">
                  <ApplicantNotesPanel
                    endpoint={"/api/placements/recruiter/jobs/" + workspace.job.id + "/applicants/" + selectedApplicant.id + "/notes"}
                    snapshot={applicantNotes}
                    audience="recruiters of your company with access to this drive"
                  />
                </div>
              ) : null}
              {focused&&!driveOverview.readOnly?<div className="mt-5 space-y-3">
                <h4 className="font-semibold text-foreground">Round results for this applicant</h4>
                <p className="text-xs text-muted-foreground">Draft decisions are sent for placement-cell verification. Only the placement cell can apply official outcomes.</p>
                <RecruiterResultControls key={selectedApplicant.id} focusApplicantId={selectedApplicant.id} rounds={resultControlRounds
                  .filter(round=>round.participants.some(person=>person.applicationId===selectedApplicant.id))
                  .map(round=>({...round,participants:round.participants.filter(person=>person.applicationId===selectedApplicant.id)}))}/>
              </div>:<p className="mt-5 text-sm text-muted-foreground">
                {driveOverview.readOnly?"This drive is finished. Results can no longer be sent.":"Official screening is controlled by the placement cell. Open Focused review to stage results for this applicant."}
              </p>}
              <Link href={"/recruiter/drives/"+workspace.job.id+"?tab=rounds"+returnQuery}
                className="mt-4 inline-flex min-h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">Review rounds</Link>
            </section>
          </>) : null}
          <nav aria-label="Applicant pages" className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <span className="text-xs text-muted-foreground">
              {applicantsPage.first === 0 ? "No rows on this page" :
                "Showing " + applicantsPage.first + "–" + applicantsPage.last}
              {" of " + (filters.stage === "SHORTLISTED" ? applicants.counts.shortlisted :
                filters.stage === "WITHDRAWN" ? applicants.counts.withdrawn : applicants.counts.all)}
            </span>
            <div className="flex gap-2">
              {filters.page > 1 ? (
                <Link href={"/recruiter/drives/"+workspace.job.id+"?tab=applicants&stage="+filters.stage+"&page="+(filters.page-1)+returnQuery}
                  className="inline-flex min-h-10 items-center rounded-md border border-border px-3 text-sm text-primary-text">Previous</Link>
              ) : null}
              {filters.page < applicantsPage.pages ? (
                <Link href={"/recruiter/drives/"+workspace.job.id+"?tab=applicants&stage="+filters.stage+"&page="+(filters.page+1)+returnQuery}
                  className="inline-flex min-h-10 items-center rounded-md border border-border px-3 text-sm text-primary-text">Next</Link>
              ) : null}
            </div>
          </nav>:null}
        </section>
      ) : null}
      {filters.tab === "offers" ? (
        <section className="space-y-4 rounded-xl border border-border bg-surface p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="m-0 text-lg font-semibold text-foreground">Job offers · read only</h2>
            <Link href={"/api/placements/recruiter/jobs/"+workspace.job.id+"/offers/export?offerState="+filters.offerState}
              className="inline-flex min-h-10 items-center rounded-md border border-border px-3 text-sm font-semibold text-primary-text">
              Export offers CSV
            </Link>
          </div>
          <p className="text-sm text-body">Only offers for company-shared shortlisted applicants appear here. Counts include only issued offer records, and the table loads 15 at a time. Pre-issue selections appear separately below. Letters of intent issued by the placement team are labelled; the placement team issues and withdraws them.</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {label:"Recorded offers",value:offerSummary.recorded},
              {label:"Awaiting learner reply",value:offerSummary.awaitingReply},
              {label:"Reply overdue",value:offerSummary.overdue},
              {label:"Accepted",value:offerSummary.accepted},
              {label:"Declined",value:offerSummary.declined},
              {label:"Confirmed joined",value:offerSummary.joined},
            ].map(item=><div key={item.label} className="rounded-md border border-border bg-surface-secondary p-3">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="mt-1 text-xl font-bold text-foreground">{item.value}</p>
            </div>)}
          </div>
          <section className="space-y-2 rounded-lg border border-border bg-surface-secondary p-4">
            <h3 className="font-semibold text-foreground">Selection readiness across all rounds · read only</h3>
            {driveOverview.readOnly ? <p role="status" className="text-sm text-body">
              This drive is finished, so a selection list can no longer be sent.
            </p> : null}
            <p className="text-sm text-body">{selectionReadyIds.size} shared applicants have APPLIED PASS results in every completed evaluative round. No selection list is sent; formal selection, letter-of-intent and offer issue workflows remain with the placement team.</p>
            {selectionReadyIds.size ? <div className="flex flex-wrap gap-2">{applicants.rows.filter(applicant=>selectionReadyIds.has(applicant.id)).map(applicant=>
              <span key={applicant.id} className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-foreground">{applicant.name || "Candidate"}</span>)}</div> : null}
          </section>
          <nav aria-label="Offer status" className="flex flex-wrap gap-2">
            {HR_OFFER_STATES.map((status) => (
              <Link key={status} href={"/recruiter/drives/"+workspace.job.id+"?tab=offers&offerState="+status+returnQuery}
                aria-current={status===filters.offerState ? "page" : undefined}
                className={status===filters.offerState ?
                  "rounded-full bg-primary px-3 py-2 text-xs font-semibold text-on-primary" :
                  "rounded-full border border-border px-3 py-2 text-xs text-body"}>
                {status==="ALL" ? "All statuses" : status==="PENDING_VERIFICATION"?"Verified, awaiting release":status==="REVOKED"?"Selection cancelled":recruiterOfferStatusLabel(status)}
              </Link>
            ))}
          </nav>
          {(filters.offerState==="ALL"||["SELECTED","PENDING_VERIFICATION","REVOKED"].includes(filters.offerState))?
            <section aria-label="Placement-cell selection history" className="space-y-3 rounded-lg border border-border bg-surface-secondary p-4">
              <h3 className="font-semibold text-foreground">Selection history · placement-cell records</h3>
              <p className="text-sm text-body">Selections are not issued offers. Verified selections still await formal release by the placement cell. Cancelled selections do not imply a revoked offer.</p>
              {selectionRows.length?<div className="overflow-x-auto">
               <table className="w-full min-w-[34rem] text-left text-sm">
                <thead><tr><th scope="col" className="px-3 py-2">Candidate</th>
                 <th scope="col" className="px-3 py-2">Role</th>
                 <th scope="col" className="px-3 py-2">CTC (LPA)</th>
                 <th scope="col" className="px-3 py-2">Status</th></tr></thead>
                <tbody>{selectionRows.map(item=><tr key={item.id} className="border-t border-border">
                  <td className="px-3 py-2">{item.name??"Unnamed applicant"}</td>
                  <td className="px-3 py-2">{item.role}</td>
                  <td className="px-3 py-2">{item.annualCtcInr==null?"—":
                    (item.annualCtcInr/100000).toLocaleString("en-IN",{maximumFractionDigits:2})}</td>
                  <td className="px-3 py-2"><StatusBadge>{item.status==="SELECTED"?"With the placement cell":
                    item.status==="VERIFIED"?"Verified, awaiting release":"Selection cancelled"}</StatusBadge></td>
                </tr>)}</tbody>
               </table>
              </div>:<p role="status" className="text-sm text-muted-foreground">No selections have been recorded in this status.</p>}
              <p className="text-xs text-muted-foreground">
               {selectionPage.first===0?"No selection rows":`Showing ${selectionPage.first}–${selectionPage.last}`} of {selectionTotal}
              </p>
              {filters.offerState!=="ALL"?<nav aria-label="Selection history pages" className="flex gap-3 text-sm">
               {selectionPage.page>1?<Link href={"/recruiter/drives/"+workspace.job.id+"?tab=offers&offerState="+filters.offerState+"&offerPage="+(selectionPage.page-1)+returnQuery}
                className="text-primary-text underline">Previous selections</Link>:null}
               {selectionPage.page<selectionPage.pages?<Link href={"/recruiter/drives/"+workspace.job.id+"?tab=offers&offerState="+filters.offerState+"&offerPage="+(selectionPage.page+1)+returnQuery}
                className="text-primary-text underline">Next selections</Link>:null}
              </nav>:selectionTotal>selectionRows.length?<Link href={"/recruiter/drives/"+workspace.job.id+"?tab=offers&offerState=SELECTED"+returnQuery}
               className="text-primary-text underline text-sm">Review recorded selections</Link>:null}
            </section>:null}
          {offers.length ? <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[56rem] text-left text-sm">
              <caption className="sr-only">Offers for shared applicants at this college</caption>
              <thead className="bg-surface-secondary text-xs font-semibold text-foreground">
                <tr>
                  <th scope="col" className="px-3 py-3">Candidate</th>
                  <th scope="col" className="px-3 py-3">Type</th>
                  <th scope="col" className="px-3 py-3">CTC (LPA)</th>
                  <th scope="col" className="px-3 py-3">Status</th>
                  <th scope="col" className="px-3 py-3">Reply by</th>
                  <th scope="col" className="px-3 py-3">Joining</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {offers.map(offer=><tr key={offer.id}>
                  <td className="px-3 py-3 font-semibold text-foreground">{offer.name||"Unnamed applicant"}
                    <span className="block text-xs font-normal text-muted-foreground">{offer.role}</span></td>
                  <td className="px-3 py-3 text-body">{offer.kind==="LOI"?"Letter of intent":"Offer"}</td>
                  <td className="px-3 py-3 text-body">{offer.annualCtcInr==null?"—":
                    (offer.annualCtcInr/100000).toLocaleString("en-IN",{maximumFractionDigits:2})}</td>
                  <td className="px-3 py-3"><StatusBadge>{recruiterOfferStatusLabel(offer.status)}</StatusBadge></td>
                  <td className="px-3 py-3 text-body">{offer.expiresAt?
                    new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(offer.expiresAt):
                    "Not set"}</td>
                  <td className="px-3 py-3 text-body">
                    {offer.joiningStatus==="JOINED"?"Joined":
                     offer.joiningStatus==="DEFERRED"?"Deferred":
                     offer.joiningStatus==="DID_NOT_JOIN"?"Did not join":"Not recorded"}
                    <span className="block text-xs text-muted-foreground">{offer.joiningDate??"Date not set"}</span>
                  </td>
                </tr>)}
              </tbody>
            </table>
          </div> : filters.offerState==="ALL"||!["SELECTED","PENDING_VERIFICATION","REVOKED"].includes(filters.offerState)?<p className="text-sm text-muted-foreground">No offers yet. The placement cell will issue offers after selection verification.</p>:null}
          {!["SELECTED","PENDING_VERIFICATION","REVOKED"].includes(filters.offerState)?<nav aria-label="Offer pages" className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <span className="text-xs text-muted-foreground">
              {offersPage.first===0 ? "No rows on this page" : "Showing "+offersPage.first+"–"+offersPage.last}
              {" of " + offersPage.total}
            </span>
            <div className="flex gap-2">
              {filters.offerPage > 1 ? <Link
                href={"/recruiter/drives/"+workspace.job.id+"?tab=offers&offerState="+filters.offerState+"&offerPage="+(filters.offerPage-1)+returnQuery}
                className="inline-flex min-h-10 items-center rounded-md border border-border px-3 text-sm text-primary-text">
                Previous
              </Link> : null}
              {filters.offerPage < offersPage.pages ? <Link
                href={"/recruiter/drives/"+workspace.job.id+"?tab=offers&offerState="+filters.offerState+"&offerPage="+(filters.offerPage+1)+returnQuery}
                className="inline-flex min-h-10 items-center rounded-md border border-border px-3 text-sm text-primary-text">
                Next
              </Link> : null}
            </div>
          </nav>:null}
        </section>
      ) : null}
      {filters.tab === "rounds" || filters.tab === "overview" ? <section>
        <div className="mb-3">
          <h2 className="m-0 text-base font-semibold text-foreground">
            Hiring rounds
          </h2>
          {driveOverview.readOnly
            ? <p role="status" className="rounded-md border border-border bg-surface-secondary p-3 text-sm text-body">
                This drive is finished, so slots and results can no longer be sent.
              </p>
            : <div className="flex flex-wrap gap-2">          <Link href={"/recruiter/drives/"+workspace.job.id+"/rounds/editor"}
            className="mt-2 inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
            Add, change or remove rounds
          </Link>
          <Link href={"/recruiter/drives/"+workspace.job.id+"/interview-slots"}
            className="ml-2 mt-2 inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
            Interview slots
          </Link>
</div>}
          <p className="mt-1 text-sm text-body">
            {driveOverview.readOnly
              ? "Historical hiring rounds and applied outcomes remain readable. New results and interview slots are disabled."
              : "Stage employer outcomes here. The college placement team retains final apply authority."}
          </p>
        </div>
        {filters.tab==="rounds"?<section className="mb-5 space-y-3 rounded-xl border border-border bg-surface p-4 sm:p-5">
          <h3 className="font-semibold text-foreground">Scheduled rounds and potential time conflicts</h3>
          <p className="text-sm text-body">IST times from this employer-owned drive. Overlap is calculated only for rounds with recorded durations; room and interviewer availability is unknown.</p>
          <RecruiterRoundInlineEditor jobId={workspace.job.id}
            readOnly={driveOverview.readOnly}
            rows={workspace.rounds.map(round=>({
              id:round.id,name:round.name,kind:round.kind,mode:round.mode,status:round.status,
              createdByYou:round.createdByUserId===context.user.id,
              updatedAt:round.updatedAt.toISOString(),
            }))}/>
          <ul aria-label="Hiring rounds and statuses" className="mt-3 grid gap-2 sm:grid-cols-2">
            {workspace.rounds.map(round=><li key={round.id}
             className="rounded-lg border border-border bg-surface-secondary p-3 text-sm">
              <p className="font-semibold text-foreground">{round.sequence}. {round.name}</p>
              <p className="text-body">{round.status==="COMPLETED"?"Completed":
                round.status==="SCHEDULED"?"Scheduled":"Not scheduled"}
                {round.createdByUserId===context.user.id?" · Added by you":""}</p>
              <p className="text-muted-foreground">{round.scheduledAt?
                new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(round.scheduledAt)+" IST":
                "Date to be decided"} · {round.mode==="VIRTUAL"?"Online":
                  round.mode==="ON_CAMPUS"?"On campus":"Mode to be decided"}</p>
              <p className="text-muted-foreground">{round.venue??"Venue not set"}</p>
              <p className="mt-1 text-xs text-muted-foreground">
               {round.participants.filter(person=>person.result?.status==="STAGED").length} waiting for the cell ·
               {" "}{round.participants.filter(person=>person.result?.status==="APPLIED").length} applied
               {" · "}{roundSlotCounts[round.id]?.confirmed??0}/{roundSlotCounts[round.id]?.total??0} slots confirmed by the placement cell
              </p>

              {!driveOverview.readOnly && round.createdByUserId===context.user.id ?
                <Link href={"/recruiter/drives/"+workspace.job.id+"/rounds/editor"}
                 className="mt-2 inline-flex min-h-10 items-center text-primary-text underline">Change or remove</Link>:null}
            </li>)}
          </ul>
          {roundSchedule.length?<div className="grid gap-3 sm:grid-cols-2">
            {roundSchedule.map(round=><article key={round.id} className="rounded-lg border border-border bg-surface-secondary p-4">
              <h4 className="font-semibold text-foreground">{round.sequence}. {round.name}</h4>
              <p className="mt-1 text-sm text-body">{formatRoundTime(round.startsAt)} IST</p>
              <p className="text-xs text-muted-foreground">{round.endsAt?"Ends "+formatRoundTime(round.endsAt)+" IST":"Duration not recorded"}</p>
              <p className="text-xs text-muted-foreground">{round.mode??"Mode not set"} · {round.venue??"Venue not set"}</p>
              {round.conflicts.length?<div role="status" className="mt-2 text-sm font-semibold text-foreground">
                <p>Potential time overlap with:</p>
                <ul className="mt-1 list-inside list-disc text-sm font-normal">
                  {hrRoundConflictLinks(roundSchedule,round.conflicts,workspace.job.id).map(link=>
                    <li key={link.id}>
                      <Link href={link.href} className="text-primary-text underline">
                        {link.label} · inspect round
                      </Link>
                    </li>)}
                </ul>
              </div>:null}
            </article>)}
          </div>:<p className="text-sm text-muted-foreground">No scheduled rounds recorded.</p>}
        </section>:null}
        {!driveOverview.readOnly ? (
        <RecruiterResultControls
          rounds={resultControlRounds}
        />
        ) : null}

        {filters.tab === "rounds" ? <section className="mt-6 space-y-4 rounded-xl border border-border bg-surface p-4 sm:p-5">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Results from table</h3>
            <p className="mt-1 text-sm text-body">Authorized, placement-cell-shortlisted candidates only. STAGED means awaiting college review; APPLIED means official college-applied outcome.</p>
          </div>
          {workspace.rounds.length ? <>
            <nav aria-label="Choose results round" className="flex flex-wrap gap-2">
              {workspace.rounds.map(round => (
                <Link key={round.id} href={hrInlineRoundResultsHref(workspace.job.id,round.id,"ALL")}
                  aria-current={selectedRound?.id === round.id ? "page" : undefined}
                  className={selectedRound?.id === round.id
                    ? "inline-flex min-h-10 items-center rounded-md bg-primary px-3 py-2 text-sm text-on-primary"
                    : "inline-flex min-h-10 items-center rounded-md border border-border px-3 py-2 text-sm text-body"}>
                  {round.sequence}. {round.name}
                </Link>
              ))}
            </nav>
            {inlineResults ? inlineResults.round.kind === "TALK"
              ? <p className="text-sm text-muted-foreground">Informational rounds do not record candidate outcomes.</p>
              : <>
                <nav aria-label="Filter results" className="flex flex-wrap gap-2">
                  {outcomeOptions.map(option => (
                    <Link key={option.value} href={hrInlineRoundResultsHref(workspace.job.id,inlineResults.round.id,option.value)}
                      aria-current={filters.outcome === option.value ? "page" : undefined}
                      className={filters.outcome === option.value
                        ? "rounded-full bg-primary px-3 py-2 text-xs font-semibold text-on-primary"
                        : "rounded-full border border-border px-3 py-2 text-xs text-body"}>
                      {option.label} ({option.count})
                    </Link>
                  ))}
                </nav>
                {inlineResults.rows.length
                  ? <div className="grid gap-3 md:grid-cols-2">
                      {inlineResults.rows.map(candidate => (
                        <article key={candidate.key} className="min-w-0 rounded-lg border border-border bg-surface-secondary p-4">
                          <p className="break-words font-semibold text-foreground">{candidate.name}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <StatusBadge>{candidate.outcome ?? "UNRECORDED"}</StatusBadge>
                            <StatusBadge>{candidate.status}</StatusBadge>
                          </div>
                          {candidate.scorePercent != null
                            ? <p className="mt-2 text-sm text-body">Score: {candidate.scorePercent}%</p> : null}
                          {candidate.waitlistRank != null
                            ? <p className="mt-1 text-sm text-body">Waitlist rank: {candidate.waitlistRank}</p> : null}
                        </article>
                      ))}
                    </div>
                  : <p className="text-sm text-muted-foreground">No shared candidates match this result filter.</p>}
              </> : null}
          </> : <p className="text-sm text-muted-foreground">No active hiring rounds are configured for this drive.</p>}
          <p className="text-xs text-muted-foreground">This table does not apply results or send candidate messages. Use the existing staging controls above for permitted employer submissions.</p>
        </section> : null}
      </section> : null}
    </div>
  );
}
