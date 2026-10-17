"use client";

import type { ComponentPropsWithRef, ReactNode } from "react";
import { cx } from "@/lib/class-names";

type NativeInput = Omit<ComponentPropsWithRef<"input">, "type"> & { label: ReactNode };
type SwitchProps = Omit<NativeInput, "role">;

function Control({ label, type, className, ...props }: NativeInput & { type: "checkbox" | "radio" }) {
  return (
    <label className={cx("inline-flex min-h-11 min-w-11 cursor-pointer items-center gap-3 text-base text-foreground has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50", className)}>
      <input type={type} className="h-5 w-5 shrink-0 accent-[var(--lms-teal-deep)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]" {...props} />
      <span className="min-w-0 break-words">{label}</span>
    </label>
  );
}

export function Checkbox(props: NativeInput) { return <Control {...props} type="checkbox" />; }
export function Radio(props: NativeInput) { return <Control {...props} type="radio" />; }
export function Switch({ label, className, ...props }: SwitchProps) {
  return (
    <label className={cx("inline-flex min-h-11 cursor-pointer items-center gap-3 text-base text-foreground has-[:disabled]:opacity-50", className)}>
      <input type="checkbox" role="switch" className="peer sr-only" {...props} />
      <span aria-hidden="true" className="relative block h-7 w-12 shrink-0 rounded-full border-2 border-[var(--lms-neutral-700)] bg-muted transition-colors duration-[120ms] after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-[var(--lms-neutral-900)] after:transition-transform after:duration-[120ms] peer-checked:bg-primary peer-checked:after:translate-x-5 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--lms-teal-deep)] peer-disabled:opacity-50 motion-reduce:transition-none" />
      <span className="min-w-0 break-words">{label}</span>
    </label>
  );
}
