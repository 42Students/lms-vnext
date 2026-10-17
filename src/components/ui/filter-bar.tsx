"use client";

import { useEffect, useState, type ReactNode } from "react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { cx } from "@/lib/class-names";

export type FilterBarProps = {
  title?: string;
  activeCount?: number;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function FilterBar({ title = "Filters", activeCount = 0, children, action, className }: FilterBarProps) {
  const [mobile, setMobile] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const update = () => { setMobile(media.matches); if (!media.matches) setOpen(false); };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const count = Number.isFinite(activeCount) ? Math.max(0, Math.trunc(activeCount)) : 0;
  return (
    <section data-slot="filter-bar" aria-label={title} className={cx("min-w-0", className)}>
      {mobile ? (
        <>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={() => setOpen(true)}>{title} ({count})</Button>{action}
          </div>
          <BottomSheet open={open} onOpenChange={setOpen} title={title}>
            <div className="space-y-4">{children}</div>
          </BottomSheet>
        </>
      ) : (
        <div className="flex min-w-0 flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">{children}{action}</div>
      )}
    </section>
  );
}
