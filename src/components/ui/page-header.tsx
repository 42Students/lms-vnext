import type { ReactNode } from "react";

export type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

/**
 * Old-LMS page head: a single title/subtitle/action row.
 * Legacy eyebrow and description props remain supported, but both become
 * inline subtitle text instead of a separate eyebrow or paragraph block.
 */
export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  const subtitle = [eyebrow?.trim(), description?.trim()].filter(Boolean).join(" · ");

  return (
    <header
      data-slot="page-header"
      className="flex min-w-0 items-start justify-between gap-4 pb-[var(--lms-space-4)]"
    >
      <div className="flex min-w-0 flex-1 items-baseline gap-3 overflow-hidden">
        <h1
          className="m-0 min-w-0 shrink truncate font-semibold leading-[1.35] tracking-[-0.02em] text-[var(--lms-heading)]"
          style={{ fontSize: "30px", fontWeight: 600 }}
          title={title}
        >
          {title}
        </h1>
        {subtitle ? (
          <span
            className="min-w-0 flex-1 truncate text-[13px] leading-5 text-[var(--lms-muted-text)]"
            title={subtitle}
          >
            {subtitle}
          </span>
        ) : null}
      </div>
      {actions ? (
        <div className="ml-auto flex min-w-0 max-w-[60%] shrink-0 flex-wrap items-center justify-end gap-2">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
