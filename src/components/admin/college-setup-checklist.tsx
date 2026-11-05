import Link from "next/link";
import { ListRow } from "@/components/ui/list-row";
import { Disclosure } from "@/components/ui/disclosure";
import { EmptyState } from "@/components/ui/empty-state";
import { COLLEGE_SETUP_GUIDE_COPY } from "@/modules/admin-ui/admin-dashboard-navigation";
import type { collegeChecklistProjection } from "@/modules/admin-ui/college-setup-checklist-model";
import { Heading } from "@/components/ui/heading";

type Phases = ReturnType<typeof collegeChecklistProjection>;

export function CollegeSetupChecklist({ phases }: { phases: Phases }) {
  const steps = phases.flatMap(phase => phase.steps);
  const recorded = steps.filter(step => step.hasRecords).length;
  return <Disclosure title={COLLEGE_SETUP_GUIDE_COPY.collapseLabel} className="min-w-0 border-t border-border pt-4">
    <div className="mt-4 space-y-4">
    <div className="flex flex-wrap items-baseline justify-between gap-3">
      <div>
        <Heading level={2} size="base" className="leading-[26px] md:text-[18px] md:leading-[28px] lg:text-[20px] lg:leading-[30px] text-[var(--lms-heading)]">{COLLEGE_SETUP_GUIDE_COPY.heading}</Heading>
        <p className="mt-1 text-sm text-body leading-[22px]">{COLLEGE_SETUP_GUIDE_COPY.intro}</p>
      </div>
      <p className="text-sm text-muted-foreground leading-[22px]" aria-label="Setup steps containing persisted data">
        {recorded} of {steps.length} steps contain records
      </p>
    </div>
    {phases.length===0?<EmptyState title="No setup steps available" description="No setup steps are available in the current college scope."/>:
    <div className="grid min-w-0 gap-4 md:grid-cols-2">
      {phases.map(phase => <section key={phase.title}
        className="border-t border-border pt-4">
        <Heading level={3} size="base" className="text-[var(--lms-heading)]">{phase.title}</Heading>
        <ul className="mt-3">
          {phase.steps.map(step => <ListRow key={step.key} title={step.label}
            detail={step.count > 0
              ? `${step.count} qualifying record${step.count === 1 ? "" : "s"}`
              : "No qualifying records"}
            action={step.href ? <Link href={step.href}
              className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-ring md:min-h-9 print:hidden">
              Open
            </Link> : <span className="text-xs text-muted-foreground">Page unavailable</span>} />)}
        </ul>
      </section>)}
    </div>}
    </div>
  </Disclosure>;
}
