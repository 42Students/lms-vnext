import type { InputHTMLAttributes } from "react";
import { cx } from "@/lib/class-names";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      data-slot="input"
      className={cx(
        "min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground outline-none transition placeholder:text-[var(--lms-placeholder)] focus:border-primary focus:ring-4 focus:ring-[var(--lms-focus-ring)] disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}
