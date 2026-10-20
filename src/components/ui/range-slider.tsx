"use client";

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
export function RangeSlider({ label, className, id, error = false, readOnly, onPointerDown, onKeyDown, onChange, ...props }: RangeSliderProps) {
  const isReadOnlyKey = (key: string) =>
    ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"].includes(key);
  return (
    <label data-slot="range-slider"
      className="flex min-w-0 flex-wrap items-center gap-3 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] has-[:disabled]:cursor-not-allowed has-[:disabled]:text-[var(--lms-neutral-400)] has-[[aria-readonly=true]]:cursor-default">
      {label ? <span className="min-w-0 break-words">{label}{props.required ? <span aria-hidden="true" className="ml-1 text-[var(--lms-error)]">*</span> : null}{props.required ? <span className="sr-only"> required</span> : null}</span> : null}
      <input {...props} id={id} data-slot="range-slider-input" type="range"
        readOnly={readOnly} aria-readonly={readOnly || undefined}
        onPointerDown={event => { onPointerDown?.(event); if (readOnly) event.preventDefault(); }}
        onKeyDown={event => { onKeyDown?.(event); if (readOnly && isReadOnlyKey(event.key)) event.preventDefault(); }}
        onChange={event => { if (!readOnly) onChange?.(event); }}
        aria-label={props["aria-label"] ?? label ?? "Range value"}
        aria-invalid={error ? true : props["aria-invalid"]}
        className={cx(
          "min-h-9 min-w-[120px] flex-1 cursor-pointer accent-[var(--lms-primary)]",
          "max-[767px]:min-h-11",
          "focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]",
          "aria-invalid:accent-[var(--lms-error)] aria-invalid:focus-visible:outline-[var(--lms-error)]",
          "disabled:cursor-not-allowed disabled:opacity-100 disabled:accent-[var(--lms-neutral-400)] read-only:cursor-default motion-reduce:transition-none",
          className,
        )}
      />
    </label>
  );
}
