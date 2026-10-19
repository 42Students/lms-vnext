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
 return <main className="min-w-0 space-y-6">
  <Link href="/learn/profile" className="inline-flex min-h-9 sm:min-h-9 items-center text-sm font-semibold text-primary-text underline">← Profile</Link>
  <PageHeader title="Who has my data" description="Your saved academic details, access boundaries and recorded changes."/>
  <section className="border-t border-border pt-5">
   <h2 className="font-semibold text-foreground">Academic record</h2>
   <p className="mt-2 text-sm text-body">Your current college may manage your program enrollment and class records. This is not a published transcript or proof of degree completion.</p>
   <p className="mt-2 text-sm text-body">Current program: {academic.enrollment?.program??"Not recorded"}</p>
   <Link href="/learn/profile/academic-record" className="mt-3 inline-flex min-h-9 sm:min-h-9 items-center font-semibold text-primary-text underline">View academic record →</Link>
  </section>
  <section className="border-t border-border pt-5">
   <h2 className="font-semibold text-foreground">Who may use your information</h2>
   <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-body">
    <li>Your college administrators may update college-owned enrollment and student records under their assigned permissions.</li>
    <li>Authorized placement staff may use relevant profile details when checking eligibility and managing placement participation.</li>
    <li>Recruiters receive only information deliberately shared through college-authorized placement workflows, subject to their access permissions.</li>
   </ul>
   <p role="status" className="mt-3 rounded-[var(--lms-control-radius)] border border-border bg-surface-subtle p-3 text-sm text-body">This page is a summary of access permissions, not a list of people who opened your profile. A complete record of profile views is not available; no view or consent is inferred.</p>
  </section>
  <section className="border-t border-border pt-5">
   <h2 className="font-semibold text-foreground">Recent recorded profile-related changes</h2>
   <p className="mt-1 text-sm text-muted-foreground">Only saved events directly referencing your current college membership are listed. Access without a recorded change cannot be shown.</p>
   {history.length?<ol className="mt-3 space-y-3">
    {history.map((event,index)=><li key={event.occurredAt.toISOString()+":"+index}
     className="border-b border-border pb-2 text-sm text-body">
      <p>{event.summary}</p>
      <time className="text-muted-foreground" dateTime={event.occurredAt.toISOString()}>
       {new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(event.occurredAt)} IST
      </time>
     </li>)}
   </ol>:<p role="status" className="mt-3 text-sm text-body">No recorded membership changes to display.</p>}
  </section>
 </main>;
}
