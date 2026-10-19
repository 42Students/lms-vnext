import type { HTMLAttributes } from "react";
import { cx } from "@/lib/class-names";

/**
 * Authenticated portal surface: exactly one continuous white old-LMS canvas.
 * AuthenticatedLayout owns its placement inside AppShell's grey page area.
 * Page screens should not nest another PageCanvas or change their own content.
 */
export type PageCanvasProps = HTMLAttributes<HTMLDivElement>;

export function PageCanvas({ children, className, ...props }: PageCanvasProps) {
  return (
    <div
      {...props}
      data-slot="page-canvas"
      className={cx(
        "relative min-w-0 w-full rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-white p-4 text-foreground shadow-none sm:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
