import Link from "next/link";
import {LearnerVerificationLiveRefresh} from "@/components/profile/learner-verification-live-refresh";
import {learnerVerificationNoticeCopy} from "@/modules/placements/learner-verification-notice-model";
import { getCurrentRequestContext } from "@/auth/request-context";
import { getOwnLearnerVerificationStatus } from "@/modules/placements/learner-verification-status-service";
import {LearnerVerificationSubmit} from "@/components/profile/learner-verification-submit";
import {LearnerVerificationWithdraw} from "@/components/profile/learner-verification-withdraw";
import {learnerVerificationDateLabel,learnerVerificationSubmissionDateFallback} from "@/modules/placements/learner-verification-date-model";

const details = [
  { key: "education", section:"EDUCATION", heading: "Education", edit: "/learn/profile?section=education" },
  { key: "identity", section:"IDENTITY", heading: "Identity", edit: "/learn/profile?section=identity" },
] as const;

export default async function LearnerVerificationPage() {
  const context = await getCurrentRequestContext();
  const status = await getOwnLearnerVerificationStatus(context);
  const label = {
    NOT_SUBMITTED: "Incomplete", WAITING: "Waiting for the college",
    SENT_BACK: "Needs a change", VERIFIED: "Verified", UPDATE_PENDING: "Verified · update waiting",
  } as const;
  return <div className="min-w-0 space-y-6">
    <Link href="/learn/profile" className="inline-flex min-h-11 sm:min-h-9 items-center text-sm font-semibold text-primary-text">← Profile</Link>
    <LearnerVerificationLiveRefresh />
    <header><h1 className="font-semibold text-[var(--lms-heading)] text-[30px] leading-9">Profile verification</h1>
      <p className="mt-2 text-sm text-body">Your own Education and Identity review status. A saved detail does not mean it is verified.</p>
    </header>
    <section aria-labelledby="own-private-receipts" className="border-t border-border pt-5">
      <h2 id="own-private-receipts" className="text-base font-semibold text-foreground">Your saved private evidence receipts</h2>
      <p className="mt-2 text-sm text-body">These counts describe private upload receipts and scan status, not verified documents or proof that a reviewer has accepted them. Rejected, revoked and expired receipts cannot be used for approval.</p>
      <ul className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2">
        {status.evidence.map(item=><li key={item.purpose} className="min-w-0 rounded-[var(--lms-control-radius)] border border-border p-3">
          <p className="text-sm font-semibold text-foreground">{item.purpose === "AADHAAR"?"Identity (Aadhaar)":item.purpose === "PAN"?"Identity (PAN)":item.purpose === "MARKSHEET"?"Education marksheets":"Resume"}</p>
          <p className="mt-1 text-sm text-body">{item.cleanScanCount} clean scans · {item.pendingScanCount} scans pending · {item.recorded} active receipts</p>
        </li>)}
      </ul>
    </section>
    <div className="grid min-w-0 gap-4 sm:grid-cols-2">{details.map(item => {
      const row = status[item.key];
      return <section key={item.key} className="min-w-0 border-b border-border py-5">
        <h2 className="text-lg font-semibold text-foreground">{item.heading}</h2>
        <p className="mt-2 text-sm font-semibold text-body">{row.status==="NOT_SUBMITTED"&&row.missing.length===0?
          "Ready to send":label[row.status]}</p>
        {learnerVerificationNoticeCopy({status:row.status,reason:row.reason,
          decidedByName:row.decidedByName,verifiedAt:row.verifiedAt,
          heading:item.heading})?<p role="status" className="mt-2 whitespace-pre-wrap text-sm text-body">
          {learnerVerificationNoticeCopy({status:row.status,reason:row.reason,
          decidedByName:row.decidedByName,verifiedAt:row.verifiedAt,heading:item.heading})}</p>:null}
        <dl className="mt-3 space-y-1 text-xs text-muted-foreground">
          <div className="flex flex-wrap gap-x-2">
            <dt>Last submitted:</dt>
            <dd>{learnerVerificationDateLabel(row.submittedAt) ? <time dateTime={row.submittedAt??undefined}>{learnerVerificationDateLabel(row.submittedAt)}</time> : learnerVerificationSubmissionDateFallback(row.submittedAt)}</dd>
          </div>
          {learnerVerificationDateLabel(row.decidedAt) ? <div className="flex flex-wrap gap-x-2">
            <dt>Last reviewed:</dt>
            <dd><time dateTime={row.decidedAt??undefined}>{learnerVerificationDateLabel(row.decidedAt)}</time></dd>
          </div> : null}
        </dl>
        {row.status === "SENT_BACK" ? <p className="mt-2 whitespace-pre-wrap break-words text-sm text-body">
          Reason: {row.reason ?? "Contact the placement cell for the review reason."}
        </p> : null}
        {row.missing.length>0?<section className="mt-4 rounded-[var(--lms-control-radius)] border border-border bg-surface-subtle p-3"
          aria-label={"What is still missing for "+item.heading}>
          <h3 className="text-sm font-semibold text-foreground">What is still missing</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-body">
            {row.missing.map(message=><li key={message}>{message}</li>)}
          </ul>
        </section>:<p className="mt-3 text-sm text-body">No missing items are indicated by the saved profile and receipt metadata.</p>}
        <p className="mt-3 text-xs text-muted-foreground">{item.section==="EDUCATION"
          ? "For verification, provide 10th, 12th or Diploma, and degree education with marks and their marksheets, plus a resume."
          : "For verification, provide Aadhaar or PAN details with a clean private document."}</p>
        <p className="mt-2 text-xs text-muted-foreground">This checklist is preliminary. A clean receipt does not prove storage ownership or final eligibility; the submission server checks the actual private objects. Uploads awaiting scanning are not ready.</p>
        {row.status === "UPDATE_PENDING" ? <LearnerVerificationWithdraw
          key={item.section+":"+row.version} section={item.section}
          expectedVersion={row.version}/> : null}
        {row.canResubmit ? <LearnerVerificationSubmit key={item.section+":"+row.version} section={item.section as "EDUCATION"|"IDENTITY"} expectedVersion={row.version} status={row.status} /> : null}
        <Link href={item.edit} className="mt-3 inline-flex min-h-11 sm:min-h-9 items-center text-sm font-semibold text-primary-text underline">Review {item.heading.toLowerCase()} details</Link>
      </section>;
    })}</div>
  </div>;
}
