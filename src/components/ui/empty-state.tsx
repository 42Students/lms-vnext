import type { ReactNode } from "react";

export type EmptyStateProps = { title: string; description?: string; action?: ReactNode };

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return <section data-slot="empty-state" role="status" aria-live="polite" className="min-w-0 bg-transparent px-[var(--lms-space-4)] py-[var(--lms-space-6)] text-center shadow-none md:px-[var(--lms-space-5)] md:py-[var(--lms-space-7)]">
    <h2 className="m-0 text-balance break-words [overflow-wrap:anywhere] font-semibold text-[16px] leading-[26px] md:text-[18px] md:leading-[28px] lg:text-[20px] lg:leading-[30px] text-[var(--lms-heading)]">{title}</h2>
    {description ? <p className="mx-auto mt-[var(--lms-space-2)] max-w-xl text-pretty break-words [overflow-wrap:anywhere] text-[length:var(--lms-font-base)] leading-[1.6] text-[var(--lms-body-text)]">{description}</p> : null}
    {action ? <div className="mt-[var(--lms-space-5)] flex min-w-0 max-w-full flex-wrap items-center justify-center gap-[var(--lms-space-2)] max-md:[&_a]:inline-flex max-md:[&_a]:min-h-11 max-md:[&_a]:min-w-11 max-md:[&_a]:items-center">{action}</div> : null}
  </section>;
}
