import type { TextareaHTMLAttributes } from "react";
import { cx } from "@/lib/class-names";

export type TextareaProps =
  TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({
  className,
  ...props
}: TextareaProps) {
  return (
    <textarea
      data-slot="textarea"
      className={cx(
        "min-h-28 w-full resize-y rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-[var(--lms-placeholder)] focus:border-primary focus:ring-4 focus:ring-[var(--lms-focus-ring)] disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}
