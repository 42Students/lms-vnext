"use client";

import { useEffect, useRef, useState } from "react";
import { SidebarNav } from "./sidebar-nav";
import {ShellLogoMark} from "./shell-nav-icons";
import { useOverlayWebview } from "@/components/ui/use-overlay-webview";
import type { CSSProperties } from "react";
import type { ShellNavItem } from "./shell-model";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function MobileNavigation({
  items,
}: {
  items: readonly ShellNavItem[];
}) {
  const [open, setOpen] = useState(false);
  const { availableHeight } = useOverlayWebview({ open, dismissible: true, onDismiss: () => setOpen(false) });
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const drawerRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (!open) {
      if (wasOpenRef.current) {
        triggerRef.current?.focus();
      }
      wasOpenRef.current = false;
      return;
    }

    wasOpenRef.current = true;
    const drawer = drawerRef.current;
    const first = drawer?.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !drawerRef.current) return;
      const focusable = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      );
      if (focusable.length === 0) return;
      const firstItem = focusable[0];
      const lastItem = focusable.at(-1)!;
      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Open navigation menu"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface text-foreground transition-colors hover:bg-primary-subtle hover:text-primary-text md:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"
      >
        <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="20" height="20"
          fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M4 6h16 M4 12h16 M4 18h16" />
        </svg>
      </button>

      {open ? (
        <div style={{ "--lms-visual-height": availableHeight ?? "100dvh" } as CSSProperties}
          className="fixed inset-0 z-50 h-[var(--lms-visual-height)] md:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 h-full w-full bg-foreground/20"
            onClick={() => setOpen(false)}
          />
          <aside
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="lms-mobile-sidebar absolute inset-y-0 left-0 flex max-h-[var(--lms-visual-height)] w-[min(82vw,300px)] flex-col border-r-0 bg-surface shadow-[var(--lms-overlay-shadow)]"
          >
            <div className="flex min-h-[calc(52px+env(safe-area-inset-top,0px))] shrink-0 items-center justify-between gap-2 border-b border-[#f0f0f0] pt-[calc(10px+env(safe-area-inset-top,0px))] pr-1 pb-[10px] pl-4">
              <div className="inline-flex h-11 w-11 items-center justify-center" aria-label="42Students LMS">
                <ShellLogoMark />
              </div>
              <button
                type="button"
                aria-label="Close navigation"
                onClick={() => setOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface text-foreground transition-colors hover:bg-primary-subtle hover:text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"
              >
                <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="20" height="20"
                  fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M5 5l14 14 M19 5L5 19" />
                </svg>
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto pt-2 pb-[calc(24px+env(safe-area-inset-bottom,0px))]">
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
