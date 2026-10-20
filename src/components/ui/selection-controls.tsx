"use client";

import type { ComponentPropsWithRef, ReactNode } from "react";
import { cx } from "@/lib/class-names";
import { Checkbox as NativeCheckbox } from "./checkbox";
import { Radio as NativeRadio } from "./radio";

type NativeInput = Omit<ComponentPropsWithRef<"input">, "type"> & { label: ReactNode; indeterminate?: boolean };
type SwitchProps = Omit<NativeInput, "role">;

function Control({ label, type, className, indeterminate, ...props }: NativeInput & { type: "checkbox" | "radio" }) {
  return (
    <label className={cx("inline-flex min-h-11 min-w-11 cursor-pointer items-center gap-[var(--lms-space-3)] text-[14px] leading-5 text-[var(--lms-body-text)] has-[:disabled]:cursor-not-allowed has-[:disabled]:text-[var(--lms-neutral-400)] has-[[aria-readonly=true]]:cursor-default", className)}>
      {type === "checkbox" ? <NativeCheckbox {...props} indeterminate={indeterminate} /> : <NativeRadio {...props} />}
      <span className="min-w-0 break-words">{label}{props.required ? <span aria-hidden="true" className="ml-1 text-[var(--lms-error)]">*</span> : null}{props.required ? <span className="sr-only"> required</span> : null}</span>
    </label>
  );
}

export function Checkbox(props: NativeInput) { return <Control {...props} type="checkbox" />; }
export function Radio(props: NativeInput) { return <Control {...props} type="radio" />; }
export function Switch({ label, className, indeterminate: _indeterminate, ...props }: SwitchProps) {
  return (
    <label className={cx("inline-flex min-h-11 cursor-pointer items-center gap-[var(--lms-space-3)] text-[14px] leading-5 text-[var(--lms-body-text)] has-[:disabled]:cursor-not-allowed has-[:disabled]:text-[var(--lms-neutral-400)] has-[[aria-readonly=true]]:cursor-default", className)}>
      <NativeCheckbox role="switch" className="peer sr-only" {...props} />
      <span aria-hidden="true" className="relative block h-[22px] w-11 shrink-0 rounded-full border-2 border-[var(--lms-neutral-300)] bg-[var(--lms-neutral-100)] transition-[background-color,border-color] duration-[var(--lms-motion-fast)] ease-[var(--lms-motion-ease)] after:absolute after:left-[1px] after:top-0 after:h-[18px] after:w-[18px] after:rounded-full after:bg-white after:shadow-[0_1px_3px_rgba(0,0,0,0.12)] after:transition-transform after:duration-[var(--lms-motion-fast)] after:ease-[var(--lms-motion-ease)] peer-checked:border-[var(--lms-primary)] peer-checked:bg-[var(--lms-primary)] peer-checked:after:translate-x-[22px] peer-aria-[invalid=true]:border-[var(--lms-error)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--lms-primary)] peer-aria-[invalid=true]:peer-focus-visible:outline-[var(--lms-error)] peer-disabled:opacity-50 motion-reduce:transition-none motion-reduce:after:transition-none" />
      <span className="min-w-0 break-words">{label}{props.required ? <span aria-hidden="true" className="ml-1 text-[var(--lms-error)]">*</span> : null}{props.required ? <span className="sr-only"> required</span> : null}</span>
    </label>
  );
}
