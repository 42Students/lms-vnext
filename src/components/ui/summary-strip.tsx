import { cx } from "@/lib/class-names";

export type SummaryStep = {
  label: string;
  value: string | number;
  note?: string;
};

export type SummaryStripProps = {
  steps: readonly SummaryStep[];
  label: string;
  className?: string;
};

const numberFormat = new Intl.NumberFormat("en-IN");

/** Single hairline summary strip, not a separate card for every pipeline stage. */
export function SummaryStrip({ steps, label, className }: SummaryStripProps) {
  return (
    <section
      data-slot="summary-strip"
      aria-label={label}
      className={cx(
        "min-w-0 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface",
        className,
      )}
    >
      <ol className="flex min-w-0 flex-wrap items-center gap-y-3 px-4 py-3 sm:flex-nowrap sm:overflow-x-auto sm:py-4">
        {steps.map((step, index) => (
          <li key={step.label + index} className="flex min-w-0 flex-1 items-center gap-3">
            {index > 0 ? (
              <span aria-hidden="true" className="shrink-0 text-[var(--lms-neutral-400)]">›</span>
            ) : null}
            <div className="min-w-0">
              <strong className="block text-xl font-semibold leading-7 tabular-nums text-[var(--lms-neutral-900)]">
                {typeof step.value === "number" && Number.isFinite(step.value)
                  ? numberFormat.format(step.value)
                  : step.value}
              </strong>
              <span className="block text-xs leading-5 text-[var(--lms-neutral-500)]">{step.label}</span>
              {step.note ? (
                <span className="mt-1 inline-flex rounded-full bg-[var(--lms-primary-subtle)] px-2 py-0.5 text-xs text-[var(--lms-primary-text)]">
                  {step.note}
                </span>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
