import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { getOwnLearnerAcademicSummary } from "@/modules/people/learner-academic-summary-service";
import { getOwnLearnerProfileWithRuntime } from "@/modules/people/runtime";
import { ownLearnerProfileReadiness } from "@/modules/people/learner-profile-readiness-model";
import {learnerProfileChecklist} from "@/modules/people/learner-profile-checklist";
import {learnerProfileCareerCoverage,learnerCareerCompletionMessage} from "@/modules/people/learner-profile-career-coverage-model";

export default async function ProfileCompleteness({searchParams}:{
  searchParams:Promise<{show?:string|string[]}>;
}) {
  const query=await searchParams;
  const context=await getCurrentRequestContext();
  // The academic read validates current college, actor, persisted learner role.
  // Verify persisted learner ownership before loading private profile data.
  const academic=await getOwnLearnerAcademicSummary(context);
  const data=await getOwnLearnerProfileWithRuntime(context);
  const readiness=ownLearnerProfileReadiness(data.profile.profileDocument,query);
  const career=learnerProfileCareerCoverage(learnerProfileChecklist(data.profile.profileDocument));
  if(!readiness) notFound();
  const options=[
    {value:"all",label:"All sections"},
    {value:"missing",label:"Not filled"},
    {value:"filled",label:"Filled"},
  ] as const;
  return <div className="min-w-0 space-y-6">
    <Link href="/learn/profile" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text md:min-h-9">
      ← Back to Profile
    </Link>
    <PageHeader title="Profile completion checklist"
      description="Read-only coverage of the fields saved to your learner profile." />
    <section className="py-2">
      <h2 className="text-lg font-semibold text-foreground">{readiness.filled} of {readiness.total} sections filled</h2>
      <p className="mt-2 text-sm font-semibold text-foreground">{career.percentage??0}% career profile complete · {learnerCareerCompletionMessage(career.percentage??0)}</p>
      <p className="mt-2 text-sm text-body">
        {readiness.missing} sections have no saved entries. This is not a verification, placement eligibility or application readiness score.
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Academic identity: {academic.title}. Sections are based on your own current college profile.
      </p>
      <p className="mt-2 text-sm text-body">
        National identity details are optional and are not required for this checklist. Sensitive identity storage and verification are not available through this view.
      </p>
    </section>
    <nav aria-label="Checklist filters" className="flex min-w-0 max-w-[calc(100vw-48px)] flex-nowrap items-center gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:max-w-full md:flex-wrap md:overflow-visible md:pb-0">
      {options.map(option=><Link key={option.value}
        href={"/learn/profile/completeness?show="+option.value}
        aria-current={readiness.show===option.value ? "page" : undefined}
        className={
          "inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-lg border border-[var(--lms-neutral-200)] px-4 py-2 text-[14px] font-medium leading-[1.3] transition-[color,background,border-color] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] motion-reduce:transition-none " +
          (readiness.show===option.value ? "border-[var(--lms-primary)] bg-[var(--lms-primary)] text-[var(--lms-on-primary)] hover:bg-[var(--lms-primary-hover)]" :
            "border-[var(--lms-neutral-200)] bg-transparent text-[var(--lms-neutral-500)] hover:border-[rgba(38,186,199,0.4)] hover:bg-[rgba(38,186,199,0.05)] hover:text-[var(--lms-primary)]")
        }>
        {option.label}
      </Link>)}
    </nav>
    <section className="border-t border-border pt-5">
      <h2 className="text-base font-semibold text-foreground">Your sections</h2>
      {readiness.items.length===0 ? <p className="mt-3 text-sm text-body">
        No sections match this filter. Choose All sections to review the full checklist.
      </p> : <ul className="mt-4 grid gap-3 md:grid-cols-2">
        {readiness.items.map(item=><li key={item.section} className="min-w-0">
          <Link href={"/learn/profile?section="+encodeURIComponent(item.section)}
            className="flex min-h-12 items-center justify-between gap-3 rounded-[var(--lms-control-radius,9px)] border border-border p-3 text-sm text-foreground hover:border-primary hover:bg-primary-subtle">
            <span className="min-w-0 break-words">{item.label}
              {(["personal-details","contacts","education","skills"].includes(item.section))?
                <span className="ml-2 text-xs font-semibold text-muted-foreground">Required</span>:null}
            </span>
            <span className={"shrink-0 text-xs font-semibold "+(item.completed?"text-success":"text-muted-foreground")}>
              {item.completed?"Filled":"Not filled"}
            </span>
          </Link>
        </li>)}
      </ul>}
    </section>
  </div>;
}