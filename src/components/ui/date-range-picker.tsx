"use client";

import { useId, type ComponentPropsWithRef } from "react";
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

/** True field associations even when a date field has an adjacent calendar button. */
export function DateRangePicker({
  start, end, onStartChange, onEndChange, startLabel = "Start date",
  endLabel = "End date", min, max, disabled, error = false, className,
  required, startInputProps, endInputProps,
}: DateRangePickerProps) {
  const generatedId = useId();
  const startId = startInputProps?.id ?? `${generatedId}-start`;
  const endId = endInputProps?.id ?? `${generatedId}-end`;
  const startRequired = required ?? startInputProps?.required;
  const endRequired = required ?? endInputProps?.required;
  const validBounds = (values: Array<string | undefined>) =>
    values.filter((date): date is string => Boolean(date)).sort();
  const startMin = validBounds([min, startInputProps?.min]).at(-1);
  const startMax = validBounds([end || undefined, max, startInputProps?.max])[0];
  const endMin = validBounds([start || undefined, min, endInputProps?.min]).at(-1);
  const endMax = validBounds([max, endInputProps?.max])[0];
  const invalidOrder = Boolean(start && end && start > end);
  const errorId = `${generatedId}-error`;
  const startDescribedBy = [startInputProps?.["aria-describedby"], invalidOrder ? errorId : null]
    .filter(Boolean).join(" ") || undefined;
  const endDescribedBy = [endInputProps?.["aria-describedby"], invalidOrder ? errorId : null]
    .filter(Boolean).join(" ") || undefined;

  return (
    <div data-slot="date-range-picker" role="group" aria-label={`${startLabel} to ${endLabel}`}
      className={cx("grid min-w-0 gap-3 min-[768px]:grid-cols-2", className)}>
      <div className="grid min-w-0 gap-1.5">
        <label htmlFor={startId} className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          {startLabel}{startRequired ? <span aria-hidden="true" className="ml-1 text-[var(--lms-error)]">*</span> : null}{startRequired ? <span className="sr-only"> required</span> : null}
        </label>
        <DateInput {...startInputProps} id={startId} mode="date" value={start} min={startMin}
          max={startMax} disabled={disabled ?? startInputProps?.disabled} required={startRequired}
          error={error || invalidOrder} aria-describedby={startDescribedBy}
          aria-errormessage={invalidOrder ? errorId : startInputProps?.["aria-errormessage"]}
          onChange={event => onStartChange(event.currentTarget.value)} />
      </div>
      <div className="grid min-w-0 gap-1.5">
        <label htmlFor={endId} className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          {endLabel}{endRequired ? <span aria-hidden="true" className="ml-1 text-[var(--lms-error)]">*</span> : null}{endRequired ? <span className="sr-only"> required</span> : null}
        </label>
        <DateInput {...endInputProps} id={endId} mode="date" value={end}
          min={endMin} max={endMax} disabled={disabled ?? endInputProps?.disabled} required={endRequired}
          error={error || invalidOrder} aria-describedby={endDescribedBy}
          aria-errormessage={invalidOrder ? errorId : endInputProps?.["aria-errormessage"]}
          onChange={event => onEndChange(event.currentTarget.value)} />
      </div>
      {invalidOrder
        ? <p id={errorId} role="alert" className="text-[12px] leading-5 text-[var(--lms-error-text)] min-[768px]:col-span-2">
            End date must be on or after start date.
          </p>
        : null}
    </div>
  );
}
