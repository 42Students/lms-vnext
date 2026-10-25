"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import { safeLearnerPlacementUrl } from "@/modules/placements/learner-job-detail-model";
import { learnerDriveApplyGate, learnerDriveApplySelectionSchema, withdrawnPlacementReapplyGuidance } from "@/modules/placements/learner-drive-apply-model";
import {learnerDriveDeadlineUrgency} from "@/modules/placements/learner-drive-deadline-urgency-model";
import {learnerJobDetailFromDrivesHref} from "@/modules/placements/learner-drives-return-model";
import {LearnerSaveDriveButton} from "@/components/placements/learner-save-drive-button";
import {Textarea} from "@/components/ui/textarea";

type EligibilityStatus =
  | "ELIGIBLE"
  | "ELIGIBLE_WITH_MISSING_EVIDENCE"
  | "NEEDS_DATA"
  | "INELIGIBLE";

export type LearnerPlacementJobItem = {
  job: {
    id: string;
    title: string;
    description: string;
    responsibilities?: string | null;
    targetDepartmentName?: string | null;
    targetProgramName?: string | null;
    employmentType: string;
    jobTypeLabel?: string | null;
    /** Approved legacy HTTPS job-description document; never an object-storage key. */
    legacyJobDescriptionUrl?: string | null;
    workMode: string;
    locations: string[];
    openings: number | null;
    minimumAnnualCtcInr: number | null;
    maximumAnnualCtcInr: number | null;
    applicationMode: string;
    externalApplicationUrl: string | null;
    applicationDeadline: string | null;
    publishedAt?: string | null;
    stipendPerMonthInr?:number|null;
    recruiterDriveMode?:string;
    campusPool?:{hostCollege:string;reportingTime:string|null;travelNote:string}|null;
    candidatePreferences?:{
     preferredDegree:string;specialization:string;graduationYear:number|null;
     minGpa:number|null;city:string;
    }|null;
  };
  roleOption: {
    id: string;
    title: string;
    employmentType: string;
    workMode: string;
    locations: string[];
    openings: number | null;
    minimumAnnualCtcInr: number | null;
    maximumAnnualCtcInr: number | null;
    isPrimary: boolean;
    fixedLpa?:string|null;
    variableLpa?:string|null;
    joiningBonusLpa?:string|null;
  };
  company: {
    id: string;
    name: string;
    websiteUrl: string | null;
  };
  application: {
    id: string;
    channel: string;
    status: string;
    eligibilityStatus: string;
    stage?: string | null;
    submittedAt: string;
    withdrawnAt: string | null;
  } | null;
  eligibility: {
    status: EligibilityStatus;
    checks: Array<{
      criterion: string;
      status: "PASS" | "FAIL" | "MISSING";
      actual: string | number | null;
      required: string | number;
      detail: string;
    }>;
    override: {
      decision: "INCLUDE" | "EXCLUDE";
      reason: string;
    } | null;
  };
  deadlinePassed: boolean;
  canApply: boolean;
  applicationBlockers?: string[];
};

function humanize(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1),
    )
    .join(" ");
}

function eligibilityTone(
  status: EligibilityStatus,
): "success" | "warning" | "error" | "info" {
  switch (status) {
    case "ELIGIBLE":
      return "success";
    case "ELIGIBLE_WITH_MISSING_EVIDENCE":
      return "warning";
    case "NEEDS_DATA":
      return "info";
    case "INELIGIBLE":
      return "error";
  }
}

async function placementMutation(
  url: string,
  body: unknown,
) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const payload = (await response
    .json()
    .catch(() => null)) as
    | { error?: string; application?: OwnApplicationReceipt }
    | null;

  if (!response.ok) {
    throw new Error(
      payload?.error ??
        "Placement action could not be completed.",
    );
  }
  return payload;
}

type OwnApplicationReceipt={
 id:string;jobId:string;roleOptionId:string;status:string;channel:string;submittedAt:string;
};
type OwnApplicationLookup={known:boolean;application:OwnApplicationReceipt|null};
/** A signed-in learner can only read their own persisted applications here.
 * Never retry an ambiguous POST without querying this authoritative endpoint.
 */
