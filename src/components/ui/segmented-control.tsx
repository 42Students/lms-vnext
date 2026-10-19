"use client";
import { useId, type ReactNode } from "react";
import { cx } from "@/lib/class-names";
export type SegmentedControlProps = {
  options: ReadonlyArray<{ value:string; label:ReactNode; disabled?:boolean }>;
  value: string;
  onChange: (next:string)=>void;
  label: string;
  name?: string;
  disabled?:boolean;
  className?:string;
};
/** Radio semantics preserve arrow-key navigation and form accessibility. */
export function SegmentedControl({options,value,onChange,label,name,disabled=false,className}:SegmentedControlProps) {
  const id=useId();
  return <fieldset data-slot="segmented-control" aria-label={label} disabled={disabled}
    className={cx("flex min-w-0 flex-wrap gap-1 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-[var(--lms-neutral-50)] p-1",className)}>
    <legend className="sr-only">{label}</legend>
    {options.map(option=><label key={option.value} className="relative inline-flex min-h-9 cursor-pointer items-center has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
      <input type="radio" name={name??id} value={option.value} checked={value===option.value} disabled={disabled||option.disabled}
        onChange={()=>onChange(option.value)} className="peer sr-only" />
      <span className="inline-flex min-h-9 items-center justify-center rounded-[var(--lms-control-radius)] px-3 text-[13px] font-semibold text-[var(--lms-body-text)] transition-colors duration-150 peer-checked:bg-[var(--lms-button-primary)] peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--lms-primary)]">{option.label}</span>
    </label>)}
  </fieldset>;
}
