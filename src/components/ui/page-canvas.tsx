import type { HTMLAttributes } from "react";
import { cx } from "@/lib/class-names";

/** One continuous legacy LMS page surface; sections inside keep their own structure.
 * The surrounding authenticated shell supplies the #f1f4f9 page background.
 */
export type PageCanvasProps = HTMLAttributes<HTMLDivElement>;

export function PageCanvas({ children, className, ...props }: PageCanvasProps) {
  return (
    <div
      data-slot="page-canvas"
      className={cx("min-w-0 w-full rounded-[12px] border border-[#e5e9f0] bg-white p-4 text-foreground shadow-none sm:p-6", className)}
      {...props}
    >
      {children}
    </div>
  );
}
