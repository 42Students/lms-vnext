import { Suspense } from "react";
import { AuthorizationError } from "@/modules/permissions/policy";
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
import { Banner } from "@/components/ui/banner";
import { getOwnLearnerProfileWithRuntime } from "@/modules/people/runtime";
import { getOwnLearnerAcademicSummary } from "@/modules/people/learner-academic-summary-service";
import {getOwnLearnerVerificationStatus} from "@/modules/placements/learner-verification-status-service";
import {learnerProfileMissingItems} from "@/modules/placements/learner-profile-missing-items-model";
import {learnerVerificationNoticeCopy} from "@/modules/placements/learner-verification-notice-model";
import {LearnerVerificationLiveRefresh} from "@/components/profile/learner-verification-live-refresh";

type ProfileParams={section?:string|string[]};
function ProfileLoading() {
  return <div className="min-w-0 space-y-4" data-testid="learner.profile.page.loading"
    aria-busy="true" aria-label="Loading profile">
    <PageHeader title="Profile"/>
    <div className="rounded-lg border border-border p-5" aria-hidden="true">
      <div className="flex items-center gap-4">
        <span className="h-16 w-16 shrink-0 animate-pulse rounded-full bg-muted"/>
        <div className="w-full space-y-3">
          <div className="h-5 w-1/3 animate-pulse rounded bg-muted"/>
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted"/>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {[1,2,3,4].map(key=><div key={key} className="h-16 animate-pulse rounded bg-muted"/>)}
      </div>
    </div>
  </div>;
}
export default function LearnerProfilePage({searchParams}:{searchParams:Promise<ProfileParams>}) {
  return <Suspense fallback={<ProfileLoading/>}><LearnerProfileContent searchParams={searchParams}/></Suspense>;
}
async function LearnerProfileContent({
  searchParams,
}: {
  searchParams: Promise<ProfileParams>;
}) {
  const query = await searchParams;
  const initialSection = learnerProfileResolveSection(query.section);
  const sectionNotice=learnerProfileSectionRecoveryNotice(query.section);
  const context = await getCurrentRequestContext();

  await requireOwnLearnerProfileAccess(context);
  const [profileOutcome, academicOutcome] = await Promise.allSettled([
    getOwnLearnerProfileWithRuntime(context),
    getOwnLearnerAcademicSummary(context),
  ]);
  if (profileOutcome.status === "rejected") {
    if (profileOutcome.reason instanceof AuthorizationError) throw profileOutcome.reason;
    return <div className="min-w-0 max-w-full space-y-4" data-testid="learner.profile.page.error">
      <PageHeader title="Profile"/>
      <section role="alert" className="rounded-lg border border-border px-5 py-10 text-center">
        <p className="text-sm text-body">We couldn&apos;t load your profile. Please try again.</p>
        <Link href="/learn/profile" className="mt-3 inline-flex min-h-11 items-center rounded-lg border border-border px-4 font-semibold text-primary-text underline md:min-h-9">Retry</Link>
      </section>
    </div>;
  }
  const {person,profile}=profileOutcome.value;
  const academicRecovery=learnerProfileAcademicRecovery(academicOutcome);
  const academic=academicRecovery.summary;
  const verificationOutcome=await Promise.allSettled([getOwnLearnerVerificationStatus(context)]);
  const verification=verificationOutcome[0]?.status==="fulfilled"?verificationOutcome[0].value:null;
  const missing=verification?learnerProfileMissingItems(verification):[];

  return (
    <div className="min-w-0 max-w-full space-y-4">
      <PageHeader
        title="Profile"
      />
      <LearnerVerificationLiveRefresh/>
      <section aria-label="Profile verification summary" className="min-w-0 border-b border-border pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-[var(--lms-heading)]">Profile verification</h2>
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
            <Banner tone="warning">
              You changed this after it was verified. The verified details stay in use until you send the changes for review.
            </Banner>:null}
        </div>:<Banner tone="info" className="mt-2">Verification status is temporarily unavailable.</Banner>}
        <Link href="/learn/profile/verification" className="mt-3 inline-flex min-h-11 md:min-h-9 items-center text-sm font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Review verification status</Link>
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

      <section aria-label="Private evidence receipts" className="min-w-0 border-b border-border pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-[var(--lms-heading)]">Private identity, marksheet and resume receipts</h2>
          <Link href="/learn/profile/verification"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline md:min-h-9">
            Review receipts and verification →
          </Link>
        </div>
        {verification ? (
          <ul className="mt-3 grid min-w-0 gap-3 sm:grid-cols-2">
            {verification.evidence.map(item => (
              <li key={item.purpose} className="min-w-0 border-b border-border py-3">
                <p className="text-sm font-semibold text-foreground">
                  {item.purpose==="AADHAAR"?"Aadhaar":item.purpose==="PAN"?"PAN":
                    item.purpose==="MARKSHEET"?"Education marksheets":"Resume"}
                </p>
                <p className="mt-1 text-sm text-body">
                  {item.recorded} active private receipt(s) · {item.cleanScanCount} clean scan(s)
                  {item.pendingScanCount ? " · "+item.pendingScanCount+" scanning" : ""}
                </p>
              </li>
            ))}
          </ul>
        ) : <Banner tone="warning" className="mt-2">
          Private receipt status couldn't load. No saved document has been assumed.
          <Link href="/learn/profile/verification"
            className="ml-2 inline-flex min-h-9 items-center font-semibold text-primary-text underline">Retry receipts</Link>
        </Banner>}
        <p className="mt-3 max-w-3xl text-xs leading-5 text-muted-foreground">
          Only receipt counts and scan states appear here. Private Aadhaar/PAN numbers and
          underlying identity files are not exposed through this profile summary.
          A clean scan is not college verification or a default-resume selection.
        </p>
        <nav aria-label="Private profile details" className="mt-3 flex flex-wrap gap-4">
          <Link href="/learn/profile?section=identity" className="inline-flex min-h-9 items-center text-sm font-semibold text-link underline">
            Review identity details →
          </Link>
          <Link href="/learn/profile?section=education" className="inline-flex min-h-9 items-center text-sm font-semibold text-link underline">
            Review education details →
          </Link>
        </nav>
      </section>
      {sectionNotice ? <Banner tone="warning">{sectionNotice}</Banner> : null}
      <section aria-label="Academic identity" className="min-w-0 border-b border-border pb-4">
        <h2 className="text-base font-semibold text-[var(--lms-heading)]">Academic identity</h2>
        <p className="mt-1 text-lg font-semibold text-foreground">{academic?.title??person.user.displayName??"Your profile"}</p>
        {!academicRecovery.available ? <Banner tone="info" className="mt-3">
          <p>Program couldn't load. Your saved profile remains available; no missing enrollment has been inferred.</p>
          <LearnerProfileAcademicRetry />
        </Banner> : academic?.enrollment ? (
          <dl className="mt-4 grid min-w-0 gap-3 text-sm min-[768px]:grid-cols-2 min-[1280px]:grid-cols-3">
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
          <Banner tone="info" className="mt-3">
            No active program enrollment is recorded for your current college membership.
            This does not imply that your studies have ended. Contact your college administrator
            if your program should be listed.
          </Banner>
        )}
      </section>
      <nav aria-label="Profile resources" className="flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
      <Link href="/learn/profile/academic-record"
        className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
        View my academic record →
      </Link>
      <Link href="/learn/profile/data-access"
        className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
        Who has my data →
      </Link>
      </nav>
      <section aria-label="Verification status" className="min-w-0 border-b border-border pb-4">
        <h2 className="text-base font-semibold text-[var(--lms-heading)]">Education and identity verification</h2>
        <p className="mt-2 text-sm text-body">View the actual college review state, including documents sent back with a reason. Saved profile details are not verification.</p>
        {verification?<div className="mt-4 space-y-3">
          <h3 className="text-sm font-semibold text-[var(--lms-heading)]">What is still missing</h3>
          {missing.length?<ul className="list-disc space-y-1 pl-6 text-sm text-body">
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
        <Link href="/learn/profile/verification" className="mt-3 inline-flex min-h-11 md:min-h-9 items-center text-sm font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">View my verification status →</Link>
      </section>
      <section aria-label="Coding profiles" className="min-w-0 border-b border-border pb-6">
        <h2 className="text-base font-semibold text-[var(--lms-heading)]">Coding platform profiles</h2>
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
          <Link href="/learn/profile?section=social-profiles" className="mt-3 inline-flex min-h-11 md:min-h-9 items-center text-sm font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Edit GitHub →</Link>
          <Link href="/learn/profile?section=metadata" className="mt-3 inline-flex min-h-11 md:min-h-9 items-center text-sm font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Edit coding links →</Link>
        </div>
      </section>
    </div>
  );
}
