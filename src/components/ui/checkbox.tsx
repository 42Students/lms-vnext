"use client";

import type { ComponentPropsWithRef } from "react";
import { cx } from "@/lib/class-names";

export type CheckboxProps = Omit<ComponentPropsWithRef<"input">, "type"> & { indeterminate?: boolean };

/** Native keyboard and screen-reader semantics, with the old LMS teal check. */
export function Checkbox({ className, indeterminate = false, readOnly, onClick, onChange, onKeyDown, ref: forwardedRef, ...props }: CheckboxProps) {
  return <input {...props} type="checkbox" readOnly={readOnly} aria-readonly={readOnly || undefined}
    onClick={event => { if (readOnly) event.preventDefault(); else onClick?.(event); }}
    onKeyDown={event => { if (readOnly && event.key === " ") event.preventDefault(); else onKeyDown?.(event); }}
    onChange={event => { if (!readOnly) onChange?.(event); }}
    data-slot="checkbox" data-indeterminate={indeterminate ? "true" : undefined} aria-checked={indeterminate ? "mixed" : props["aria-checked"]}
    ref={node => { if (node) node.indeterminate = indeterminate; if (typeof forwardedRef === "function") forwardedRef(node); else if (forwardedRef) forwardedRef.current = node; }}
    className={cx("h-4 w-4 shrink-0 cursor-pointer aria-[readonly=true]:cursor-default align-middle rounded-[4px] transition-[outline-color,box-shadow] duration-[var(--lms-motion-fast)] border border-[var(--lms-neutral-200)] hover:border-[var(--lms-primary)] active:border-[var(--lms-primary)] bg-[var(--lms-form-bg)] accent-[var(--lms-primary)] checked:accent-[var(--lms-primary)] indeterminate:accent-[var(--lms-primary)] forced-colors:appearance-auto outline-none focus-ring aria-invalid:border-[var(--lms-error)] aria-invalid:accent-[var(--lms-error)] aria-invalid:focus-ring-error aria-invalid:focus-visible:shadow-(--lms-focus-ring-error) disabled:cursor-not-allowed disabled:opacity-50 disabled:accent-[var(--lms-neutral-400)] disabled:bg-[var(--lms-neutral-50)] disabled:checked:accent-[var(--lms-neutral-400)] motion-reduce:transition-none", className)} />;
}
