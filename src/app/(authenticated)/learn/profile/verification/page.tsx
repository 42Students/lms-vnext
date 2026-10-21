import { PageHeader } from "@/components/ui/page-header";
import {StatusBadge} from "@/components/ui/status-badge";
import {Banner} from "@/components/ui/banner";
import Link from "next/link";
import {LearnerVerificationLiveRefresh} from "@/components/profile/learner-verification-live-refresh";
import {learnerVerificationNoticeCopy} from "@/modules/placements/learner-verification-notice-model";
import { getCurrentRequestContext } from "@/auth/request-context";
import { getOwnLearnerVerificationStatus } from "@/modules/placements/learner-verification-status-service";
import {getOwnLearnerProfileWithRuntime} from "@/modules/people/runtime";
import {learnerProfileDocumentSchema} from "@/modules/people/profile-validation";
import {LearnerVerificationSubmit} from "@/components/profile/learner-verification-submit";
import {LearnerVerificationWithdraw} from "@/components/profile/learner-verification-withdraw";
import {learnerVerificationDateLabel,learnerVerificationSubmissionDateFallback} from "@/modules/placements/learner-verification-date-model";

const details = [
  { key: "education", section:"EDUCATION", heading: "Education", edit: "/learn/profile?section=education" },
  { key: "identity", section:"IDENTITY", heading: "Identity", edit: "/learn/profile?section=identity" },
] as const;

