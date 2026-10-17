import type { ReactNode } from "react";

export type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return <header data-slot="page-header" className="flex min-w-0 flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
    <div className="min-w-0 sm:flex-1">
      {eyebrow ? <p className="mb-1 break-words text-xs font-semibold uppercase tracking-[0.12em] text-body">{eyebrow}</p> : null}
      <h1 className="m-0 break-words text-2xl font-semibold leading-8 tracking-tight text-foreground sm:text-3xl sm:leading-9">{title}</h1>
      {description ? <p className="mt-2 max-w-3xl break-words text-base leading-6 text-body sm:text-sm">{description}</p> : null}
    </div>
    {actions ? <div className="flex min-w-0 w-full flex-wrap items-center gap-2 sm:w-auto sm:max-w-[60%] sm:justify-end">{actions}</div> : null}
  </header>;
}
