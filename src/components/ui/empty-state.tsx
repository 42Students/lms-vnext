import type { ReactNode } from "react";

export type EmptyStateProps = { title: string; description: string; action?: ReactNode };

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return <section data-slot="empty-state" className="min-w-0 bg-transparent px-[var(--lms-space-4)] py-[var(--lms-space-6)] text-center shadow-none sm:px-[var(--lms-space-5)] sm:py-[var(--lms-space-7)]">
    <h2 className="m-0 text-balance break-words [overflow-wrap:anywhere] text-[var(--lms-font-lg)] font-semibold leading-7 text-[var(--lms-heading)]">{title}</h2>
    <p className="mx-auto mt-[var(--lms-space-2)] max-w-xl text-pretty break-words [overflow-wrap:anywhere] text-[var(--lms-font-base)] leading-[1.6] text-[var(--lms-body-text)]">{description}</p>
    {action ? <div className="mt-[var(--lms-space-5)] flex min-w-0 max-w-full flex-wrap items-center justify-center gap-[var(--lms-space-2)]">{action}</div> : null}
  </section>;
}
