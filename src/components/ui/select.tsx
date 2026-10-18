import type { ComponentPropsWithRef } from "react";
import { cx } from "@/lib/class-names";

export type SelectProps = ComponentPropsWithRef<"select"> & { error?: boolean };

export function Select({ className, children, error = false, ...props }: SelectProps) {
  return <select data-slot="select" className={cx("min-h-9 w-full min-w-0 rounded-[9px] border border-border bg-surface px-3 py-[7px] text-[14px] leading-5 tracking-[0.2px] text-foreground outline-none transition-colors duration-[var(--lms-motion-fast)] ease-[var(--lms-motion-ease)] hover:border-[#bfc9da] focus-visible:border-[var(--lms-teal-deep)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)] disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground aria-invalid:border-error motion-reduce:transition-none", className)}
    {...props} aria-invalid={error ? true : props["aria-invalid"]}>{children}</select>;
}
