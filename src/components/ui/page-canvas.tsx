import type { HTMLAttributes } from "react";
import { cx } from "@/lib/class-names";

/**
 * Authenticated portal surface: exactly one continuous white old-LMS canvas.
 * The shared stylesheet owns desktop 24px and phone 16px inset rules.
 * AuthenticatedLayout positions it inside the grey AppShell background.
 */
export type PageCanvasProps = HTMLAttributes<HTMLDivElement>;

export function PageCanvas({ children, className, style, ...props }: PageCanvasProps) {
  return (
    <div
      {...props}
      data-slot="page-canvas"
      className={cx(
        "relative min-w-0 w-full rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-white p-[var(--lms-canvas-padding)] text-foreground shadow-none",
        className,
      )}
      style={style}
    >
      {children}
    </div>
  );
}
