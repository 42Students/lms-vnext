import type { ComponentPropsWithRef } from "react";
import { cx } from "@/lib/class-names";

export type SelectProps = ComponentPropsWithRef<"select"> & { error?: boolean };

export function Select({ className, children, error = false, ...props }: SelectProps) {
  return <select data-slot="select" className={cx("min-h-9 w-full min-w-0 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-white px-3 py-[7px] text-[14px] leading-5 tracking-[0.2px] text-[#0a0517] outline-none transition-colors duration-[var(--lms-motion-fast)] ease-[var(--lms-motion-ease)] hover:border-[#bfc9da] focus-visible:border-[var(--lms-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] disabled:cursor-not-allowed disabled:bg-[var(--lms-neutral-50)] disabled:text-[var(--lms-neutral-400)] aria-invalid:border-[var(--lms-error)] aria-invalid:bg-[var(--lms-error-subtle)] aria-invalid:focus-visible:border-[var(--lms-error)] aria-invalid:focus-visible:outline-[var(--lms-error)] motion-reduce:transition-none", className)}
    {...props} aria-invalid={error ? true : props["aria-invalid"]}>{children}</select>;
}
