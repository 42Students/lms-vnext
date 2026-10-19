import type { ComponentPropsWithRef } from "react";
import { DateInput } from "./date-input";
import { cx } from "@/lib/class-names";
export type DateRangePickerProps = {
  start: string;
  end: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  startLabel?: string;
  endLabel?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
  error?: boolean;
  className?: string;
  required?: boolean;
  startInputProps?: Omit<ComponentPropsWithRef<"input">, "type" | "value" | "onChange">;
  endInputProps?: Omit<ComponentPropsWithRef<"input">, "type" | "value" | "onChange">;
};
/** Keep two editable dates instead of guessing a date-range popup format. */
export function DateRangePicker({start,end,onStartChange,onEndChange,startLabel="Start date",endLabel="End date",min,max,disabled,error=false,className,required,startInputProps,endInputProps}:DateRangePickerProps) {
  return <div data-slot="date-range-picker" className={cx("grid min-w-0 gap-3 sm:grid-cols-2",className)}>
    <label className="grid gap-1.5 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">{startLabel}
      <DateInput {...startInputProps} mode="date" value={start} min={min} max={end || max} disabled={disabled} required={required} error={error} onChange={event=>onStartChange(event.currentTarget.value)} />
    </label>
    <label className="grid gap-1.5 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">{endLabel}
      <DateInput {...endInputProps} mode="date" value={end} min={start || min} max={max} disabled={disabled} required={required} error={error} onChange={event=>onEndChange(event.currentTarget.value)} />
    </label>
  </div>;
}
