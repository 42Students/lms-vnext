import type { ReactNode } from "react";

export type EmptyStateProps = { title: string; description: string; action?: ReactNode };

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return <section data-slot="empty-state" className="min-w-0 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-white px-[var(--lms-space-4)] py-[var(--lms-space-6)] text-center shadow-none sm:px-[var(--lms-space-5)] sm:py-[var(--lms-space-7)]">
    <div aria-hidden="true" className="mx-auto mb-[var(--lms-space-4)] flex h-11 w-11 items-center justify-center rounded-full bg-[var(--lms-primary-subtle)] text-[18px] font-semibold text-[var(--lms-primary-text)]">42</div>
    <h2 className="m-0 text-balance break-words [overflow-wrap:anywhere] text-[var(--lms-font-lg)] font-semibold leading-7 text-[var(--lms-heading)]">{title}</h2>
    <p className="mx-auto mt-[var(--lms-space-2)] max-w-xl text-pretty break-words [overflow-wrap:anywhere] text-[14px] leading-[1.6] text-[var(--lms-body-text)]">{description}</p>
    {action ? <div className="mt-[var(--lms-space-5)] flex min-w-0 max-w-full flex-wrap items-center justify-center gap-[var(--lms-space-2)]">{action}</div> : null}
  </section>;
}
