import type { ComponentPropsWithRef } from "react";
import { cx } from "@/lib/class-names";

export type SelectProps = ComponentPropsWithRef<"select"> & { error?: boolean };

/**
 * Native select retains OS keyboard/typeahead, autofill, multiple/size, form
 * submission, and forwarded ref. Only the field chrome is cloned.
 *
 * Legacy: components___form.scss:117-143 (10px, 14px/400/20px, 0.2px
 * tracking, teal 15% focus halo and red 20% error halo).
 * Legacy: components___antddesign.scss:134-140 (teal/white selected option),
 * :511-524 (AntD selector 10px, 14px/400). Popup paint varies by OS;
 * we do not replace the accessible native popup or fake popup geometry.
 */
const selectControlBaseClass = "min-h-[var(--lms-control-height)] max-md:min-h-11 w-full min-w-0 cursor-pointer appearance-auto";

export function Select({ className, children, error = false, ...props }: SelectProps) {
  const invalid = error || props["aria-invalid"] === true || props["aria-invalid"] === "true";
  return (
    <select
      data-slot="select"
      {...props}
      aria-invalid={invalid ? true : props["aria-invalid"]}
      className={cx(
        selectControlBaseClass,
        // iOS native picker controls need 16px to avoid forced browser zoom.
        "max-md:text-[16px] max-md:leading-6",
        "rounded-[var(--lms-field-radius)] border border-[var(--lms-canvas-border)]",
        "bg-[var(--lms-form-bg)] px-[var(--lms-space-3)] py-[8px]",
        "font-[inherit] text-[var(--lms-font-base)] font-normal leading-5 tracking-[0.2px] text-[var(--lms-form-ink)]",
        "outline-none shadow-none transition-[border-color,box-shadow,background-color] duration-[var(--lms-motion-fast)] ease-[var(--lms-motion-ease)]",
        "enabled:hover:border-[var(--lms-field-hover-border)]",
        "focus-visible:border-[var(--lms-primary)] focus-visible:shadow-(--lms-control-shadow)",
        "focus-ring",
        "disabled:cursor-not-allowed disabled:select-none disabled:opacity-100",
        "disabled:border-[var(--lms-canvas-border)] disabled:bg-[var(--lms-neutral-50)] disabled:text-[var(--lms-neutral-400)]",
        "aria-invalid:border-[var(--lms-error)] aria-invalid:bg-[color-mix(in_srgb,var(--lms-error)_6%,transparent)]",
        "aria-invalid:enabled:hover:border-[var(--lms-error)]",
        "aria-invalid:focus-visible:border-[var(--lms-error)]",
        "aria-invalid:focus-visible:shadow-(--lms-focus-ring-error)",
        "aria-invalid:focus-visible:outline-[var(--lms-error)]",
        "aria-invalid:disabled:border-[var(--lms-canvas-border)] aria-invalid:disabled:bg-[var(--lms-neutral-50)]",
        "[&_option:checked]:bg-[var(--lms-primary)] [&_option:checked]:text-[color:var(--lms-on-primary)]",
        "[&_option[value='']]:text-[var(--lms-placeholder)]",
        "motion-reduce:transition-none",
        className,
      )}
    >
      {children}
    </select>
  );
}
