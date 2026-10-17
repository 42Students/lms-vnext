import Link from "next/link";
import { COLLEGE_SETUP_GUIDE_COPY } from "@/modules/admin-ui/admin-dashboard-navigation";
import type { collegeChecklistProjection } from "@/modules/admin-ui/college-setup-checklist-model";

type Phases = ReturnType<typeof collegeChecklistProjection>;

export function CollegeSetupChecklist({ phases }: { phases: Phases }) {
  const steps = phases.flatMap(phase => phase.steps);
  const recorded = steps.filter(step => step.hasRecords).length;
  return <details aria-label="College setup evidence" className="min-w-0 rounded-xl border border-border bg-surface p-4">
    <summary className="cursor-pointer text-sm font-semibold text-foreground">
      {COLLEGE_SETUP_GUIDE_COPY.collapseLabel}
    </summary>
    <div className="mt-4 space-y-4">
    <div className="flex flex-wrap items-baseline justify-between gap-3">
      <div>
        <h2 className="text-xl font-semibold text-foreground">{COLLEGE_SETUP_GUIDE_COPY.heading}</h2>
        <p className="mt-1 text-sm text-body">{COLLEGE_SETUP_GUIDE_COPY.intro}</p>
      </div>
      <p className="text-sm text-muted-foreground" aria-label="Setup steps containing persisted data">
        {recorded} of {steps.length} steps contain records
      </p>
    </div>
    <div className="grid min-w-0 gap-4 md:grid-cols-2">
      {phases.map(phase => <section key={phase.title}
        className="rounded-xl border border-border bg-surface p-4">
        <h3 className="text-base font-semibold text-foreground">{phase.title}</h3>
        <div className="mt-3 divide-y divide-border">
          {phase.steps.map(step => <div key={step.key}
            className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{step.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {step.count > 0
                  ? `${step.count} qualifying record${step.count === 1 ? "" : "s"}`
                  : "No qualifying records"}
              </p>
            </div>
            {step.href ? <Link href={step.href}
              className="inline-flex min-h-9 items-center rounded-md border border-border px-3 text-xs font-semibold text-primary-text hover:underline">
              Open
            </Link> : <span className="text-xs text-muted-foreground">
              Page unavailable
            </span>}
          </div>)}
        </div>
      </section>)}
    </div>
    </div>
  </details>;
}
