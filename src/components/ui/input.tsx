import type { ComponentPropsWithRef } from "react";
import { cx } from "@/lib/class-names";

export type InputProps = ComponentPropsWithRef<"input"> & { error?: boolean };

export function Input({ className, error = false, ...props }: InputProps) {
  return <input data-slot="input" aria-invalid={error ? true : props["aria-invalid"]}
    className={cx("min-h-11 w-full min-w-0 rounded-md border border-border bg-surface px-3 text-base leading-6 text-foreground outline-none transition-colors duration-[120ms] placeholder:text-[var(--lms-placeholder)] hover:border-[var(--lms-neutral-700)] focus-visible:border-[var(--lms-teal-deep)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)] disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground aria-invalid:border-error motion-reduce:transition-none", className)}
    {...props} />;
}
