import type { ComponentPropsWithRef } from "react";
import { cx } from "@/lib/class-names";

export type ButtonProps = ComponentPropsWithRef<"button"> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon" | "icon-sm";
  loading?: boolean;
};

const variantClasses = {
  primary: "border-[var(--lms-button-primary)] bg-[var(--lms-button-primary)] text-[var(--lms-on-primary)] enabled:hover:border-[var(--lms-button-primary-hover)] enabled:hover:bg-[var(--lms-button-primary-hover)] disabled:border-[var(--lms-neutral-200)] disabled:bg-[var(--lms-neutral-200)] disabled:text-[var(--lms-neutral-500)]",
  secondary: "border-[var(--lms-field-hover-border)] bg-[var(--lms-surface)] text-[var(--lms-body-text)] enabled:hover:border-[var(--lms-primary)] enabled:hover:bg-[var(--lms-primary)] enabled:hover:text-white",
  ghost: "border-transparent bg-transparent text-[var(--lms-body-text)] enabled:hover:bg-[var(--lms-primary-subtle)] enabled:hover:text-[var(--lms-primary-text)]",
  danger: "border-[var(--lms-error)] bg-[var(--lms-error)] text-[var(--lms-on-primary)] enabled:hover:border-[#dc2626] enabled:hover:bg-[#dc2626]",
} as const;
const sizeClasses = {
  sm: "min-h-[var(--lms-control-height)] px-[var(--lms-space-3)] text-[13px]",
  md: "min-h-[var(--lms-control-height)] px-3.5 text-[14px]",
  lg: "min-h-10 px-[var(--lms-space-5)] text-[14px]",
  icon: "h-9 w-9 min-w-9 shrink-0 p-0 text-[14px] max-sm:min-h-11 max-sm:min-w-11",
  "icon-sm": "h-9 w-9 min-w-9 shrink-0 p-0 text-[13px] max-sm:min-h-11 max-sm:min-w-11",
} as const;

export function Button({ className, variant = "primary", size = "md", loading = false, type = "button", disabled, children, ...props }: ButtonProps) {
  return <button data-slot="button" data-variant={variant} type={type} disabled={disabled || loading} {...props}
    aria-busy={loading ? true : props["aria-busy"]}
    className={cx("inline-flex min-h-[var(--lms-control-height)] cursor-pointer items-center justify-center gap-[var(--lms-space-2)] rounded-[var(--lms-control-radius)] border font-[650] leading-5 min-w-0 max-w-full text-center whitespace-normal break-words shadow-none outline-none motion-safe:transition-colors motion-safe:duration-[var(--lms-motion-fast)] motion-safe:ease-[var(--lms-motion-ease)] motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] disabled:cursor-not-allowed disabled:opacity-100 disabled:shadow-none aria-busy:cursor-progress aria-busy:pointer-events-none enabled:active:translate-y-px motion-reduce:active:translate-y-0", variantClasses[variant], sizeClasses[size], className)}
    >{loading ? <span aria-hidden="true" className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none" /> : null}{children}</button>;
}
