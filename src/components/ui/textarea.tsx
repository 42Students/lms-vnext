import type { TextareaHTMLAttributes } from "react";
import { cx } from "@/lib/class-names";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean };

export function Textarea({ className, error = false, ...props }: TextareaProps) {
  return <textarea data-slot="textarea"
    className={cx("min-h-[112px] w-full min-w-0 resize-y rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-[var(--lms-form-bg)] px-[var(--lms-space-3)] py-[10px] text-[var(--lms-font-base)] font-normal leading-5 tracking-[0.2px] text-[var(--lms-form-ink)] caret-[var(--lms-primary)] outline-none shadow-none transition-[border-color,box-shadow,background-color] duration-200 ease-[var(--lms-motion-ease)] placeholder:text-[var(--lms-placeholder)] enabled:hover:border-[var(--lms-field-hover-border)] read-only:cursor-default read-only:bg-[var(--lms-neutral-50)] read-only:hover:border-[var(--lms-canvas-border)] focus-visible:shadow-[var(--lms-control-shadow)] focus-visible:border-[var(--lms-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] disabled:cursor-not-allowed disabled:opacity-100 disabled:border-[var(--lms-canvas-border)] disabled:bg-[var(--lms-neutral-50)] disabled:text-[var(--lms-neutral-400)] disabled:placeholder:text-[var(--lms-neutral-400)] aria-invalid:border-[var(--lms-error)] aria-invalid:enabled:hover:border-[var(--lms-error)] aria-invalid:bg-[rgba(239,68,68,0.06)] aria-invalid:focus-visible:shadow-[0_0_0_2px_rgba(239,68,68,0.2)] aria-invalid:focus-visible:border-[var(--lms-error)] aria-invalid:focus-visible:outline-[var(--lms-error)] motion-reduce:transition-none", className)}
    {...props} aria-invalid={error ? true : props["aria-invalid"]} />;
}
