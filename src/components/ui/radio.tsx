import type { ComponentPropsWithRef } from "react";
import { cx } from "@/lib/class-names";

export type RadioProps = Omit<ComponentPropsWithRef<"input">, "type">;

/** Native radio grouping, checked, disabled and focus behaviour. */
export function Radio({ className, ...props }: RadioProps) {
  return <input {...props} type="radio" data-slot="radio"
    className={cx("h-5 w-5 shrink-0 cursor-pointer rounded-full border border-[var(--lms-neutral-300)] accent-[var(--lms-primary)] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none", className)} />;
}