export default async function LearnerVerificationPage() {
  const context = await getCurrentRequestContext();
  const [status,currentProfile]=await Promise.all([
    getOwnLearnerVerificationStatus(context),
    getOwnLearnerProfileWithRuntime(context).catch(()=>null),
  ]);
  // Legacy GET /profile/verification maps to this membership-scoped SSR
  // reader. Legacy POST /{section}/submit maps to /api/profile-verification/self
  // with {section,expectedVersion}; the server never accepts a learner ID.
  const document=currentProfile
    ?learnerProfileDocumentSchema.parse(currentProfile.profile.profileDocument):null;
  const currentEducation=document?.education??null;
  const mask=(value:string)=>value?"•••• "+value.slice(-4):"Not saved";
  const label = {
    NOT_SUBMITTED: "Incomplete", WAITING: "Waiting for the college",
    SENT_BACK: "Needs a change", VERIFIED: "Verified", UPDATE_PENDING: "Verified · update waiting",
  } as const;
  return <div className="min-w-0 space-y-6">
    <Link href="/learn/profile" className="inline-flex min-h-11 md:min-h-9 items-center text-sm font-semibold text-link hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">← Profile</Link>
    <LearnerVerificationLiveRefresh />
    <PageHeader title="Profile verification"
      description="Your own Education and Identity review status. A saved detail does not mean it is verified." />
    <section aria-label="Current identity document comparison" className="border-t border-border pt-4">
      <details>
        <summary className="min-h-11 cursor-pointer text-sm font-semibold text-link">Compare saved identity and verification evidence</summary>
        <p className="mt-2 text-xs text-muted-foreground">
          Masked values below come from your current saved profile, not an approved identity snapshot.
          For privacy, a verified identity number is never repeated in this summary.
        </p>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="font-semibold">Aadhaar (current)</dt><dd className="mt-1">{document?mask(document.identity.aadhaarNumber):"Unavailable"}</dd></div>
          <div><dt className="font-semibold">PAN (current)</dt><dd className="mt-1">{document?mask(document.identity.panNumber):"Unavailable"}</dd></div>
        </dl>
        <p className="mt-2 text-xs text-body">Document readiness is shown in your private evidence receipts below. A clean scan does not mean the college has verified an identity.</p>
      </details>
    </section>
    <section aria-labelledby="own-private-receipts" className="border-t border-border pt-5">
      <h2 id="own-private-receipts" className="text-base font-semibold text-[var(--lms-heading)]">Your saved private evidence receipts</h2>
      <p className="mt-2 text-sm text-body">These counts describe private upload receipts and scan status, not verified documents or proof that a reviewer has accepted them. Rejected, revoked and expired receipts cannot be used for approval.</p>
      <ul className="mt-4 grid min-w-0 gap-3 md:grid-cols-2">
        {status.evidence.map(item=><li key={item.purpose} className="min-h-11 min-w-0 border-b border-[var(--lms-canvas-border)] py-3 md:py-4">
          <p className="text-sm font-semibold text-foreground">{item.purpose === "AADHAAR"?"Identity (Aadhaar)":item.purpose === "PAN"?"Identity (PAN)":item.purpose === "MARKSHEET"?"Education marksheets":"Resume"}</p>
          <p className="mt-1 text-sm text-body">{item.cleanScanCount} clean scans · {item.pendingScanCount} scans pending · {item.recorded} active receipts</p>
        </li>)}
      </ul>
    </section>
    <div className="grid min-w-0 gap-4 md:grid-cols-2">{details.map(item => {
      const row = status[item.key];
      return <section key={item.key} className="min-w-0 border-t border-[var(--lms-canvas-border)] pt-4 md:pt-6">
        <h2 className="text-lg font-semibold text-[var(--lms-heading)]">{item.heading}</h2>
        <div className="mt-2"><StatusBadge tone={row.status==="VERIFIED"?"success":row.status==="SENT_BACK"?"warning":row.status==="NOT_SUBMITTED"?"neutral":"info"}>{row.status==="NOT_SUBMITTED"&&row.missing.length===0?
          "Ready to send":label[row.status]}</StatusBadge></div>
        {row.status==="NOT_SUBMITTED"&&row.missing.length===0?<p role="status" className="mt-2 text-xs text-body">Ready, but not submitted or verified. Use Send for review to request college verification.</p>:null}
        {learnerVerificationNoticeCopy({status:row.status,reason:row.reason,
          decidedByName:row.decidedByName,verifiedAt:row.verifiedAt,
          heading:item.heading})?<Banner tone={row.status==="SENT_BACK"?"warning":"info"} className="mt-2 whitespace-pre-wrap">
          {learnerVerificationNoticeCopy({status:row.status,reason:row.reason,
          decidedByName:row.decidedByName,verifiedAt:row.verifiedAt,heading:item.heading})}</Banner>:null}
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
        {item.section==="EDUCATION"&&row.changedSinceVerification?<Banner tone="warning" className="mt-3">
          Your current education details differ from the last verified record. Submit an update for college review.
        </Banner>:null}
        {item.section==="EDUCATION"&&row.submittedEducation.length>0?<section className="mt-4 border-t border-border pt-3"
          aria-label="Education submitted for review">
          <h3 className="text-sm font-semibold text-[var(--lms-heading)]">Education submitted for review</h3>
          <ul className="mt-2 divide-y divide-border">{row.submittedEducation.map((entry,index)=><li key={index} className="space-y-1 py-3 text-sm text-body">
            <p className="font-semibold text-foreground">{entry.qualification||"Qualification not recorded"}</p>
            <p>{[entry.program,entry.specialization,entry.institution].filter(Boolean).join(" · ")||"Institution not recorded"}</p>
            <p>{[entry.year&&"Year "+entry.year,entry.grading,entry.grade&&"Grade "+entry.grade,entry.maximum&&"Maximum "+entry.maximum].filter(Boolean).join(" · ")}</p>
            <p className="text-xs text-muted-foreground">{entry.marksheetRecorded?"Marksheet receipt linked (private)":"No marksheet link in submitted snapshot"}</p>
          </li>)}</ul>
        </section>:null}
        {item.section==="EDUCATION"&&currentEducation?<section className="mt-4 border-t border-border pt-3"
          aria-label="Current saved education compared with the submission">
          <h3 className="text-sm font-semibold text-[var(--lms-heading)]">Current saved education (not automatically submitted)</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Compare these current fields with Education submitted for review above. Edits do not replace a submitted or approved snapshot until you send another review request.
          </p>
          {currentEducation.length===0?<p className="mt-2 text-sm text-body">No current education entries are saved.</p>:
            <ul className="mt-2 divide-y divide-border">{currentEducation.map(entry=><li key={entry.id} className="space-y-1 py-3 text-sm text-body">
              <p className="font-semibold text-foreground">{entry.educationType||"Qualification not recorded"}</p>
              <p>{[entry.program,entry.specialization,entry.institution].filter(Boolean).join(" · ")||"Institution not recorded"}</p>
              <p>{[entry.endYear&&"Year "+entry.endYear,entry.gradingType,entry.gradeObtained&&"Grade "+entry.gradeObtained,
                entry.maxGrade&&"Maximum "+entry.maxGrade].filter(Boolean).join(" · ")}</p>
              <p className="text-xs text-muted-foreground">Private marksheet availability is checked separately from these editable details.</p>
            </li>)}</ul>}
          <Link href="/learn/profile?section=education" className="mt-2 inline-flex min-h-9 items-center font-semibold text-link underline">
            Review or edit my education details
          </Link>
        </section>:null}
        {item.section==="EDUCATION"&&row.verifiedEducation.length>0?<details className="mt-3 border-t border-border pt-3">
          <summary className="cursor-pointer text-sm font-semibold text-link">Last verified education snapshot</summary>
          <ul className="mt-2 list-disc pl-5 text-sm text-body">{row.verifiedEducation.map((entry,index)=><li key={index}>
            {entry.qualification||"Qualification"} · {[entry.institution,entry.grade].filter(Boolean).join(" · ")||"No recorded details"}
          </li>)}</ul>
        </details>:null}
        {row.decidedByName?<p className="mt-2 text-xs text-muted-foreground">Reviewed by: {row.decidedByName}</p>:null}
        {row.verifiedAt?<p className="mt-1 text-xs text-muted-foreground">Verified at: {learnerVerificationDateLabel(row.verifiedAt)}</p>:null}
        {item.section==="IDENTITY"?<Link href="/learn/profile?section=identity"
          className="mt-3 inline-flex min-h-9 items-center font-semibold text-link underline">
          Review my saved identity details privately
        </Link>:null}
        {row.status === "SENT_BACK" ? <p className="mt-2 whitespace-pre-wrap break-words text-sm text-body">
          Reason: {row.reason ?? "Contact the placement cell for the review reason."}
        </p> : null}
        {row.missing.length>0?<section className="mt-4 min-w-0 border-t border-border pt-3"
          aria-label={"What is still missing for "+item.heading}>
          <h3 className="text-sm font-semibold text-[var(--lms-heading)]">What is still missing</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-body">
            {row.missing.map(message=><li key={message}>{message}</li>)}
          </ul>
        </section>:<p className="mt-3 text-sm text-body">No missing items are indicated by the saved profile and receipt metadata.</p>}
        <p className="mt-3 text-xs text-muted-foreground">{item.section==="EDUCATION"
          ? "For verification, provide 10th, 12th or Diploma, and degree education with marks and their marksheets, plus a resume."
          : "For verification, provide Aadhaar or PAN details with a clean private document."}</p>
        <p className="mt-2 text-xs text-muted-foreground">A clean scan must be linked to the matching education entry or identity document and remain active, unexpired and owned by your membership. This checklist is preliminary. A clean receipt does not prove storage ownership or final eligibility; the submission server checks the actual private objects. Uploads awaiting scanning are not ready.</p>
        {row.status === "UPDATE_PENDING" ? <LearnerVerificationWithdraw
          key={item.section+":"+row.version} section={item.section}
          expectedVersion={row.version}/> : null}
        {row.canResubmit ? <LearnerVerificationSubmit key={item.section+":"+row.version} section={item.section as "EDUCATION"|"IDENTITY"} expectedVersion={row.version} status={row.status} /> : null}
        <Link href={item.edit} className="mt-3 inline-flex min-h-11 md:min-h-9 items-center text-sm font-semibold text-link underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Review {item.heading.toLowerCase()} details</Link>
      </section>;
    })}</div>
  </div>;
}
