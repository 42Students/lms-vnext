import type { ComponentPropsWithRef } from "react";
import { cx } from "@/lib/class-names";

export type CheckboxProps = Omit<ComponentPropsWithRef<"input">, "type">;

/** Native keyboard and screen-reader semantics, with the old LMS teal check. */
export function Checkbox({ className, ...props }: CheckboxProps) {
  return <input {...props} type="checkbox" data-slot="checkbox"
    className={cx("h-5 w-5 shrink-0 cursor-pointer rounded-[4px] border border-[var(--lms-neutral-300)] accent-[var(--lms-primary)] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none", className)} />;
}
