import type { ReactNode } from "react";
import { NeedsDoingChips, type NeedsDoingChip } from "@/components/ui/needs-doing-chips";

export type PageHeaderProps = {
  eyebrow?: string;
  title: string;
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
export function PageHeader({ eyebrow, title, description, actions, needsDoingItems, selectedNeedKey, needsDoingLabel }: PageHeaderProps) {
  const subtitle = [eyebrow?.trim(), description?.trim()].filter(Boolean).join(" · ");

  const heading = (
    <header
      data-slot="page-header"
      className="flex min-w-0 flex-col items-stretch gap-2 pb-[var(--lms-space-4)] md:flex-row md:items-start md:justify-between md:gap-6 [--lms-page-header-title-size:20px] md:[--lms-page-header-title-size:30px]"
    >
      <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5 md:flex-row md:items-baseline md:gap-4">
        <h1
          className="m-0 min-w-0 max-w-full shrink break-words text-[20px] font-semibold leading-[1.35] tracking-[-0.02em] text-[var(--lms-heading)] md:truncate md:text-[30px]"
          style={{ fontSize: "var(--lms-page-header-title-size, 30px)", fontWeight: 600 }}
          title={title}
        >
          {title}
        </h1>
        {subtitle ? (
          <span
            className="min-w-0 max-w-full text-[13px] leading-5 text-[var(--lms-muted-text)] md:flex-1 md:truncate"
            title={subtitle}
          >
            {subtitle}
          </span>
        ) : null}
      </div>
      {actions ? (
        <div className="flex w-full min-w-0 flex-wrap items-center justify-start gap-2 md:ml-auto md:w-auto md:max-w-[60%] md:shrink-0 md:justify-end">
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
