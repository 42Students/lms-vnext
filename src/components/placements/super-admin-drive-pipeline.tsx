import type { getSuperAdminDrivePipeline } from "@/modules/placements/super-admin-drive-pipeline-service";

type Pipeline = Awaited<ReturnType<typeof getSuperAdminDrivePipeline>>;

export function SuperAdminDrivePipeline({rows}: {rows: Pipeline}) {
  return <section className="space-y-4 rounded-xl border border-border bg-surface p-5"
    aria-label="Drive pipeline snapshot">
    <div>
      <h2 className="text-base font-semibold text-foreground">Pipeline</h2>
      <p className="mt-1 text-sm text-body">
        Current application stages. Totals reflect persisted decisions, not estimates of completed rounds.
      </p>
    </div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {rows.funnel.map((stage) => <div key={stage.key}
        className="rounded-lg border border-border bg-surface-secondary p-3">
        <p className="text-xs font-semibold text-body">{stage.label}</p>
        <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">{stage.count}</p>
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