async function checkOwnPlacementApplication(jobId:string,roleOptionId:string):Promise<OwnApplicationLookup>{
 try{
  const result=await fetch("/api/placements/applications/me",{cache:"no-store",credentials:"same-origin"});
  if(!result.ok)return {known:false,application:null};
  const payload:unknown=await result.json();
  if(!payload||typeof payload!=="object"||!("applications" in payload))return {known:false,application:null};
  const records=(payload as {applications:unknown}).applications;
  if(!Array.isArray(records))return {known:false,application:null};
  const matches=records.filter(row=>row&&typeof row==="object"&&
   "application" in row&&row.application&&typeof row.application==="object"&&
   "jobId" in row.application&&row.application.jobId===jobId&&
   "roleOptionId" in row.application&&row.application.roleOptionId===roleOptionId);
  if(matches.length===0)return {known:true,application:null};
  if(matches.length!==1)return {known:false,application:null};
  const selected=(matches[0] as {application:Record<string,unknown>}).application;
  if(typeof selected["id"]!=="string"||typeof selected["status"]!=="string"||
     typeof selected["channel"]!=="string"||typeof selected["submittedAt"]!=="string")
   return {known:false,application:null};
  return {known:true,application:{
   id:selected["id"],jobId,roleOptionId,
   status:selected["status"],channel:selected["channel"],submittedAt:selected["submittedAt"],
  }};
 }catch{return {known:false,application:null};}
}
function formatApplicationReceiptTime(value:string){
 const at=new Date(value);
 return Number.isFinite(at.getTime())?new Intl.DateTimeFormat("en-IN",{
  dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
 }).format(at):"Date unavailable";
}

type SignedOwnResume = {url:string;isPdf:boolean};
/** Read grants are issued per active, authorized application and never cached. */
function parseSignedOwnResume(value:unknown):SignedOwnResume|null{
 if(!value||typeof value!=="object")return null;
 const response=value as Record<string,unknown>;
 if(response["ready"]!==true||typeof response["readUrl"]!=="string"||
    typeof response["contentType"]!=="string"||typeof response["expiresAt"]!=="string")return null;
 try{
  const parsed=new URL(response["readUrl"]);
  const expires=Date.parse(response["expiresAt"]);
  if(parsed.protocol!=="https:"||parsed.username||parsed.password||
     !Number.isFinite(expires)||expires<=Date.now())return null;
  return {url:parsed.href,isPdf:response["contentType"]==="application/pdf"};
 }catch{return null;}
}
function OwnResumePreview({applicationId}:{applicationId:string}){
 const [pending,setPending]=useState(false);
 const [grant,setGrant]=useState<SignedOwnResume|null>(null);
 const [message,setMessage]=useState<string|null>(null);
 const [open,setOpen]=useState(false);
 async function openResume(){
  if(pending)return;
  setPending(true);setMessage(null);setGrant(null);
  try{
   const result=await fetch("/api/placements/learner/applications/"+
     encodeURIComponent(applicationId)+"/resume",{
      credentials:"same-origin",cache:"no-store",
   });
   if(!result.ok)throw new Error("Resume preview is currently unavailable.");
   const payload:unknown=await result.json();
   if(payload&&typeof payload==="object"&&"ready" in payload&&payload.ready===false){
    setMessage("No resume has been attached to this application.");
   }else{
    const signed=parseSignedOwnResume(payload);
    if(signed){setGrant(signed);setOpen(true);}
    else setMessage("The resume read link is unavailable or expired. Try again.");
   }
  }catch{
   setMessage("Resume preview could not be loaded. Try again.");
  }finally{setPending(false);}
 }
 return <div className="mt-2 space-y-2">
   <Button type="button" size="sm" variant="secondary"
     disabled={pending} onClick={()=>void openResume()}>
     {pending?"Opening resume…":"Preview resume"}
   </Button>
   {message?<p role="status" className="text-xs text-body">{message}</p>:null}
   <Dialog open={open&&grant!==null} title="Resume preview"
     description="This private file link is temporary and belongs to your application."
     className="max-w-[860px]" bodyClassName="p-0"
     onOpenChange={next=>{setOpen(next);if(!next)setGrant(null);}}
     footer={<Button type="button" variant="secondary"
       onClick={()=>{setOpen(false);setGrant(null);}}>Close preview</Button>}>
     {grant?.isPdf?
       <iframe title="Application resume PDF preview"
         src={grant.url} referrerPolicy="no-referrer"
         className="block h-[min(70dvh,620px)] min-h-64 w-full border-0"/>:
       <p className="p-5 text-sm text-body">
         A preview is not available for this file format. Open the authorized document instead.
       </p>}
     {grant?<a href={grant.url} target="_blank" rel="noopener noreferrer"
       referrerPolicy="no-referrer"
       className="inline-flex min-h-11 items-center px-5 text-sm font-semibold text-primary-text underline">
       Open secure resume in a new tab →
     </a>:null}
   </Dialog>
 </div>;
}

