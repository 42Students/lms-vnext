import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {Badge} from "@/components/ui/badge";
import {Banner} from "@/components/ui/banner";
import {getOwnAcademicEvidence} from "@/modules/placements/eligibility-service";
import {getOwnLearnerAcademicSummary} from "@/modules/people/learner-academic-summary-service";

/** Membership-owned, read-only current enrollment. Never claim that grades,
 * imported marks or private evidence were verified by this summary. */
export default async function LearnerAcademicRecordPage(){
 const context=await getCurrentRequestContext();
 const [record, evidenceResult] = await Promise.all([
  getOwnLearnerAcademicSummary(context),
  // Placement evidence is optional to a learner's core academic enrollment.
  // An absent module or failed read must not turn it into an empty score.
  getOwnAcademicEvidence(context)
    .then(value => ({ available:true as const, value }))
    .catch(() => ({ available:false as const, value:null })),
 ]);
 const evidence = evidenceResult.value;
 const provenance = evidence?.source === "VERIFIED"
   ? "College-verified placement evidence" : evidence ? "Learner-provided placement evidence" : null;
 const scores = evidence ? [
  {label:"CGPA",value:evidence.cgpa,suffix:""},
  {label:"10th percentage",value:evidence.tenthPercentage,suffix:"%"},
  {label:"12th percentage",value:evidence.twelfthPercentage,suffix:"%"},
  {label:"Diploma percentage",value:evidence.diplomaPercentage,suffix:"%"},
  {label:"Undergraduate percentage",value:evidence.undergraduatePercentage,suffix:"%"},
 ] : [];
 const scoreLabel=(value:number|null,suffix:string) =>
  value===null||!Number.isFinite(value) ? "Not recorded" :
   value.toLocaleString("en-IN",{maximumFractionDigits:2})+suffix;
 return <div className="min-w-0 space-y-5">
  <Link href="/learn/profile" className="inline-flex min-h-11 md:min-h-9 items-center text-sm font-semibold text-primary-text underline">← Profile</Link>
  <PageHeader title="Academic record" description="Your college-recorded current program enrollment."/>
  <section className="min-w-0 border-t border-border pt-4">
   <h2 className="text-base font-semibold leading-6 text-[var(--lms-heading)]">Current academic enrollment</h2>
   {record.enrollment?<dl className="mt-3 grid min-w-0 grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2 lg:max-w-4xl">
    {([
      ["Learner",record.title],["Program",record.enrollment.program],
      ["Program code",record.enrollment.programCode],["Batch / cohort",record.enrollment.cohort],
      ["Department",record.enrollment.department],
    ] as const).map(([label,value])=><div key={label}>
      <dt className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">{label}</dt>
      <dd className="mt-1 break-words [overflow-wrap:anywhere] font-medium leading-6 text-foreground">{value||"Not recorded"}</dd>
    </div>)}
   </dl>:<p role="status" className="mt-3 text-sm text-body leading-[22px]">
    No active program enrollment is recorded. Ask your college administrator to correct this if needed.
   </p>}
   <p className="mt-4 max-w-3xl text-xs leading-5 text-muted-foreground">
    This read-only record comes from your current college membership.
    It is not a transcript, grades disclosure, or proof of degree completion.
   </p>
  </section>
  <section aria-labelledby="academic-evidence-heading" className="min-w-0 border-t border-border pt-4">
   <div className="flex flex-wrap items-center justify-between gap-3">
    <h2 id="academic-evidence-heading" className="text-base font-semibold text-[var(--lms-heading)]">
     Placement academic evidence
    </h2>
    {provenance ? <Badge tone={evidence?.source==="VERIFIED"?"success":"neutral"}>{provenance}</Badge> : null}
   </div>
   {!evidenceResult.available ? <Banner tone="warning" className="mt-3">
    Placement academic evidence could not be loaded. Your enrollment remains available above.
    <Link href="/learn/profile/academic-record" className="ml-2 inline-flex min-h-9 items-center font-semibold text-primary-text underline">Retry</Link>
   </Banner> : !evidence ? <p role="status" className="mt-3 text-sm text-body">
    No placement academic score record is available for this membership.
    This is separate from whether you have an active academic enrollment.
   </p> : <>
    <p className="mt-3 text-sm leading-6 text-body">
     {evidence.source==="VERIFIED"
       ? "These placement-eligibility values were recorded as verified college evidence. A learner self-edit cannot replace a verified record."
       : "These values were provided by you and have not been marked verified by the college. They are not an official transcript."}
    </p>
    <dl className="mt-4 grid min-w-0 gap-x-6 gap-y-4 sm:grid-cols-2 lg:max-w-4xl">
     {scores.map(row=><div key={row.label} className="border-b border-border pb-3">
      <dt className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">{row.label}</dt>
      <dd className="mt-1 text-sm font-semibold tabular-nums text-foreground">{scoreLabel(row.value,row.suffix)}</dd>
      {row.value!==null ? <dd className="mt-1 text-xs text-muted-foreground">{provenance}</dd> : null}
     </div>)}
    </dl>
   </>}
   <p className="mt-4 max-w-3xl text-xs leading-5 text-muted-foreground">
    Placement-eligibility evidence has its own VERIFIED/SELF precedence and may differ from Education document review.
    A saved percentage alone is not a final eligibility decision for a published drive.
   </p>
   <Link href="/learn/profile/verification" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline md:min-h-9">
    Review education verification →
   </Link>
  </section>
 </div>;
}
