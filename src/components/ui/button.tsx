import type { ComponentPropsWithRef } from "react";
import { cx } from "@/lib/class-names";

export type ButtonProps = ComponentPropsWithRef<"button"> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  loading?: boolean;
};

const variantClasses = {
  primary: "border-primary bg-primary text-on-primary hover:border-primary-hover hover:bg-primary-hover",
  secondary: "border-[#bfc9da] bg-surface text-[#54505d] hover:border-[#26bac7] hover:bg-primary-subtle hover:text-[#1a95a1]",
  ghost: "border-transparent bg-transparent text-[#54505d] hover:bg-primary-subtle hover:text-[#1a95a1]",
  danger: "border-error bg-error text-white hover:brightness-95",
} as const;
const sizeClasses = { sm: "min-h-9 px-3 text-[13px]", md: "min-h-9 px-3.5 text-[14px]" } as const;

export function Button({ className, variant = "primary", size = "md", loading = false, type = "button", disabled, children, ...props }: ButtonProps) {
  return <button data-slot="button" data-variant={variant} type={type} disabled={disabled || loading} {...props}
    aria-busy={loading ? true : props["aria-busy"]}
    className={cx("inline-flex min-h-9 items-center justify-center gap-2 rounded-[9px] border font-[650] leading-5 outline-none motion-safe:transition-colors motion-safe:duration-[var(--lms-motion-fast)] motion-safe:ease-[var(--lms-motion-ease)] motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)] disabled:cursor-not-allowed disabled:opacity-50", variantClasses[variant], sizeClasses[size], className)}
    >{children}</button>;
}
