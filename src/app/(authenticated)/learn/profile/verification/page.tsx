import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { getOwnLearnerVerificationStatus } from "@/modules/placements/learner-verification-status-service";
import {LearnerVerificationSubmit} from "@/components/profile/learner-verification-submit";
import {learnerVerificationDateLabel,learnerVerificationSubmissionDateFallback} from "@/modules/placements/learner-verification-date-model";

const details = [
  { key: "education", section:"EDUCATION", heading: "Education", edit: "/learn/profile?section=education" },
  { key: "identity", section:"IDENTITY", heading: "Identity", edit: "/learn/profile?section=identity" },
] as const;

export default async function LearnerVerificationPage() {
  const context = await getCurrentRequestContext();
  const status = await getOwnLearnerVerificationStatus(context);
  const label = {
    NOT_SUBMITTED: "Not submitted", WAITING: "Waiting for review",
    SENT_BACK: "Sent back", VERIFIED: "Verified", UPDATE_PENDING: "Update waiting for review",
  } as const;
  return <main className="min-w-0 space-y-6">
    <Link href="/learn/profile" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text">← Profile</Link>
    <header><h1 className="text-2xl font-semibold text-foreground">Profile verification</h1>
      <p className="mt-2 text-sm text-body">Your own Education and Identity review status. A saved detail does not mean it is verified.</p>
    </header>
    <section aria-labelledby="own-private-receipts" className="rounded-xl border border-border bg-surface p-4 sm:p-5">
      <h2 id="own-private-receipts" className="text-base font-semibold text-foreground">Your saved private evidence receipts</h2>
      <p className="mt-2 text-sm text-body">These counts describe private upload receipts and scan status, not verified documents or proof that a reviewer has accepted them. Rejected, revoked and expired receipts cannot be used for approval.</p>
      <ul className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2">
        {status.evidence.map(item=><li key={item.purpose} className="min-w-0 rounded-lg border border-border p-3">
          <p className="text-sm font-semibold text-foreground">{item.purpose === "AADHAAR"?"Identity (Aadhaar)":item.purpose === "PAN"?"Identity (PAN)":item.purpose === "MARKSHEET"?"Education marksheets":"Resume"}</p>
          <p className="mt-1 text-sm text-body">{item.cleanScanCount} clean scans · {item.pendingScanCount} scans pending · {item.recorded} active receipts</p>
        </li>)}
      </ul>
    </section>
    <div className="grid min-w-0 gap-4 sm:grid-cols-2">{details.map(item => {
      const row = status[item.key];
      return <section key={item.key} className="min-w-0 rounded-xl border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold text-foreground">{item.heading}</h2>
        <p className="mt-2 text-sm font-semibold text-body">{label[row.status]}</p>
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
        <p className="mt-3 text-xs text-muted-foreground">Update profile details and privately uploaded evidence before submitting. The server checks the real stored documents; a pending upload is not sufficient.</p>
        {row.canResubmit ? <LearnerVerificationSubmit key={item.section+":"+row.version} section={item.section as "EDUCATION"|"IDENTITY"} expectedVersion={row.version} status={row.status} /> : null}
        <Link href={item.edit} className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline">Review {item.heading.toLowerCase()} details</Link>
      </section>;
    })}</div>
  </main>;
}
