import type { ComponentPropsWithRef } from "react";
import { cx } from "@/lib/class-names";

export type InputProps = ComponentPropsWithRef<"input"> & { error?: boolean };

/**
 * Default old LMS .ln-in2 field chrome, without overriding native input type,
 * controlled value, forwarding ref, autocomplete, calendar or upload behavior.
 * Legacy: components___form.scss:117-143: #fbfcfd, radius 10px,
 * font 14px / 400 / 20px, tracking .2px, teal 15% focus halo and 20% red
 * invalid halo. Legacy: components___variables.scss:139,148 (44px phone tap).
 */
export function Input({ className, error = false, ...props }: InputProps) {
  const placeholder = props.placeholder ?? (props.type === "search" ? "Search..." : undefined);
  const invalid = error || props["aria-invalid"] === true || props["aria-invalid"] === "true";
  return (
    <input
      data-slot="input"
      {...props}
      placeholder={placeholder}
      aria-invalid={invalid ? true : props["aria-invalid"]}
      className={cx(
        "min-h-[var(--lms-control-height)] max-[767px]:min-h-11 w-full min-w-0 font-[inherit]",
        "rounded-[var(--lms-field-radius)] border border-[var(--lms-canvas-border)]",
        "bg-[var(--lms-form-bg)] px-[var(--lms-space-3)] py-[7px]",
        "text-[var(--lms-font-base)] font-normal leading-5 tracking-[0.2px] text-[var(--lms-form-ink)]",
        "caret-[var(--lms-primary)] outline-none shadow-none",
        "transition-[border-color,box-shadow,background-color] duration-200 ease-[var(--lms-motion-ease)]",
        "placeholder:text-[var(--lms-placeholder)] selection:bg-[var(--lms-primary-subtle)] selection:text-[var(--lms-form-ink)]",
        "enabled:not-read-only:hover:border-[var(--lms-field-hover-border)]",
        "read-only:cursor-default read-only:bg-[var(--lms-neutral-50)] read-only:hover:border-[var(--lms-canvas-border)]",
        "focus-visible:border-[var(--lms-primary)] focus-visible:shadow-[var(--lms-control-shadow)]",
        "focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]",
        "disabled:cursor-not-allowed disabled:opacity-100 disabled:select-none",
        "disabled:border-[var(--lms-canvas-border)] disabled:bg-[var(--lms-neutral-50)] disabled:text-[var(--lms-neutral-400)]",
        "disabled:placeholder:text-[var(--lms-neutral-400)]",
        "aria-invalid:border-[var(--lms-error)] aria-invalid:bg-[rgba(239,68,68,0.06)]",
        "aria-invalid:enabled:hover:border-[var(--lms-error)]",
        "aria-invalid:placeholder:text-[var(--lms-neutral-400)]",
        "aria-invalid:focus-visible:border-[var(--lms-error)]",
        "aria-invalid:focus-visible:shadow-[0_0_0_2px_rgba(239,68,68,0.2)]",
        "aria-invalid:focus-visible:outline-[var(--lms-error)]",
        props.type === "search" && "rounded-[8px] pr-[44px] [background-image:url('/assets/images/common/search.svg')] [background-position:right_15px_center] [background-repeat:no-repeat] [background-size:19px_19px] focus:[background-image:none]",
        "motion-reduce:transition-none",
        className,
      )}
    />
  );
}
