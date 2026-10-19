import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/class-names";

export type DropdownProps = Omit<HTMLAttributes<HTMLDetailsElement>, "children"> & {
  trigger: ReactNode;
  children: ReactNode;
  label?: string;
  align?: "start" | "end";
};

/** Native disclosure handles Enter/Space without a JavaScript dependency. */
export function Dropdown({ trigger, children, label, align = "start", className, ...props }: DropdownProps) {
  return <details data-slot="dropdown-root" className={cx("group relative inline-block min-w-0 align-middle", className)} {...props}>
    <summary aria-label={label} className="inline-flex min-h-9 cursor-pointer list-none items-center gap-2 rounded-[9px] border border-[#e5e9f0] bg-white px-3 text-[14px] font-semibold leading-5 text-[#54505d] transition-colors duration-150 hover:bg-[#eff8fa] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#26bac7] [&::-webkit-details-marker]:hidden">{trigger}</summary>
    <div data-slot="dropdown"
      className={cx("absolute top-[calc(100%+5px)] z-40 min-w-52 max-w-[calc(100vw-2rem)] rounded-[6px] border border-[#e5e9f0] bg-white p-3 text-[14px] leading-5 text-[#54505d] shadow-[var(--lms-dropdown-shadow)] sm:p-4", align === "end" ? "right-0" : "left-0")}>{children}</div>
  </details>;
}
