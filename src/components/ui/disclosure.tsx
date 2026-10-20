import type { ReactNode } from "react";
import { cx } from "@/lib/class-names";

/** Semantic keyboard disclosure. Native details handles Enter/Space and
 * reduces motion to the shared opacity-only fade in globals.css. */
export function Disclosure({
  title, children, className, defaultOpen = false,
  id, summaryAriaLabel, summaryTitle, ariaLabel, summaryClassName, contentClassName, preserveSummary = false,
}: {
  /** Rich summaries retain count/metadata without hand-rolled details. */
  title: ReactNode;
  children: ReactNode;
  className?: string;
  defaultOpen?: boolean;
  id?: string;
  summaryAriaLabel?: string;
  summaryTitle?: string;
  ariaLabel?: string;
  summaryClassName?: string;
  contentClassName?: string;
  /** Keep page-specific rich lesson summaries without adding a second chevron. */
  preserveSummary?: boolean;
}) {
  return <details id={id} aria-label={ariaLabel} data-slot="disclosure" open={defaultOpen || undefined}
    className={cx("group min-w-0 border-t border-[var(--lms-canvas-border)]", className)}>
    <summary aria-label={summaryAriaLabel} title={summaryTitle}
      className={cx(
        preserveSummary
          ? "cursor-pointer list-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary-text)] focus-visible:outline-offset-[3px] focus-visible:shadow-[0_0_0_4px_rgba(26,149,161,0.12)]"
          : "flex min-h-11 cursor-pointer list-none items-center justify-between gap-[var(--lms-space-2)] rounded-[var(--lms-control-radius)] px-[var(--lms-space-2)] py-[var(--lms-space-2)] text-[13px] font-semibold leading-5 text-[var(--lms-body-text)] hover:text-[var(--lms-primary-text)] group-open:text-[var(--lms-primary-text)] transition-colors duration-[var(--lms-motion-fast)] hover:bg-[var(--lms-primary-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary-text)] focus-visible:outline-offset-[3px] focus-visible:shadow-[0_0_0_4px_rgba(26,149,161,0.12)] motion-reduce:transition-none",
        "[&::-webkit-details-marker]:hidden",summaryClassName
      )}>
      {title}{!preserveSummary?<span aria-hidden="true" className="shrink-0 transition-transform duration-[var(--lms-motion-fast)] ease-[var(--lms-motion-ease)] group-open:rotate-180 motion-reduce:transition-none">⌄</span>:null}
    </summary>
    <div className={cx(preserveSummary?"min-w-0":"min-w-0 pb-[var(--lms-space-2)]",contentClassName)}>{children}</div>
  </details>;
}
