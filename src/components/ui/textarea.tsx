import type { TextareaHTMLAttributes } from "react";
import { cx } from "@/lib/class-names";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean };

export function Textarea({ className, error = false, ...props }: TextareaProps) {
  return <textarea data-slot="textarea"
    className={cx("min-h-28 w-full min-w-0 resize-y rounded-md border border-border bg-surface px-3 py-2 text-base leading-6 text-foreground outline-none transition-colors duration-[120ms] placeholder:text-[var(--lms-placeholder)] hover:border-[var(--lms-neutral-700)] focus-visible:border-[var(--lms-teal-deep)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)] disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground aria-invalid:border-error motion-reduce:transition-none", className)}
    {...props} aria-invalid={error ? true : props["aria-invalid"]} />;
}
