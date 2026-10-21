import type { ReactNode } from "react";
import { NeedsDoingChips, type NeedsDoingChip } from "@/components/ui/needs-doing-chips";

export type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  /** Dedicated legacy error display; heading remains the only h1. */
  errorCode?: 404 | 500;
  /** Optional stable heading id for aria-labelledby on existing pages. */
  id?: string;
  description?: string;
  actions?: ReactNode;
  /** Existing page-owned quick-filter destinations, displayed below the title row. */
  needsDoingItems?: readonly NeedsDoingChip[];
  selectedNeedKey?: string;
  needsDoingLabel?: string;
};

/**
 * Old-LMS page head: a single title/subtitle/action row.
 * Legacy eyebrow and description props remain supported, but both become
 * inline subtitle text instead of a separate eyebrow or paragraph block.
 */
export function PageHeader({ eyebrow, title, id, description, actions, needsDoingItems, selectedNeedKey, needsDoingLabel, errorCode }: PageHeaderProps) {
  const subtitle = [eyebrow?.trim(), description?.trim()].filter(Boolean).join(" · ");

  const heading = (
    <header
      data-slot="page-header"
      className="mb-2 flex w-full min-w-0 flex-col items-stretch gap-2 border-b border-[var(--lms-canvas-border)] pb-4 md:mb-4 md:flex-row md:items-start md:justify-between md:gap-6 [--lms-page-header-title-size:20px] md:[--lms-page-header-title-size:30px]"
    >
      <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5 md:flex-row md:flex-wrap md:items-baseline md:gap-4">
        <h1
          id={id}
          className="m-0 min-w-0 max-w-full shrink break-words text-[20px] font-semibold leading-[1.3] tracking-[-0.02em] text-[var(--lms-heading)] md:text-[30px]"
          style={{ fontSize: "var(--lms-page-header-title-size, 30px)", fontWeight: 600 }}
          title={title}
        >
          {errorCode ? <><span className="mr-3 text-[24px] font-semibold text-[#1a1d21]" aria-hidden="true">{errorCode}</span>{errorCode===404?"Page Not Found":"Server Error"}</> : title}
        </h1>
        {subtitle ? (
          <span
            className="min-w-0 max-w-full text-[14px] leading-5 text-[var(--lms-muted-text)] md:flex-1"
            title={subtitle}
          >
            {subtitle}
          </span>
        ) : null}
      </div>
      {actions ? (
        <div className="mt-1 flex w-full min-w-0 flex-col items-stretch justify-start gap-2 md:ml-auto md:mt-0 md:w-auto md:min-w-0 md:max-w-full md:shrink md:flex-row md:flex-wrap md:items-center md:justify-end md:gap-4 md:pt-2">
          {actions}
        </div>
      ) : null}
    </header>
  );
  // Pages frequently use space-y on their root: keep the title and quick
  // filters in one layout child so they appear immediately below the head.
  return needsDoingItems?.length ? (
    <div data-slot="page-heading" className="min-w-0">
      {heading}
      <NeedsDoingChips items={needsDoingItems} selectedKey={selectedNeedKey}
        label={needsDoingLabel}/>
    </div>
  ) : heading;
}
