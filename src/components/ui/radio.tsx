import type { ComponentPropsWithRef } from "react";
import { cx } from "@/lib/class-names";

export type RadioProps = Omit<ComponentPropsWithRef<"input">, "type">;

/** Native radio grouping, checked, disabled and focus behaviour. */
export function Radio({ className, ...props }: RadioProps) {
  return <input {...props} type="radio" data-slot="radio"
    className={cx("h-4 w-4 shrink-0 cursor-pointer rounded-full border border-[#d6dbe3] accent-[#26bac7] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#26bac7] disabled:cursor-not-allowed disabled:opacity-50", className)} />;
}
