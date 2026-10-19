import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ThirdPartyLink } from "@/components/ui/third-party-link";
import {learnerProfileSectionRecoveryNotice,learnerProfileResolveSection} from "@/modules/people/learner-profile-section-recovery-model";
import {learnerSavedCodingProfiles} from "@/modules/placements/learner-saved-coding-profiles-model";
import {requireOwnLearnerProfileAccess} from "@/modules/people/learner-profile-access-service";
import {learnerProfileAcademicRecovery} from "@/modules/people/learner-profile-recovery-model";
import {LearnerProfileAcademicRetry} from "@/components/profile/learner-profile-academic-retry";
import { getCurrentRequestContext } from "@/auth/request-context";
import { LearnerProfileWorkspace } from "@/components/profile/learner-profile-workspace";
import { PageHeader } from "@/components/ui/page-header";
import { getOwnLearnerProfileWithRuntime } from "@/modules/people/runtime";
import { getOwnLearnerAcademicSummary } from "@/modules/people/learner-academic-summary-service";
import {getOwnLearnerVerificationStatus} from "@/modules/placements/learner-verification-status-service";
import {learnerProfileMissingItems} from "@/modules/placements/learner-profile-missing-items-model";
import {learnerVerificationNoticeCopy} from "@/modules/placements/learner-verification-notice-model";
import {LearnerVerificationLiveRefresh} from "@/components/profile/learner-verification-live-refresh";

