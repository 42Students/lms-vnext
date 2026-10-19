import type { ReactNode } from "react";

export type ErrorStateProps = { title?: string; description: string; action?: ReactNode };

export function ErrorState({ title = "Something went wrong", description, action }: ErrorStateProps) {
  return <section data-slot="error-state" role="alert" className="min-w-0 rounded-[var(--lms-canvas-radius)] border border-[rgba(239,68,68,0.25)] bg-[var(--lms-error-subtle)] p-[var(--lms-space-4)] text-left shadow-none sm:p-[var(--lms-space-5)]">
    <h2 className="m-0 text-balance break-words [overflow-wrap:anywhere] text-[var(--lms-font-lg)] font-semibold leading-7 text-[var(--lms-heading)]">{title}</h2>
    <p className="mt-[var(--lms-space-2)] max-w-2xl text-pretty break-words [overflow-wrap:anywhere] text-[var(--lms-font-base)] leading-[1.6] text-[var(--lms-body-text)]">{description}</p>
    {action ? <div className="mt-[var(--lms-space-4)] flex min-w-0 max-w-full flex-wrap items-center gap-[var(--lms-space-2)]">{action}</div> : null}
  </section>;
}
