import type { ReactNode } from "react";

export type ErrorStateProps = { title?: string; description: string; action?: ReactNode };

export function ErrorState({ title = "Something went wrong", description, action }: ErrorStateProps) {
  return <section data-slot="error-state" role="alert" className="min-w-0 rounded-xl border border-error bg-[var(--lms-error-subtle)] p-4 sm:p-6">
    <h2 className="m-0 break-words text-lg font-semibold leading-7 text-foreground">{title}</h2>
    <p className="mt-2 max-w-2xl break-words text-base leading-6 text-body sm:text-sm">{description}</p>
    {action ? <div className="mt-4 flex flex-wrap gap-2">{action}</div> : null}
  </section>;
}
