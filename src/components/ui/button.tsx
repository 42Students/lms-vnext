import type { ComponentPropsWithRef } from "react";
import { cx } from "@/lib/class-names";

export type ButtonProps = ComponentPropsWithRef<"button"> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  loading?: boolean;
};

const variantClasses = {
  primary: "border-[var(--lms-button-primary)] bg-[var(--lms-button-primary)] text-white hover:border-[var(--lms-button-primary-hover)] hover:bg-[var(--lms-button-primary-hover)]",
  secondary: "border-[#bfc9da] bg-surface text-[var(--lms-body-text)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary-subtle)] hover:text-[var(--lms-primary-text)]",
  ghost: "border-transparent bg-transparent text-[var(--lms-body-text)] hover:bg-[var(--lms-primary-subtle)] hover:text-[var(--lms-primary-text)]",
  danger: "border-[var(--lms-error)] bg-[var(--lms-error)] text-white hover:brightness-95",
} as const;
const sizeClasses = { sm: "min-h-[var(--lms-control-height)] px-[var(--lms-space-3)] text-[13px]", md: "min-h-[var(--lms-control-height)] px-3.5 text-[14px]" } as const;

export function Button({ className, variant = "primary", size = "md", loading = false, type = "button", disabled, children, ...props }: ButtonProps) {
  return <button data-slot="button" data-variant={variant} type={type} disabled={disabled || loading} {...props}
    aria-busy={loading ? true : props["aria-busy"]}
    className={cx("inline-flex min-h-[var(--lms-control-height)] cursor-pointer items-center justify-center gap-[var(--lms-space-2)] rounded-[var(--lms-control-radius)] border font-[650] leading-5 min-w-0 max-w-full text-center whitespace-normal break-words shadow-none outline-none motion-safe:transition-colors motion-safe:duration-[var(--lms-motion-fast)] motion-safe:ease-[var(--lms-motion-ease)] motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none aria-busy:cursor-progress", variantClasses[variant], sizeClasses[size], className)}
    >{children}</button>;
}
