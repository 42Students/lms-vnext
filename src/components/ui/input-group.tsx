import type { ComponentPropsWithRef, ReactNode } from "react";
import { cx } from "@/lib/class-names";

export type InputGroupProps = Omit<ComponentPropsWithRef<"div">, "children"> & {
  prefix?: ReactNode;
  suffix?: ReactNode;
  /** Set true when the adornment is a focusable action, not a decorative icon. */
  prefixInteractive?: boolean;
  suffixInteractive?: boolean;
  children: ReactNode;
  /** A visible field label belongs outside this group; this names grouped controls. */
  label?: string;
};

/**
 * Grouped input with one outer 10px field border/focus/error halo.
 * Legacy: components___form.scss:117-143 (.ln-in2, 10px, teal/red focus).
 * Prefix/suffix stay decorative; the input retains its own accessible name.
 */
export function InputGroup({ prefix, suffix, prefixInteractive = false, suffixInteractive = false, children, className, label, ...props }: InputGroupProps) {
  return (
    <div {...props} data-slot="input-group" role={label ? "group" : props.role}
      aria-label={label ?? props["aria-label"]}
      className={cx(
        "flex min-h-[var(--lms-control-height)] max-[767px]:min-h-11 min-w-0 items-center gap-2 rounded-[var(--lms-field-radius)]",
        "border border-[var(--lms-canvas-border)] bg-[var(--lms-form-bg)] px-3",
        "focus-within:border-[var(--lms-primary)] focus-within:shadow-[var(--lms-control-shadow)]",
        "has-[[aria-invalid=true]]:border-[var(--lms-error)]",
        "has-[[aria-invalid=true]]:focus-within:shadow-[0_0_0_2px_rgba(239,68,68,0.2)]",
        "has-[:disabled]:bg-[var(--lms-neutral-50)] has-[:disabled]:text-[var(--lms-neutral-400)]",
        "has-[:read-only]:bg-[var(--lms-neutral-50)]",
        className,
      )}>
      {prefix ? <span data-slot="input-prefix" aria-hidden={prefixInteractive ? undefined : true} className="shrink-0 text-[13px] text-[var(--lms-muted-text)]">{prefix}</span> : null}
      <div className="min-w-0 flex-1 [&_[data-slot=input]]:border-0 [&_[data-slot=input]]:bg-transparent [&_[data-slot=input]]:px-0 [&_[data-slot=input]]:shadow-none [&_[data-slot=input]]:outline-none">
        {children}
      </div>
      {suffix ? <span data-slot="input-suffix" aria-hidden={suffixInteractive ? undefined : true} className="shrink-0 text-[13px] text-[var(--lms-muted-text)]">{suffix}</span> : null}
    </div>
  );
}
