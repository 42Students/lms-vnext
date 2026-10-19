import type { TextareaHTMLAttributes } from "react";
import { cx } from "@/lib/class-names";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean };

export function Textarea({ className, error = false, ...props }: TextareaProps) {
  return <textarea data-slot="textarea"
    className={cx("min-h-28 w-full min-w-0 resize-y rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-white px-3 py-2.5 text-[14px] leading-5 tracking-[0.2px] text-[#0a0517] outline-none transition-colors duration-[var(--lms-motion-fast)] ease-[var(--lms-motion-ease)] placeholder:text-[var(--lms-placeholder)] hover:border-[#bfc9da] focus-visible:border-[var(--lms-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] disabled:cursor-not-allowed disabled:bg-[var(--lms-neutral-50)] disabled:text-[var(--lms-neutral-400)] aria-invalid:border-[var(--lms-error)] aria-invalid:bg-[var(--lms-error-subtle)] aria-invalid:focus-visible:border-[var(--lms-error)] aria-invalid:focus-visible:outline-[var(--lms-error)] motion-reduce:transition-none", className)}
    {...props} aria-invalid={error ? true : props["aria-invalid"]} />;
}
