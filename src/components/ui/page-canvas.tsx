import type { HTMLAttributes } from "react";
import { cx } from "@/lib/class-names";

/**
 * Authenticated portal surface: exactly one continuous white old-LMS canvas.
 * AuthenticatedLayout owns its placement inside AppShell's grey page area.
 * Page screens should not nest another PageCanvas or change their own content.
 */
export type PageCanvasProps = HTMLAttributes<HTMLDivElement>;

export function PageCanvas({ children, className, style, ...props }: PageCanvasProps) {
  return (
    <div
      {...props}
      data-slot="page-canvas"
      className={cx(
        "relative min-w-0 w-full rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-white p-[var(--lms-space-4)] text-[var(--lms-foreground)] shadow-none sm:p-[var(--lms-canvas-padding)]",
        className,
      )}
      // The legacy canvas stays at 24px even where older global mobile rules
      // otherwise reset [data-slot="page-canvas"] to 16px.
      style={{ padding: "var(--lms-canvas-padding)", ...style }}
    >
      {children}
    </div>
  );
}
