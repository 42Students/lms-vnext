"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ResponsiveFilterDrawer } from "@/components/ui/drawer";
import { cx } from "@/lib/class-names";

export type FilterBarProps = {
  title?: string;
  activeCount?: number;
  /** Always-visible search input; use form="..." to associate with the GET form in filters. */
  search?: ReactNode;
  /** Optional alias for existing children; only one subtree is mounted. */
  filters?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  views?: ReactNode;
  columns?: ReactNode;
  exportAction?: ReactNode;
  className?: string;
};

export function FilterBar({
  title = "Filters", activeCount = 0, search, filters, children, action,
  views, columns, exportAction, className,
}: FilterBarProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const launcher = useRef<HTMLButtonElement>(null);
  const count = Number.isFinite(activeCount) ? Math.max(0, Math.trunc(activeCount)) : 0;
  const hasFilters = (filters !== undefined && filters !== null) || (children !== undefined && children !== null);
  return <section data-slot="filter-bar" data-open={open} data-active-count={count}
    aria-label={title} className={cx("min-w-0 space-y-[var(--lms-space-3)]", className)}>
    <div className="flex min-w-0 flex-wrap items-center gap-[var(--lms-space-2)]">
      {search ? <div className="min-w-0 flex-1 basis-40 sm:basis-[220px] sm:max-w-[380px]">{search}</div> : null}
      {hasFilters ? <div className="sm:hidden">
        <Button ref={launcher} variant="secondary"
          aria-label={count > 0 ? `${title}, ${count} active` : title}
          aria-expanded={open} aria-controls={panelId}
          onClick={() => setOpen(true)}>{title}{count > 0 ? ` (${count})` : ""}</Button>
      </div> : null}
      {views || columns || exportAction ? <div role="toolbar" aria-label="List actions"
        className="flex min-w-0 flex-wrap items-center gap-[var(--lms-space-2)]">
        {views}{columns}{exportAction}
      </div> : null}
      {action}
    </div>
    <ResponsiveFilterDrawer id={panelId} title={title} open={open}
      onOpenChange={setOpen} launcher={launcher}>
      {filters ?? children}
    </ResponsiveFilterDrawer>
  </section>;
}
