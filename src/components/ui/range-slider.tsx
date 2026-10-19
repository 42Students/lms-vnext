import type { ComponentPropsWithRef } from "react";
import { cx } from "@/lib/class-names";

export type RangeSliderProps = Omit<ComponentPropsWithRef<"input">, "type"> & {
  label?: string;
  error?: boolean;
};

/**
 * Native range/keyboard behavior, with legacy teal accent.
 * Legacy: components___variables.scss:10 (#26bac7), :139 (44px touch);
 * components___form.scss:110-115 (13px / weight 600 field label).
 */
export function RangeSlider({ label, className, id, error = false, ...props }: RangeSliderProps) {
  return (
    <label data-slot="range-slider"
      className="flex min-w-0 flex-wrap items-center gap-3 text-[13px] font-semibold leading-4 text-[var(--lms-body-text)] has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
      {label ? <span className="min-w-0 break-words">{label}</span> : null}
      <input {...props} id={id} data-slot="range-slider-input" type="range"
        aria-label={props["aria-label"] ?? label ?? "Range value"}
        aria-invalid={error ? true : props["aria-invalid"]}
        className={cx(
          "min-h-9 min-w-[120px] flex-1 cursor-pointer accent-[var(--lms-primary)]",
          "max-[767px]:min-h-11",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]",
          "aria-invalid:accent-[var(--lms-error)] aria-invalid:focus-visible:outline-[var(--lms-error)]",
          "disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none",
          className,
        )}
      />
    </label>
  );
}
