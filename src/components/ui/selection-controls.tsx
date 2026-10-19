"use client";

import type { ComponentPropsWithRef, ReactNode } from "react";
import { cx } from "@/lib/class-names";
import { Checkbox as NativeCheckbox } from "./checkbox";
import { Radio as NativeRadio } from "./radio";

type NativeInput = Omit<ComponentPropsWithRef<"input">, "type"> & { label: ReactNode };
type SwitchProps = Omit<NativeInput, "role">;

function Control({ label, type, className, ...props }: NativeInput & { type: "checkbox" | "radio" }) {
  return (
    <label className={cx("inline-flex min-h-11 min-w-11 cursor-pointer items-center gap-[var(--lms-space-3)] text-[14px] leading-5 text-[var(--lms-body-text)] has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50", className)}>
      {type === "checkbox" ? <NativeCheckbox {...props} /> : <NativeRadio {...props} />}
      <span className="min-w-0 break-words">{label}</span>
    </label>
  );
}

export function Checkbox(props: NativeInput) { return <Control {...props} type="checkbox" />; }
export function Radio(props: NativeInput) { return <Control {...props} type="radio" />; }
export function Switch({ label, className, ...props }: SwitchProps) {
  return (
    <label className={cx("inline-flex min-h-11 cursor-pointer items-center gap-[var(--lms-space-3)] text-[14px] leading-5 text-[var(--lms-body-text)] has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50", className)}>
      <NativeCheckbox role="switch" className="peer sr-only" {...props} />
      <span aria-hidden="true" className="relative block h-7 w-12 shrink-0 rounded-full border-2 border-[var(--lms-neutral-300)] bg-[var(--lms-neutral-100)] transition-colors duration-[var(--lms-motion-fast)] ease-[var(--lms-motion-ease)] after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform after:duration-[var(--lms-motion-fast)] after:ease-[var(--lms-motion-ease)] peer-checked:border-[var(--lms-button-primary)] peer-checked:bg-[var(--lms-button-primary)] peer-checked:after:translate-x-5 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--lms-primary)] peer-disabled:opacity-50 motion-reduce:transition-none motion-reduce:after:transition-none" />
      <span className="min-w-0 break-words">{label}</span>
    </label>
  );
}