function JobActions({
  item,
}: {
  item: LearnerPlacementJobItem;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pendingAction, setPendingAction] =
    useState<string | null>(null);
  // One request per row at a time, even before a state rerender.
  const pendingRef = useRef(false);
  const [confirmation, setConfirmation] =
    useState<"WITHDRAW" | "EXTERNAL" | "INTERNAL" | null>(null);
  const [withdrawReason, setWithdrawReason] = useState("");
  const [showSharedDetails, setShowSharedDetails] = useState(false);
  const [applyResolution,setApplyResolution]=useState<"NONE"|"UNKNOWN"|"FAILED"|"CONFIRMED">("NONE");
  const [confirmedReceipt,setConfirmedReceipt]=useState<OwnApplicationReceipt|null>(null);
  const [applyError,setApplyError]=useState("");

  const { job, roleOption, application } = item;
  const reason = withdrawReason.trim();
  const validWithdrawalReason = reason.length >= 3 && reason.length <= 900;

  async function apply(
    channel: "INTERNAL" | "EXTERNAL",
  ) {
    const preview=learnerDriveApplyGate({
      hasApplication:Boolean(application),deadlinePassed:item.deadlinePassed,
      canApply:item.canApply,applicationMode:job.applicationMode,channel,
    });
    const checked=learnerDriveApplySelectionSchema.safeParse({
      roleOptionId:roleOption.id,channel,confirmed:true,
    });
    if(preview!=="READY" || !checked.success || pendingRef.current||
     applyResolution==="UNKNOWN"||applyResolution==="CONFIRMED")return;
    pendingRef.current = true;
    setPendingAction(channel);
    setApplyError("");
    try {
      const submitted=await placementMutation(
        `/api/placements/jobs/${job.id}/applications`,
        channel === "EXTERNAL"
          ? {
              roleOptionId: roleOption.id,
              channel,
              externalConfirmation: true,
            }
          : job.applicationMode === "HYBRID"
            ? {
                roleOptionId: roleOption.id,
                channel,
              }
            : {
                roleOptionId: roleOption.id,
              },
      );
      setConfirmation(null);
      const stored=submitted?.application;
      // A 2xx HTTP response without a matching durable application receipt
      // is not a confirmed submission. Resolve the own-scoped ledger once;
      // keep Apply locked as UNKNOWN if that read cannot confirm it either.
      let confirmed:OwnApplicationReceipt|null=stored?.id&&stored.status==="SUBMITTED"&&
        stored.jobId===job.id&&stored.roleOptionId===roleOption.id&&
        stored.channel===channel?stored:null;
      if(!confirmed){
       const lookup=await checkOwnPlacementApplication(job.id,roleOption.id);
       confirmed=lookup.application?.status==="SUBMITTED"&&
         lookup.application.channel===channel?lookup.application:null;
      }
      if(!confirmed){
       setApplyResolution("UNKNOWN");
       setApplyError("Application submission could not be confirmed. Check status before trying again.");
       return;
      }
      setConfirmedReceipt(confirmed);
      setApplyResolution("CONFIRMED");
      showToast({
        tone: "success",
        title:
          channel === "EXTERNAL"
            ? "External application recorded"
            : "You're in — application sent",
        description:
          channel === "EXTERNAL"
            ? "Your LMS placement timeline now reflects the employer application."
            : "Your application is now with the placement team.",
      });
      router.refresh();
    } catch (error) {
      // POST failure, timeout or dropped response does not prove no write.
      // Reconcile the learner's own persisted application before permitting retry.
      const checkedState=await checkOwnPlacementApplication(job.id,roleOption.id);
      setConfirmation(null);
      if(checkedState.application){
       setConfirmedReceipt(checkedState.application);
       setApplyResolution("CONFIRMED");
       if(checkedState.application.status==="SUBMITTED"&&checkedState.application.channel===channel){
        showToast({tone:"success",title:"Application confirmed",
         description:"Your existing application is recorded in My applications."});
       }else{
        setApplyError("A different application record exists. Review it before taking another action.");
       }
       router.refresh();
      }else{
       // The write may still be in flight even if a first read returns empty.
       // Only a second explicit status check may unlock the Apply action.
       setApplyResolution("UNKNOWN");
       setApplyError(checkedState.known?
        "No application appeared in the first check. Check status again before retrying.":
        "Application status unavailable. Check status again before applying.");
      }
    } finally {
      pendingRef.current = false;
      setPendingAction(null);
    }
  }

  async function checkStatusAgain(){
    if(pendingRef.current)return;
    pendingRef.current=true;
    setPendingAction("VERIFY");
    try{
     const checkedState=await checkOwnPlacementApplication(job.id,roleOption.id);
     if(checkedState.application){
      setConfirmedReceipt(checkedState.application);
      setApplyResolution("CONFIRMED");
      setApplyError(checkedState.application.status==="SUBMITTED"?
       "":"An application record exists. Review My applications.");
      router.refresh();
     }else if(checkedState.known){
      setApplyResolution("FAILED");
      setApplyError("No application is recorded for this role. You can try again.");
     }else{
      setApplyResolution("UNKNOWN");
      setApplyError("Application status unavailable. Check status again before applying.");
     }
    }finally{
     pendingRef.current=false;
     setPendingAction(null);
    }
  }

  async function requestWithdrawal() {
    if (!application || !validWithdrawalReason || pendingAction !== null || pendingRef.current) return;

    pendingRef.current = true;
    setPendingAction("WITHDRAW");
    try {
      await placementMutation(
        "/api/placements/requests",
        {
          requestType:
            "APPLICATION_WITHDRAWAL",
          applicationId: application.id,
          reason,
        },
      );
      setConfirmation(null);
      setWithdrawReason("");
      showToast({
        tone: "success",
        title: "Withdrawal requested",
        description:
          "Your placement team can review it without losing the application history.",
      });
      router.refresh();
    } catch (error) {
      showToast({
        tone: "error",
        title: "Could not request withdrawal",
        description:
          error instanceof Error
            ? humanize(error.message)
            : "Please try again.",
      });
    } finally {
      pendingRef.current = false;
      setPendingAction(null);
    }
  }

  const receipt=confirmedReceipt??application;
  if (receipt?.status === "SUBMITTED") {
    return (
      <>
        <div className="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <StatusBadge tone="success">
            {learnerApplicationStageLabel(application?.stage ?? receipt.status)} · {humanize(receipt.channel)}
          </StatusBadge>
          <div role="status" className="rounded-[var(--lms-control-radius)] border border-border bg-surface-subtle px-3 py-3 text-sm">
            <p className="font-semibold text-foreground">You're in — application sent</p>
            <p className="mt-1 break-all text-body">Application reference (APP): {receipt.id}</p>
            <p className="mt-1 text-body">Recorded: {formatApplicationReceiptTime(receipt.submittedAt)}</p>
            <p className="mt-1 text-body">Resume: Attachment status is verified when you select Preview resume.</p>
            <p className="mt-1 text-xs text-muted-foreground">An attached resume is private and available only through a fresh authorized read grant. Applying does not automatically share your contact details or profile documents.</p>
            <OwnResumePreview applicationId={receipt.id} />
            <Link href="/learn/my-placements/applications"
              className="mt-2 inline-flex min-h-9 items-center font-semibold text-primary-text underline">
              View applications →
            </Link>
          </div>
          {application?.status==="SUBMITTED"?<Button className="min-h-11 w-full sm:w-auto md:min-h-9"
            size="sm"
            variant="secondary"
            disabled={pendingAction !== null}
            onClick={() => setConfirmation("WITHDRAW")}
          >
            Ask to withdraw
          </Button>:null}
        </div>
        <Dialog
          open={confirmation === "WITHDRAW"}
          onOpenChange={(open) => {
            if (!open && pendingAction === null) setConfirmation(null);
          }}
          title="Withdraw Application"
          description={`Request to withdraw ${roleOption.title} at this employer. The placement team must review your request.`}
          footer={
            <>
              <Button className="min-h-11 w-full sm:w-auto md:min-h-9" variant="secondary" disabled={pendingAction !== null}
                onClick={() => setConfirmation(null)}>
                Keep application
              </Button>
              <Button className="min-h-11 w-full sm:w-auto md:min-h-9"
                disabled={!validWithdrawalReason || pendingAction !== null}
                onClick={() => void requestWithdrawal()}
              >
                {pendingAction === "WITHDRAW" ? "Submitting request…" : "Send withdrawal request"}
              </Button>
            </>
          }
        >
          <label htmlFor={`withdraw-reason-${roleOption.id}`}
            className="block text-[13px] font-semibold text-[var(--lms-neutral-400)] leading-4">
            Reason for withdrawal
          </label>
          <Textarea
            id={`withdraw-reason-${roleOption.id}`}
            value={withdrawReason}
            onChange={(event) => setWithdrawReason(event.target.value)}
            rows={4}
            maxLength={900}
            disabled={pendingAction !== null}
            placeholder="Explain why you want to withdraw this application…"
            className="mt-2 w-full"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            3–900 characters. Requesting withdrawal does not immediately
            remove your application or its results.
          </p>
          {reason.length > 0 && !validWithdrawalReason ? (
            <p role="alert" className="mt-2 text-sm text-warning">
              Enter at least three characters.
            </p>
          ) : null}
        </Dialog>
      </>
    );
  }

  if(confirmedReceipt&&receipt?.status!=="SUBMITTED"&&receipt?.status!=="WITHDRAWN"){
   return <div role="alert" className="rounded-[var(--lms-control-radius)] border border-border p-4 text-sm">
    <p className="font-semibold text-foreground">Application status unavailable</p>
    <p className="mt-2 text-body">A persisted application record has status {humanize(confirmedReceipt.status)}.
     Review your application before submitting another.</p>
    <Link href="/learn/my-placements/applications" className="mt-2 inline-flex min-h-9 items-center text-primary-text underline">
     View my applications
    </Link>
   </div>;
  }
  if (receipt?.status === "WITHDRAWN") {
    return (
      <div className="min-w-0 space-y-2 rounded-[var(--lms-control-radius)] border border-border bg-surface-subtle p-3 text-sm" role="status">
        <StatusBadge tone="neutral">Withdrawn</StatusBadge>
        <p className="text-body">{withdrawnPlacementReapplyGuidance}</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/learn/my-placements/applications"
            className="inline-flex min-h-9 items-center font-semibold text-primary-text underline">Review application history</Link>
          <Link href="/learn/my-placements/placement#requests"
            className="inline-flex min-h-9 items-center font-semibold text-primary-text underline">Contact placement team</Link>
        </div>
      </div>
    );
  }

  if (item.deadlinePassed) {
    return (
      <StatusBadge tone="neutral">
        Applications closed
      </StatusBadge>
    );
  }

  if (!item.canApply) {
    const missing=item.eligibility.checks.filter(check=>check.status==="MISSING");
    const failed=item.eligibility.checks.filter(check=>check.status==="FAIL");
    return <div role="status" className="min-w-0 space-y-2 border-t border-border pt-3 text-sm">
      <p className="font-semibold text-foreground">You can’t apply to this drive</p>
      <p className="text-body">{item.eligibility.status==="NEEDS_DATA"
        ?"Some academic evidence is missing."
        :failed.length?"One or more college eligibility rules are not met.":"The placement cell has not cleared this application."}</p>
      {missing.length>0?<p className="text-xs text-body">Missing: {missing.map(row=>row.criterion).join(", ")}</p>:null}
      {failed.length>0?<p className="text-xs text-body">Not met: {failed.map(row=>row.criterion).join(", ")}</p>:null}
      <div className="flex flex-wrap gap-3">
        <Link href="/learn/my-placements#registration" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9 focus-visible:underline">Check registration</Link>
        <Link href="/learn/my-placements#placement-academic-evidence" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9 focus-visible:underline">Review academic evidence</Link>
      </div>
    </div>;
  }

  const safeExternalUrl = safeLearnerPlacementUrl(job.externalApplicationUrl);
  const externalAvailable =
    Boolean(safeExternalUrl) &&
    (job.applicationMode === "HYBRID" ||
      job.applicationMode === "EXTERNAL_ONLY");
  const internalAvailable =
    job.applicationMode === "INTERNAL" ||
    job.applicationMode === "HYBRID";

  return (
    <div className="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      {internalAvailable ? (
        <Button className="min-h-11 w-full sm:w-auto md:min-h-9"
          size="sm"
          disabled={pendingAction !== null || applyResolution==="UNKNOWN"||applyResolution==="CONFIRMED"}
          onClick={() => setConfirmation("INTERNAL")}
        >
          {pendingAction === "INTERNAL"
            ? "Applying…"
            : "Apply to this role"}
        </Button>
      ) : null}
      {externalAvailable ? (
        <>
          <a
            href={safeExternalUrl!}
            rel="noopener noreferrer"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-[650] text-primary-text transition-colors hover:border-primary hover:bg-primary-subtle sm:w-auto md:min-h-9"
          >
            Open employer form
          </a>
          <Button className="min-h-11 w-full sm:w-auto md:min-h-9"
            size="sm"
            variant="secondary"
            disabled={pendingAction !== null || applyResolution==="UNKNOWN"||applyResolution==="CONFIRMED"}
            onClick={() => setConfirmation("EXTERNAL")}
          >
            {pendingAction === "EXTERNAL"
              ? "Recording…"
              : "I applied externally"}
          </Button>
        </>
      ) : null}
      {applyResolution==="UNKNOWN"||applyResolution==="FAILED"?(
        <div role="alert" className="w-full rounded-[var(--lms-control-radius)] border border-border bg-surface-subtle p-4 text-sm">
          <p className="font-semibold text-foreground">
            {applyResolution==="UNKNOWN"?"Application status unavailable":"Application not submitted"}
          </p>
          <p className="mt-1 text-body">{applyError}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button type="button" size="sm" variant="secondary"
              disabled={pendingAction!==null} onClick={()=>void checkStatusAgain()}>
              {pendingAction==="VERIFY"?"Checking…":"Check status again"}
            </Button>
            <Link href="/learn/my-placements/applications" className="inline-flex min-h-9 items-center text-primary-text underline">
              My applications
            </Link>
            {applyResolution==="FAILED"?<button type="button" className="min-h-9 text-muted-foreground underline"
              onClick={()=>{setApplyError("");setApplyResolution("NONE");}}>Dismiss</button>:null}
          </div>
        </div>
      ):null}
      <Dialog
        open={confirmation === "INTERNAL"}
        onOpenChange={(open) => {if(!open && pendingAction===null)setConfirmation(null);}}
        title="Ready to apply?"
        description="We'll send your profile to the recruiter. You can withdraw later from Applications."
        footer={<>
          <Button className="min-h-11 w-full sm:w-auto md:min-h-9" variant="secondary" disabled={pendingAction!==null} onClick={()=>setConfirmation(null)}>Not yet</Button>
          <Button className="min-h-11 w-full sm:w-auto md:min-h-9" disabled={pendingAction!==null} onClick={()=>void apply("INTERNAL")}>
            {pendingAction==="INTERNAL"?"Submitting…":"Confirm & apply"}
          </Button>
        </>}
      >
        <div className="space-y-4">
          <dl className="grid min-w-0 grid-cols-1 gap-x-4 gap-y-3 border-y border-border py-3 text-sm md:grid-cols-3 [&_dd]:min-w-0 [&_dd]:break-words">
            <div><dt className="font-semibold text-muted-foreground">Role</dt>
              <dd className="mt-1 text-foreground">{roleOption.title}</dd></div>
            <div><dt className="font-semibold text-muted-foreground">Company</dt>
              <dd className="mt-1 text-foreground">{item.company.name}</dd></div>
            <div><dt className="font-semibold text-muted-foreground">Resume</dt>
              <dd className="mt-1 text-foreground">Not attached</dd></div>
          </dl>
          <Button type="button" variant="link" aria-expanded={showSharedDetails} aria-controls={"learner-shared-details-"+item.roleOption.id}
            onClick={()=>setShowSharedDetails(open=>!open)}
            className="max-md:min-h-11 font-[650] text-primary-text underline">
            {showSharedDetails?"Hide what gets shared":"What exactly gets shared?"}
          </Button>
          {showSharedDetails?<ul id={"learner-shared-details-"+item.roleOption.id} className="list-disc space-y-2 pl-5 text-sm text-body">
            <li>Your contact details may be shared with the company by the placement cell. No resume is attached by this form.</li>
            <li>Your academic record is checked for eligibility; the record itself is not sent with this application.</li>
            <li>The placement cell can see your application and review your eligibility.</li>
          </ul>:null}
          <p className="text-xs text-muted-foreground">
            Eligibility and the application deadline are checked again when you confirm.
          </p>
        </div>
      </Dialog>
      <Dialog
        open={confirmation === "EXTERNAL"}
        onOpenChange={(open) => {
          if (!open && pendingAction === null) setConfirmation(null);
        }}
        title="Confirm your external application"
        description={`Record your application for ${roleOption.title} at ${item.company.name} in your LMS journey.`}
        footer={
          <>
            <Button className="min-h-11 w-full sm:w-auto md:min-h-9" variant="secondary" disabled={pendingAction !== null}
              onClick={() => setConfirmation(null)}>
              Not yet
            </Button>
            <Button className="max-md:min-h-11" disabled={pendingAction !== null}
              onClick={() => void apply("EXTERNAL")}>
              {pendingAction === "EXTERNAL" ? "Recording…" : "Yes, I submitted externally"}
            </Button>
          </>
        }
      >
        <p className="text-sm leading-6 text-body">
          Only confirm after completing the employer&apos;s form. This records a
          learner-declared external application, not an employer receipt or verified submission.
        </p>
      </Dialog>
    </div>
  );
}

