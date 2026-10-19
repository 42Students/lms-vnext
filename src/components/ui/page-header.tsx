import type { ReactNode } from "react";

export type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return <header data-slot="page-header" className="flex min-w-0 flex-col gap-[var(--lms-space-4)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)] sm:flex-row sm:items-start sm:justify-between">
    <div className="min-w-0 sm:flex-1">
      {eyebrow ? <p className="mb-1 break-words text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--lms-neutral-500)]">{eyebrow}</p> : null}
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-[var(--lms-space-3)] gap-y-1"><h1 className="m-0 break-words text-[26px] font-semibold leading-[1.35] tracking-[-0.02em] text-[var(--lms-heading)] sm:text-[30px]">{title}</h1>
      {description ? <p className="m-0 max-w-3xl break-words text-[var(--lms-font-sm)] leading-5 text-[var(--lms-body-text)]">{description}</p> : null}</div>
    </div>
    {actions ? <div className="flex min-w-0 w-full flex-wrap items-center gap-[var(--lms-space-2)] sm:w-auto sm:max-w-[60%] sm:justify-end">{actions}</div> : null}
  </header>;
}