export default async function LearnerProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string | string[] }>;
}) {
  const query = await searchParams;
  const initialSection = learnerProfileResolveSection(query.section);
  const sectionNotice=learnerProfileSectionRecoveryNotice(query.section);
  const context = await getCurrentRequestContext();

  await requireOwnLearnerProfileAccess(context);
  const [{ person, profile }, academicOutcome] = await Promise.all([
    getOwnLearnerProfileWithRuntime(context),
    Promise.allSettled([getOwnLearnerAcademicSummary(context)]).then(([result])=>learnerProfileAcademicRecovery(result)),
  ]);
  const academic=academicOutcome.summary;
  const verificationOutcome=await Promise.allSettled([getOwnLearnerVerificationStatus(context)]);
  const verification=verificationOutcome[0]?.status==="fulfilled"?verificationOutcome[0].value:null;
  const missing=verification?learnerProfileMissingItems(verification):[];

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Profile"
      />
      <LearnerVerificationLiveRefresh/>
      <section aria-label="Profile verification summary" className="rounded-[var(--lms-canvas-radius,12px)] border border-border bg-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-foreground">Profile verification</h2>
          <Badge  tone="neutral">
            {verification&&["VERIFIED","UPDATE_PENDING"].includes(verification.education.status)&&
              ["VERIFIED","UPDATE_PENDING"].includes(verification.identity.status)
              ?"Verified profile":"Not verified yet"}
          </Badge>
        </div>
        {verification? <div className="mt-3 space-y-2 text-sm text-body">
          {(["education","identity"] as const).map(section=>{
            const row=verification[section];
            return <p key={section}>
              <strong>{section==="education"?"Education":"Identity"}:</strong>{" "}
              {learnerVerificationNoticeCopy({status:row.status,reason:row.reason,
                decidedByName:row.decidedByName,verifiedAt:row.verifiedAt,
                heading:section})??(row.status==="NOT_SUBMITTED"?"Not verified yet":row.status)}
            </p>;
          })}
          {verification.education.status==="UPDATE_PENDING"||verification.identity.status==="UPDATE_PENDING"?
            <p role="status" className="rounded-[var(--lms-control-radius,9px)] border border-warning bg-warning-subtle p-3">
              You changed this after it was verified. The verified details stay in use until you send the changes for review.
            </p>:null}
        </div>:<p role="status" className="mt-2 text-sm text-body">Verification status is temporarily unavailable.</p>}
        <Link href="/learn/profile/verification" className="mt-3 inline-flex min-h-11 sm:min-h-9 items-center text-sm font-semibold text-primary-text underline">Review verification status</Link>
      </section>
      {sectionNotice ? <p role="status" className="rounded-[var(--lms-control-radius,9px)] border border-warning bg-warning-subtle p-3 text-sm text-body">{sectionNotice}</p> : null}
      <section aria-label="Academic identity" className="border-b border-border pb-5">
        <h2 className="text-base font-semibold text-foreground">Academic identity</h2>
        <p className="mt-1 text-lg font-semibold text-foreground">{academic?.title??person.user.displayName??"Your profile"}</p>
        {!academicOutcome.available ? <div role="status" className="mt-3 text-sm text-body">
          <p>Your academic summary is temporarily unavailable. Your saved profile remains available below; no missing enrollment has been inferred.</p>
          <LearnerProfileAcademicRetry />
        </div> : academic?.enrollment ? (
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="font-semibold text-muted-foreground">Program</dt>
              <dd className="mt-1 text-foreground">{academic.enrollment.program}
                {academic.enrollment.programCode ? " · " + academic.enrollment.programCode : ""}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-muted-foreground">Batch / cohort</dt>
              <dd className="mt-1 text-foreground">{academic.enrollment.cohort ?? "Not recorded"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-muted-foreground">Department</dt>
              <dd className="mt-1 text-foreground">{academic.enrollment.department ?? "Not recorded"}</dd>
            </div>
          </dl>
        ) : (
          <p role="status" className="mt-3 text-sm text-body">
            No active program enrollment is recorded for your current college membership.
            This does not imply that your studies have ended. Contact your college administrator
            if your program should be listed.
          </p>
        )}
      </section>
      <Link href="/learn/profile/academic-record"
        className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text">
        View my academic record →
      </Link>
      <Link href="/learn/profile/data-access"
        className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text">
        Who has my data →
      </Link>
      <section aria-label="Verification status" className="rounded-[var(--lms-canvas-radius,12px)] border border-border bg-surface p-4 sm:p-6">
        <h2 className="text-base font-semibold text-foreground">Education and identity verification</h2>
        <p className="mt-2 text-sm text-body">View the actual college review state, including documents sent back with a reason. Saved profile details are not verification.</p>
        {verification?<div className="mt-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">What is still missing</h3>
          {missing.length?<ul className="list-disc space-y-1 pl-5 text-sm text-body">
            {missing.map(row=><li key={row.section+row.message}>
              <strong>{row.section}:</strong> {row.message}
            </li>)}
          </ul>:<p role="status" className="text-sm text-body">
            No missing items are reported by the saved profile and private receipt metadata.
          </p>}
          <p className="text-xs text-muted-foreground">
            For verification, provide 10th, 12th or Diploma and degree education with marks and
            marksheets, plus a resume. Provide Aadhaar or PAN details with a clean private document.
            A saved receipt is not final verification.
          </p>
        </div>:<p role="status" className="mt-3 text-sm text-body">
          Verification requirements are temporarily unavailable. Open the verification page to retry.
        </p>}
        <Link href="/learn/profile/verification" className="mt-3 inline-flex min-h-11 sm:min-h-9 items-center text-sm font-semibold text-primary-text underline">View my verification status →</Link>
      </section>
      <section aria-label="Coding profiles" className="min-w-0 border-b border-border pb-5">
        <h2 className="text-base font-semibold text-foreground">Coding platform profiles</h2>
        <p className="mt-1 text-sm text-body">Saved GitHub and coding-platform links are learner-authored, not verified skill evidence.</p>
        {learnerSavedCodingProfiles(profile.profileDocument).length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No valid coding-platform links saved yet.</p>
        ) : (
          <ul className="mt-3 flex min-w-0 flex-wrap gap-3">
            {learnerSavedCodingProfiles(profile.profileDocument).map(entry => (
              <li key={entry.platform}>
                <ThirdPartyLink href={entry.href} label={`${entry.label} ↗`} />
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-muted-foreground">Save GitHub under Social profiles; add other coding sites as URL-type entries under Additional information using the exact platform name.</p>
        <div className="flex flex-wrap gap-4">
          <Link href="/learn/profile?section=social-profiles" className="mt-3 inline-flex min-h-11 sm:min-h-9 items-center text-sm font-semibold text-primary-text underline">Edit GitHub →</Link>
          <Link href="/learn/profile?section=metadata" className="mt-3 inline-flex min-h-11 sm:min-h-9 items-center text-sm font-semibold text-primary-text underline">Edit coding links →</Link>
        </div>
      </section>
      <LearnerProfileWorkspace
        initialSection={initialSection}
        displayName={person.user.displayName}
        primaryEmail={person.user.email}
        primaryPhone={person.user.phoneE164}
        rollNumber={profile.rollNumber}
        registrationNumber={profile.registrationNumber}
        initialDocument={profile.profileDocument}
      />
    </div>
  );
}
