import type { ButtonHTMLAttributes } from "react";
import { cx } from "@/lib/class-names";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
};

const variantClasses = {
  primary:
    "border-primary bg-primary text-on-primary hover:border-primary-hover hover:bg-primary-hover focus-visible:ring-[var(--lms-focus-ring)]",
  secondary:
    "border-border bg-surface text-foreground hover:border-primary hover:bg-primary-subtle hover:text-primary-text focus-visible:ring-[var(--lms-focus-ring)]",
  ghost:
    "border-transparent bg-transparent text-body hover:bg-primary-subtle hover:text-primary-text focus-visible:ring-[var(--lms-focus-ring)]",
  danger:
    "border-error bg-error text-on-primary hover:opacity-90 focus-visible:ring-[var(--lms-error-subtle)]",
} as const;

const sizeClasses = {
  sm: "min-h-9 px-3 text-sm",
  md: "min-h-11 px-4 text-sm",
} as const;

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      data-slot="button"
      type={type}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-md border font-semibold transition-colors outline-none focus-visible:ring-4 disabled:pointer-events-none disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}
