"use client";

import { useState } from "react";
import { SidebarNav } from "./sidebar-nav";
import type { ShellNavItem } from "./shell-model";

export function MobileNavigation({
  items,
}: {
  items: readonly ShellNavItem[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Open navigation"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-lg font-semibold text-foreground transition-colors hover:bg-primary-subtle hover:text-primary-text md:hidden"
      >
        <span aria-hidden="true">☰</span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 h-full w-full bg-foreground/20"
            onClick={() => setOpen(false)}
          />
          <aside
            aria-label="Mobile navigation"
            className="absolute inset-y-0 left-0 flex w-[min(20rem,88vw)] flex-col border-r border-[var(--lms-sidebar-border)] bg-surface shadow-xl"
          >
            <div className="flex min-h-20 items-center justify-between gap-4 border-b border-[var(--lms-sidebar-border)] px-5">
              <div>
                <p className="m-0 text-xs font-bold uppercase tracking-[0.16em] text-primary-text">
                  42Students
                </p>
                <p className="mt-1 text-base font-semibold text-foreground">
                  LMS
                </p>
              </div>
              <button
                type="button"
                aria-label="Close navigation"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface text-xl text-foreground transition-colors hover:bg-primary-subtle hover:text-primary-text"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-4 pr-3">
              <SidebarNav
                items={items}
                onNavigate={() => setOpen(false)}
              />
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
