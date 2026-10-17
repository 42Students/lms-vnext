import type { ReactNode } from "react";
import { cx } from "@/lib/class-names";

export type TooltipProps = {
  content: ReactNode;
  children: ReactNode;
  className?: string;
};
export function InfoPopover({ content, children, className }: TooltipProps) {
  return (
    <details data-slot="info-popover" className={cx("group relative inline-block min-w-0 align-middle", className)}>
      <summary className="inline-flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center rounded-md text-[var(--lms-teal-deep)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)] [&::-webkit-details-marker]:hidden">
        {children}
      </summary>
      <div className="relative z-30 mt-2 max-w-[min(20rem,calc(100vw-2rem))] rounded-lg border border-border bg-surface p-3 text-sm leading-6 text-body shadow-lg sm:absolute sm:left-0 sm:w-80">{content}</div>
    </details>
  );
}
export const Tooltip = InfoPopover;
