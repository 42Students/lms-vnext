import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {getOwnLearnerAcademicSummary} from "@/modules/people/learner-academic-summary-service";

/** Membership-owned, read-only current enrollment. Never claim that grades,
 * imported marks or private evidence were verified by this summary. */
export default async function LearnerAcademicRecordPage(){
 const context=await getCurrentRequestContext();
 const record=await getOwnLearnerAcademicSummary(context);
 return <div className="min-w-0 space-y-6">
  <Link href="/learn/profile" className="inline-flex min-h-11 md:min-h-9 items-center text-sm font-semibold text-primary-text underline">← Profile</Link>
  <PageHeader title="Academic record" description="Your college-recorded current program enrollment."/>
  <section className="border-t border-border pt-5">
   <h2 className="text-base font-semibold text-foreground">Current academic enrollment</h2>
   {record.enrollment?<dl className="mt-4 grid gap-4 text-sm md:grid-cols-2">
    {([
      ["Learner",record.title],["Program",record.enrollment.program],
      ["Program code",record.enrollment.programCode],["Batch / cohort",record.enrollment.cohort],
      ["Department",record.enrollment.department],
    ] as const).map(([label,value])=><div key={label}>
      <dt className="font-semibold text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-foreground">{value||"Not recorded"}</dd>
    </div>)}
   </dl>:<p role="status" className="mt-3 text-sm text-body">
    No active program enrollment is recorded. Ask your college administrator to correct this if needed.
   </p>}
   <p className="mt-4 text-xs text-muted-foreground">
    This read-only record comes from your current college membership.
    It is not a transcript, grades disclosure, or proof of degree completion.
   </p>
  </section>
 </div>;
}