function postedAtLabel(value:string|null|undefined,snapshotNowIso:string|null):string{
 if(!value||!Number.isFinite(Date.parse(value)))return "Posted date not specified";
 const base=snapshotNowIso?Date.parse(snapshotNowIso):Date.now();
 const elapsed=Math.floor((Number.isFinite(base)?base:Date.now())-Date.parse(value))/86_400_000;
 const days=Math.floor(elapsed);
 if(days<=0)return "Posted Today";
 if(days===1)return "Posted Yesterday";
 if(days<7)return "Posted "+days+" days ago";
 if(days<30)return "Posted "+Math.floor(days/7)+" weeks ago";
 return "Posted "+new Intl.DateTimeFormat("en-IN",{
  day:"2-digit",month:"short",year:"numeric",timeZone:"Asia/Kolkata",
 }).format(new Date(value));
}

/** Legacy chip stages are independent of application channel. */
function learnerApplicationStageLabel(status:string){
  switch(status.toUpperCase()){
    case "SUBMITTED":case "APPLIED":return "Applied";
    case "SHORTLISTED":return "Shortlisted";
    case "ASSESSMENT":return "Assessment";
    case "INTERVIEW":return "Interview";
    case "WAITLISTED":return "Waitlisted";
    case "OFFERED":case "ISSUED":return "Offered";
    case "HIRED":case "ACCEPTED":return "Hired";
    case "REJECTED":case "DECLINED":return "Rejected";
    case "WITHDRAWN":return "Withdrawn";
    default:return humanize(status);
  }
}

