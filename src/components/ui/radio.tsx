import type { ComponentPropsWithRef } from "react";
import { cx } from "@/lib/class-names";

export type RadioProps = Omit<ComponentPropsWithRef<"input">, "type">;

/** Native radio grouping, checked, disabled and focus behaviour. */
export function Radio({ className, readOnly, onClick, onKeyDown, onChange, ...props }: RadioProps) {
  return <input {...props} type="radio" readOnly={readOnly} aria-readonly={readOnly || undefined}
    onClick={event => { if (readOnly) event.preventDefault(); else onClick?.(event); }}
    onKeyDown={event => { if (readOnly && [" ", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) event.preventDefault(); else onKeyDown?.(event); }}
    onChange={event => { if (!readOnly) onChange?.(event); }}
    data-slot="radio"
    className={cx("h-4 w-4 shrink-0 cursor-pointer aria-[readonly=true]:cursor-default align-middle rounded-full transition-[outline-color,box-shadow] duration-150 border border-[var(--lms-neutral-300)] bg-[var(--lms-form-bg)] accent-[var(--lms-primary)] checked:accent-[var(--lms-primary)] forced-colors:appearance-auto outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] focus-visible:shadow-[var(--lms-control-shadow)] aria-invalid:border-[var(--lms-error)] aria-invalid:accent-[var(--lms-error)] aria-invalid:focus-visible:outline-[var(--lms-error)] aria-invalid:focus-visible:shadow-[0_0_0_2px_rgba(239,68,68,0.2)] disabled:cursor-not-allowed disabled:opacity-50 disabled:accent-[var(--lms-neutral-400)] disabled:bg-[var(--lms-neutral-50)] disabled:checked:accent-[var(--lms-neutral-400)] motion-reduce:transition-none", className)} />;
}
