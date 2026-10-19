import type { ReactNode } from "react";

export type EmptyStateProps = { title: string; description: string; action?: ReactNode };

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return <section data-slot="empty-state" className="min-w-0 rounded-[12px] border border-[var(--lms-canvas-border)] bg-white px-4 py-8 text-center shadow-none sm:px-6 sm:py-10">
    <div aria-hidden="true" className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--lms-primary-subtle)] text-[18px] font-semibold text-[var(--lms-primary-text)]">42</div>
    <h2 className="m-0 break-words text-lg font-semibold leading-7 text-[var(--lms-heading)]">{title}</h2>
    <p className="mx-auto mt-2 max-w-xl break-words text-sm leading-[1.6] text-[var(--lms-body-text)]">{description}</p>
    {action ? <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div> : null}
  </section>;
}
