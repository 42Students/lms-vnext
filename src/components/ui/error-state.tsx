import type { ReactNode } from "react";

export type ErrorStateProps = { title?: string; description: string; action?: ReactNode };

export function ErrorState({ title = "Something went wrong", description, action }: ErrorStateProps) {
  return <section data-slot="error-state" role="alert" className="min-w-0 rounded-[var(--lms-canvas-radius)] border border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.04)] p-[var(--lms-space-4)] shadow-none sm:p-[var(--lms-canvas-padding)]">
    <h2 className="m-0 break-words text-[var(--lms-font-lg)] font-semibold leading-7 text-[var(--lms-heading)]">{title}</h2>
    <p className="mt-2 max-w-2xl break-words text-sm leading-[1.6] text-[var(--lms-body-text)]">{description}</p>
    {action ? <div className="mt-4 flex flex-wrap gap-2">{action}</div> : null}
  </section>;
}
