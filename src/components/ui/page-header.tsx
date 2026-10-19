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
