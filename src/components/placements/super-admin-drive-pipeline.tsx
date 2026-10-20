import type { getSuperAdminDrivePipeline } from "@/modules/placements/super-admin-drive-pipeline-service";

type Pipeline = Awaited<ReturnType<typeof getSuperAdminDrivePipeline>>;

export function SuperAdminDrivePipeline({rows}: {rows: Pipeline}) {
  return <section className="min-w-0 space-y-[var(--lms-space-3)] border-b border-border pb-[var(--lms-space-4)]"
    aria-label="Drive pipeline snapshot">
    <div>
      <h2 className="text-base font-semibold text-foreground">Pipeline</h2>
      <p className="mt-1 text-sm text-body">
        Current application stages. Totals reflect persisted decisions, not estimates of completed rounds.
      </p>
    </div>
    <div className="grid min-w-0 grid-cols-2 border-y border-border sm:grid-cols-3 xl:grid-cols-6">
      {rows.funnel.map((stage) => <div key={stage.key}
        className="min-w-0 border-b border-r border-border px-[var(--lms-space-3)] py-[var(--lms-space-3)]">
        <p className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">{stage.label}</p>
        <p className="mt-2 text-[24px] font-semibold leading-[1.3] tabular-nums text-[var(--lms-heading)]">{stage.count}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {stage.percentPrevious===null ? "Current stage" :
            `${stage.percentPrevious}% of previous stage`}
        </p>
      </div>)}
    </div>
    <p className="text-xs text-muted-foreground">
      {rows.total} submitted applications · {rows.waitlisted} waitlisted · {rows.rejected} rejected
    </p>
  </section>;
}
