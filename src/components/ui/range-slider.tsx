import type { ComponentPropsWithRef } from "react";
import { cx } from "@/lib/class-names";
export type RangeSliderProps = Omit<ComponentPropsWithRef<"input">,"type"> & { label?: string };
/** Native range input with the same teal keyboard/focus and disabled semantics. */
export function RangeSlider({label,className,id,...props}:RangeSliderProps) {
  return <label data-slot="range-slider" className="flex min-w-0 items-center gap-3 text-[13px] font-medium text-[var(--lms-body-text)]">
    {label ? <span>{label}</span> : null}
    <input {...props} id={id} type="range" aria-label={props["aria-label"]??label} className={cx("h-9 min-w-0 flex-1 cursor-pointer accent-[var(--lms-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] disabled:cursor-not-allowed disabled:opacity-50",className)} />
  </label>;
}
