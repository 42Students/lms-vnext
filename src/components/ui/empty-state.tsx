import type { ReactNode } from "react";

export type EmptyStateProps = { title: string; description: string; action?: ReactNode };

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return <section data-slot="empty-state" className="min-w-0 rounded-xl border border-border bg-surface px-4 py-8 text-center sm:px-6 sm:py-10">
    <div aria-hidden="true" className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-primary-subtle text-lg font-bold text-foreground">42</div>
    <h2 className="m-0 break-words text-lg font-semibold leading-7 text-foreground">{title}</h2>
    <p className="mx-auto mt-2 max-w-xl break-words text-base leading-6 text-body sm:text-sm">{description}</p>
    {action ? <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div> : null}
  </section>;
}
