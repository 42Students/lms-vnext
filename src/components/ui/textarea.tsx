import type { TextareaHTMLAttributes } from "react";
import { cx } from "@/lib/class-names";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean };

export function Textarea({ className, error = false, ...props }: TextareaProps) {
  return <textarea data-slot="textarea"
    className={cx("min-h-28 w-full min-w-0 resize-y rounded-[9px] border border-border bg-surface px-3 py-2.5 text-[14px] leading-5 tracking-[0.2px] text-foreground outline-none transition-colors duration-[var(--lms-motion-fast)] ease-[var(--lms-motion-ease)] placeholder:text-[var(--lms-placeholder)] hover:border-[#bfc9da] focus-visible:border-[var(--lms-teal-deep)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)] disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground aria-invalid:border-error motion-reduce:transition-none", className)}
    {...props} aria-invalid={error ? true : props["aria-invalid"]} />;
}
