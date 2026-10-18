import type { ComponentPropsWithRef } from "react";
import { cx } from "@/lib/class-names";

export type InputProps = ComponentPropsWithRef<"input"> & { error?: boolean };

export function Input({ className, error = false, ...props }: InputProps) {
  return <input data-slot="input" className={cx("min-h-9 w-full min-w-0 rounded-[9px] border border-border bg-surface px-3 py-[7px] text-[14px] leading-5 tracking-[0.2px] text-foreground outline-none transition-colors duration-[var(--lms-motion-fast)] ease-[var(--lms-motion-ease)] placeholder:text-[var(--lms-placeholder)] hover:border-[#bfc9da] focus-visible:border-[var(--lms-teal-deep)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)] disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground aria-invalid:border-error motion-reduce:transition-none", className)}
    {...props} aria-invalid={error ? true : props["aria-invalid"]} />;
}
