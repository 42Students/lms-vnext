import type { ReactNode } from "react";
import { cx } from "@/lib/class-names";

/** Semantic keyboard disclosure. Native details handles Enter/Space and
 * reduces motion to the shared opacity-only fade in globals.css. */
export function Disclosure({ title, children, className, defaultOpen = false }: {
  title: string;
  children: ReactNode;
  className?: string;
  defaultOpen?: boolean;
}) {
  return <details data-slot="disclosure" open={defaultOpen || undefined}
    className={cx("group min-w-0 border-t border-[var(--lms-canvas-border)]", className)}>
    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-[var(--lms-control-radius)] px-1 py-2 text-[13px] font-semibold leading-5 text-[var(--lms-primary-text)] transition-colors duration-[var(--lms-motion-fast)] hover:bg-[var(--lms-primary-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] motion-reduce:transition-none">
      {title}<span aria-hidden="true" className="shrink-0 transition-transform duration-[var(--lms-motion-fast)] ease-[var(--lms-motion-ease)] group-open:rotate-180 motion-reduce:transition-none">⌄</span>
    </summary>
    <div className="min-w-0 pb-2">{children}</div>
  </details>;
}
