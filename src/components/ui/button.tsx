import type { ComponentPropsWithRef } from "react";
import { cx } from "@/lib/class-names";

export type ButtonProps = ComponentPropsWithRef<"button"> & {
  /** "bare" keeps behaviour (type, focus ring, disabled) but no chrome: for tabs, menu rows and skin-styled buttons only. */
  variant?: "primary" | "secondary" | "ghost" | "danger" | "link" | "chip" | "menu-item" | "bare";
  size?: "sm" | "md" | "lg" | "icon" | "icon-sm" | "nav" | "inline";
  loading?: boolean;
};

const variantClasses = {
  primary: "border-[var(--lms-button-primary)] bg-[var(--lms-button-primary)] text-[var(--lms-on-primary)] enabled:hover:border-[var(--lms-button-primary-hover)] enabled:hover:bg-[var(--lms-button-primary-hover)] disabled:border-[var(--lms-neutral-200)] disabled:bg-[var(--lms-neutral-200)] disabled:text-[var(--lms-neutral-500)]",
  secondary: "border-[var(--lms-field-hover-border)] bg-[var(--lms-surface)] text-[var(--lms-body-text)] enabled:hover:border-[var(--lms-primary)] enabled:hover:bg-[var(--lms-primary-subtle)] enabled:hover:text-[var(--lms-button-primary)]",
  ghost: "border-transparent bg-transparent text-[var(--lms-body-text)] enabled:hover:bg-[var(--lms-primary-subtle)] enabled:hover:text-[var(--lms-primary-text)]",
  link: "border-transparent bg-transparent text-[var(--lms-link-text)] underline-offset-4 enabled:hover:underline enabled:hover:text-[var(--lms-link-text)]",
  danger: "border-[var(--lms-error)] bg-[var(--lms-error)] text-[var(--lms-on-primary)] enabled:hover:border-[color:var(--lms-error)] enabled:hover:bg-[color:var(--lms-error)]",
  chip: "rounded-full border-[var(--lms-border)] bg-[var(--lms-surface)] text-[var(--lms-text-body)] enabled:hover:border-[var(--lms-primary)] aria-pressed:border-[var(--lms-primary-text)] aria-pressed:bg-[var(--lms-primary-subtle)] aria-pressed:text-[var(--lms-button-primary)]",
  "menu-item": "w-full justify-start rounded-[var(--lms-control-radius)] border-transparent bg-transparent text-left font-normal text-[var(--lms-text-body)] enabled:hover:bg-[var(--lms-primary-subtle)] aria-selected:bg-[var(--lms-primary-subtle)] aria-pressed:bg-[var(--lms-primary-subtle)]",
} as const;
const sizeClasses = {
  sm: "min-h-[var(--lms-control-height)] px-[var(--lms-space-3)] text-[13px]",
  md: "min-h-[var(--lms-control-height)] px-4 text-[14px]",
  lg: "min-h-11 px-[var(--lms-space-5)] text-[14px]",
  icon: "h-9 w-9 min-w-9 shrink-0 p-0 text-[14px] max-md:min-h-11 max-md:min-w-11",
  "icon-sm": "h-9 w-9 min-w-9 shrink-0 p-0 text-[13px] max-md:min-h-11 max-md:min-w-11",
  nav: "min-h-9 px-[var(--lms-space-3)] text-[13px] max-md:min-h-11",
  inline: "",
} as const;

const bareClasses = "cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50";

export function buttonClasses({ variant = "primary", size = "md", className }: { variant?: Exclude<NonNullable<ButtonProps["variant"]>, "bare">; size?: NonNullable<ButtonProps["size"]>; className?: string }) {
  if (size === "inline") return cx("inline cursor-pointer border-0 bg-transparent p-0 font-semibold text-[var(--lms-link-text)] underline underline-offset-4 outline-none focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] disabled:cursor-not-allowed disabled:opacity-50", className);
  return cx("inline-flex min-h-[var(--lms-control-height)] max-md:min-h-11 cursor-pointer items-center justify-center gap-[var(--lms-space-2)] rounded-[var(--lms-control-radius)] border font-semibold leading-5 min-w-0 max-w-full text-center whitespace-normal break-words shadow-none outline-none motion-safe:transition-colors motion-safe:duration-[var(--lms-motion-fast)] motion-safe:ease-[var(--lms-motion-ease)] motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] focus-visible:shadow-(--lms-focus-ring) disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none aria-busy:cursor-progress aria-busy:pointer-events-none enabled:active:translate-y-px motion-reduce:active:translate-y-0", variant === "primary" && "focus-visible:!outline-[var(--lms-primary-text)] focus-visible:!shadow-none", variantClasses[variant as Exclude<typeof variant, "bare">], sizeClasses[size], className);
}

export function Button({ className, variant = "primary", size = "md", loading = false, type = "button", disabled, children, ...props }: ButtonProps) {
  if (variant === "bare") return <button data-slot="button" data-variant="bare" type={type} disabled={disabled} {...props} className={cx(bareClasses, className)}>{children}</button>;
  const buttonClassName = buttonClasses({ variant, size, className });
  return <button data-slot="button" data-variant={variant} data-size={size} data-loading={loading ? "true" : undefined} type={type} disabled={disabled || loading} {...props}
    aria-busy={loading ? true : props["aria-busy"]}
    className={buttonClassName}
    >{loading ? <span aria-hidden="true" className="inline-flex shrink-0 items-center gap-[2px]">{[0, 1, 2].map(index => <span key={index} className="h-[4px] w-[4px] rounded-full bg-current animate-pulse motion-reduce:animate-none" />)}</span> : null}{children}</button>;
}
