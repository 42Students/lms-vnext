import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {getOwnLearnerAcademicSummary} from "@/modules/people/learner-academic-summary-service";
import {getOwnLearnerProfileDataActions} from "@/modules/people/learner-profile-data-access-service";

/** LEARNER-profile-misc-18: self-only, read-only data-access explanation. */
export default async function LearnerProfileDataAccessPage(){
 const context=await getCurrentRequestContext();
 const [history,academic]=await Promise.all([
  getOwnLearnerProfileDataActions(context),
  getOwnLearnerAcademicSummary(context),
 ]);
 return <div className="min-w-0 space-y-5">
  <Link href="/learn/profile" className="inline-flex min-h-11 md:min-h-9 items-center text-sm font-semibold text-primary-text underline">← Profile</Link>
  <PageHeader title="Who has my data" description="Your saved academic details, access boundaries and recorded changes."/>
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
   <p className="mt-2 max-w-3xl break-words text-sm leading-6 text-body">Your current college may manage your program enrollment and class records. This is not a published transcript or proof of degree completion.</p>
   <p className="mt-2 max-w-3xl break-words text-sm leading-6 text-body">Current program: {academic.enrollment?.program??"Not recorded"}</p>
   <Link href="/learn/profile/academic-record" className="mt-3 inline-flex min-h-11 md:min-h-9 items-center font-semibold text-primary-text underline">View academic record →</Link>
  </section>
  <section aria-labelledby="data-access-changes" className="min-w-0 border-t border-border pt-4">
   <h2 id="data-access-changes" className="text-base font-semibold leading-6 text-[var(--lms-heading)]">Recent recorded profile-related changes</h2>
   <p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground">Only saved events directly referencing your current college membership are listed. Access without a recorded change cannot be shown.</p>
   {history.length?<ol className="mt-3 divide-y divide-border">
    {history.map((event,index)=><li key={event.occurredAt.toISOString()+":"+index}
     className="min-w-0 py-3 first:pt-0 last:pb-0 text-sm leading-6 text-body">
      <p className="max-w-3xl break-words">{event.summary}</p>
      <time className="mt-1 block text-xs text-muted-foreground" dateTime={event.occurredAt.toISOString()}>
       {new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(event.occurredAt)} IST
      </time>
     </li>)}
   </ol>:<p role="status" className="mt-3 text-sm text-body">No recorded membership changes to display.</p>}
  </section>
 </div>;
}
