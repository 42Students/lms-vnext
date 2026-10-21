import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {getOwnLearnerAcademicSummary} from "@/modules/people/learner-academic-summary-service";
import {getOwnLearnerProfileDataActions} from "@/modules/people/learner-profile-data-access-service";
import {requireOwnLearnerProfileAccess} from "@/modules/people/learner-profile-access-service";
import {getDb} from "@/db/client";
import {and,desc,eq,sql} from "drizzle-orm";
import {placementApplications,placementJobs,placementCompanyRelationships,placementCompanies} from "@/db/schema";
import {placementCompanyShareSelections} from "@/db/schema/placement-company-share-selection";
import {placementCompanyApplicantShares} from "@/db/schema/placement-company-shares";

/** LEARNER-profile-misc-18: self-only, read-only data-access explanation. */
export default async function LearnerProfileDataAccessPage(){
 const context=await getCurrentRequestContext();
 const member=await requireOwnLearnerProfileAccess(context);
 const [history,academic,shares]=await Promise.all([
  getOwnLearnerProfileDataActions(context),
  getOwnLearnerAcademicSummary(context),
  getDb().select({
   shareId:placementCompanyApplicantShares.id,
   company:placementCompanies.name,
   job:placementJobs.title,
   sharedAt:placementCompanyApplicantShares.createdAt,
   firstDownloadedAt:sql<Date|null>`(select min(view.occurred_at) from placement_company_applicant_share_views view
      where view.share_id=${placementCompanyApplicantShares.id} and view.event_kind='CSV')`,
  }).from(placementCompanyShareSelections)
   .innerJoin(placementApplications,eq(placementApplications.id,placementCompanyShareSelections.applicationId))
   .innerJoin(placementCompanyApplicantShares,
     eq(placementCompanyApplicantShares.id,placementCompanyShareSelections.shareId))
   .innerJoin(placementJobs,and(eq(placementJobs.id,placementCompanyApplicantShares.jobId),
     eq(placementJobs.collegeId,placementCompanyApplicantShares.collegeId)))
   .innerJoin(placementCompanyRelationships,
     eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId))
   .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
   .where(and(eq(placementApplications.membershipId,member.id),
     eq(placementCompanyApplicantShares.collegeId,member.collegeId)))
   .orderBy(desc(placementCompanyApplicantShares.createdAt),desc(placementCompanyApplicantShares.id))
   .limit(50),
 ]);
 return <div className="min-w-0 space-y-5">
  <Link href="/learn/profile" className="inline-flex min-h-11 md:min-h-9 items-center text-sm font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">← Profile</Link>
  <PageHeader title="Who has my data" description="Your saved academic details, access boundaries and recorded changes."/>
  <p className="max-w-3xl text-xs leading-5 text-muted-foreground">
    The old learner academic-record and data-access GET endpoints are represented by
    authenticated, membership-scoped pages at <Link href="/learn/profile/academic-record" className="font-semibold text-link underline">Academic record</Link> and this page.
    Requests are always scoped to your signed-in membership; no other learner identifier is accepted.
    Imported legacy date-times are displayed in Asia/Kolkata (IST); when the source lacked a timezone,
    migration provenance must be checked before interpreting an original instant.
  </p>
  <section aria-labelledby="data-access-permissions" className="min-w-0 border-t border-border pt-4">
   <h2 id="data-access-permissions" className="text-base font-semibold leading-6 text-[var(--lms-heading)]">Who may use your information</h2>
   <ul className="mt-3 max-w-3xl list-disc space-y-2 pl-5 text-sm leading-6 text-body">
    <li>Your college administrators may update college-owned enrollment and student records under their assigned permissions.</li>
    <li>Authorized placement staff may use relevant profile details when checking eligibility and managing placement participation.</li>
    <li>Recruiters receive only information deliberately shared through college-authorized placement workflows, subject to their access permissions.</li>
   </ul>
   <p role="status" className="mt-3 border-l-2 border-[var(--lms-info)] bg-[var(--lms-info-subtle)] px-4 py-3 text-sm leading-[1.5] text-body">This page is a summary of access permissions, not a list of people who opened your profile. A complete record of profile views is not available; no view or consent is inferred.</p>
  </section>
  <section aria-labelledby="data-access-academic-record" className="min-w-0 border-t border-border pt-4">
   <h2 id="data-access-academic-record" className="text-base font-semibold leading-6 text-[var(--lms-heading)]">Academic record</h2>
   <p className="mt-2 max-w-3xl break-words text-sm leading-[22px] text-body">Your current college may manage your program enrollment and class records. This is not a published transcript or proof of degree completion.</p>
   <p className="mt-2 max-w-3xl break-words text-sm leading-[22px] text-body">Current program: {academic.enrollment?.program??"Not recorded"}</p>
   <Link href="/learn/profile/academic-record" className="mt-3 inline-flex min-h-11 md:min-h-9 items-center font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">View academic record →</Link>
  </section>
  <section aria-labelledby="data-access-company-shares" className="min-w-0 border-t border-border pt-4">
   <h2 id="data-access-company-shares" className="text-base font-semibold leading-6 text-[var(--lms-heading)]">Shared with companies</h2>
   <p className="mt-1 text-xs leading-5 text-muted-foreground">Recent employer shortlist shares containing one of your placement applications, newest first (up to 50). Recipient email is not captured by this capability, so the company is shown instead of inventing a contact. A recorded CSV export is not proof that your row was viewed.</p>
   {shares.length?<ul className="mt-3 divide-y divide-border">{shares.map(share=>
    <li key={share.shareId} className="min-w-0 space-y-1 py-3 text-sm text-body">
     <p className="font-semibold text-[var(--lms-heading)]">{share.company} · {share.job}</p>
     <p>External recipient: {share.company} (individual recipient not recorded)</p>
     <p>Shared: <time dateTime={share.sharedAt.toISOString()}>{new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(share.sharedAt)} IST</time></p>
     <p>First recorded download: {share.firstDownloadedAt?<time dateTime={new Date(String(share.firstDownloadedAt)).toISOString()}>{new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(new Date(String(share.firstDownloadedAt)))} IST</time>:"Never downloaded"}</p>
    </li>)}</ul>:<p role="status" className="mt-3 text-sm text-body">No companies have been given your data through a recorded placement shortlist share.</p>}
  </section>
  <section aria-labelledby="data-access-changes" className="min-w-0 border-t border-border pt-4">
   <h2 id="data-access-changes" className="text-base font-semibold leading-6 text-[var(--lms-heading)]">Recent recorded profile-related changes</h2>
   <p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground">Only saved events directly referencing your current college membership are listed. Access without a recorded change cannot be shown. Event timestamps are shown in IST; old LocalDateTime values without offsets cannot be reinterpreted without their original migration timezone.</p>
   {history.length?<ol className="mt-3 divide-y divide-border">
    {history.map((event,index)=><li key={event.occurredAt.toISOString()+":"+index}
     className="min-w-0 py-3 first:pt-0 last:pb-0 text-sm leading-6 text-body">
      <p className="max-w-3xl break-words">{event.summary}</p>
      <time className="mt-1 block text-xs text-muted-foreground" dateTime={event.occurredAt.toISOString()}>
       {new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(event.occurredAt)} IST
      </time>
     </li>)}
   </ol>:<p role="status" className="mt-3 text-sm text-body leading-[22px]">No recorded membership changes to display.</p>}
  </section>
 </div>;
}