export function LearnerPlacementJobs({
  items,snapshotNowIso=null,returnQuery="",savedJobIds=[],bookmarkActionsEnabled=true,
}: {
  items: readonly LearnerPlacementJobItem[];
  snapshotNowIso?:string|null;
  returnQuery?:string;
  savedJobIds?:readonly string[];
  bookmarkActionsEnabled?:boolean;
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="No open jobs right now"
        description="Published opportunities for your college will appear here with your eligibility and application state."
      />
    );
  }

  const byDrive = new Map<string,LearnerPlacementJobItem[]>();
  for(const item of items){
    const roles=byDrive.get(item.job.id)??[];
    roles.push(item);
    byDrive.set(item.job.id,roles);
  }
  // One semantic job card per published drive; roles are choices within it.
  // Save, application status and receipt actions remain role-specific.
  const grouped=[...byDrive.entries()];
  return (
    <div className="grid min-w-0 gap-4">
      {grouped.map(([driveId,roles]) => (
        <article key={driveId} className="relative min-w-0 overflow-hidden rounded-[var(--lms-canvas-radius)] border border-border bg-surface px-5 py-4 shadow-[var(--lms-elevation-1)]"
          aria-label={roles[0]?.job.title ?? "Placement drive"}>
          <span aria-hidden="true" className="absolute inset-y-0 left-0 w-[3px] bg-[var(--lms-primary)]" />
          <div className="divide-y divide-border/60">
          {roles.map((item,index) => {
        const firstRole=index===0;
        const urgency=learnerDriveDeadlineUrgency(item.job.applicationDeadline,item.deadlinePassed,snapshotNowIso);
        const jobDescriptionUrl=firstRole?safeLearnerPlacementUrl(item.job.legacyJobDescriptionUrl):null;
        const roleCount=roles.length;
        const failedChecks =
          item.eligibility.checks.filter(
            (check) => check.status === "FAIL",
          );
        const missingChecks =
          item.eligibility.checks.filter(
            (check) => check.status === "MISSING",
          );

        return (
          <section
            key={item.roleOption.id}
            className="min-w-0 py-4 first:pt-0 last:pb-0 md:py-5"
            aria-label={item.job.title+" · "+item.roleOption.title}
          >
            <div className="grid min-w-0 gap-3 md:gap-4 lg:grid-cols-[48px_minmax(0,1fr)_220px_44px]">
              <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-border bg-primary-subtle text-sm font-bold text-primary-text">
                {item.company.name.trim().split(/\s+/).slice(0,2).map(word=>word.charAt(0)).join("").toUpperCase()||"C"}
              </span>
              <div className="min-w-0 space-y-2">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  {firstRole?<StatusBadge tone="info">
                    {item.job.jobTypeLabel?.trim()||humanize(item.job.employmentType)}
                  </StatusBadge>:null}
                  {item.application?<StatusBadge tone={item.application.status==="SUBMITTED"?"success":"neutral"}>
                    {learnerApplicationStageLabel(item.application.stage??item.application.status)}
                  </StatusBadge>:null}
                  {!item.canApply&&!item.application?<StatusBadge tone="warning">Not open to you</StatusBadge>:null}
                  {item.deadlinePassed?<StatusBadge tone="neutral">Applications closed</StatusBadge>:null}
                </div>
                <h2 className="m-0 break-words text-lg font-semibold leading-snug text-foreground">
                  <Link href={learnerJobDetailFromDrivesHref(item.job.id,returnQuery)??"/learn/my-placements/jobs"}
                    aria-label={"View "+item.roleOption.title+" at "+item.company.name}
                    className="text-link underline-offset-2 hover:underline focus-visible:underline">
                    {item.roleOption.title}
                  </Link>
                </h2>
                <p className="m-0 break-words text-sm text-body">
                  {item.company.name}
                  {roleCount>1?" · "+roleCount+" role options":""}
                  {item.roleOption.title!==item.job.title?" · "+item.job.title:""}
                </p>
                {item.job.description?<p className="line-clamp-2 break-words text-sm leading-6 text-body">
                  {item.job.description}
                </p>:null}
                {jobDescriptionUrl?.startsWith("https://")?<a href={jobDescriptionUrl}
                  rel="noopener noreferrer" referrerPolicy="no-referrer"
                  className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline md:min-h-9">
                  View job description ↗
                </a>:null}
              </div>
              <div className="flex min-w-0 flex-wrap items-center gap-2 sm:justify-end">
              {bookmarkActionsEnabled?<LearnerSaveDriveButton jobId={item.job.id} jobTitle={item.job.title} initialSaved={savedJobIds.includes(item.job.id)}/>:
                <span role="status" className="text-xs text-muted-foreground">Bookmarks unavailable</span>}
              {firstRole?<StatusBadge tone="info">{item.job.jobTypeLabel?.trim() || humanize(item.job.employmentType)}</StatusBadge>:null}
               {item.application ? (
                 <StatusBadge tone={item.application.status==="SUBMITTED"?"success":"neutral"}>
                   {learnerApplicationStageLabel(item.application.stage??item.application.status)}
                 </StatusBadge>
               ) : null}
              <StatusBadge
                tone={eligibilityTone(
                  item.eligibility.status,
                )}
              >
                {humanize(item.eligibility.status)}
              </StatusBadge>
              </div>
            </div>

            <p className="mt-3 text-xs font-medium text-muted-foreground">{postedAtLabel(item.job.publishedAt,snapshotNowIso)}</p>
            {item.roleOption.minimumAnnualCtcInr===null&&item.roleOption.maximumAnnualCtcInr===null
              ?<p className="mt-1 text-xs text-muted-foreground">Compensation: Not disclosed</p>:null}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="sr-only">Deadline</span>
              <StatusBadge tone={urgency.tone}>{urgency.label}</StatusBadge>
            </div>
            {!item.canApply && !item.application ? (
              <div className="mt-3 min-w-0 border-t border-border pt-3 text-sm text-body"
                aria-label="Why this role is not open to you">
                <p className="font-semibold text-foreground">Not open to you</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {(item.applicationBlockers??["Your placement cell has not opened this role for your application."])
                    .map(reason=><li key={reason}>{reason}</li>)}
                </ul>
              </div>
            ) : null}
            {failedChecks.length > 0 ||
            missingChecks.length > 0 ? (
              <div className="mt-4 min-w-0 border-t border-border pt-3">
                <p className="m-0 text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                  Eligibility evidence
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {failedChecks.map((check) => (
                    <StatusBadge
                      key={check.criterion}
                      tone="error"
                    >
                      {check.criterion}: not met
                    </StatusBadge>
                  ))}
                  {missingChecks.map((check) => (
                    <StatusBadge
                      key={check.criterion}
                      tone="warning"
                    >
                      {check.criterion}: missing
                    </StatusBadge>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-5 border-t border-border pt-4">
              <JobActions item={item} />
            </div>
          </section>
        );
          })}
          </div>
        </article>
      ))}
    </div>
  );
}
