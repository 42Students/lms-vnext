"use client";

import { useRef, useState, type ChangeEvent, type ComponentPropsWithRef, type ReactNode } from "react";
import { Select } from "./select";
import { Button } from "./button";
import { cx } from "@/lib/class-names";

export type MultiSelectProps = Omit<ComponentPropsWithRef<"select">, "multiple" | "children"> & {
  options: ReadonlyArray<{ value: string; label: ReactNode; disabled?: boolean }>;
  visibleRows?: number;
  error?: boolean;
  showSelectedTags?: boolean;
  onValuesChange?: (values: string[]) => void;
};

function valuesOf(value: string | number | readonly string[] | undefined): string[] {
  if (Array.isArray(value)) return value.map(String);
  return value === undefined ? [] : [String(value)];
}

/** Native multi-select retains Ctrl/Shift/keyboard semantics and form submission. */
export function MultiSelect({
  options, visibleRows = 4, error = false, showSelectedTags = false,
  onValuesChange, onChange, className, value, defaultValue, disabled,
  ref: forwardedRef, ...props
}: MultiSelectProps) {
  const selectRef = useRef<HTMLSelectElement | null>(null);
  const [internal, setInternal] = useState(() => valuesOf(defaultValue));
  const selected = value === undefined ? internal : valuesOf(value);
  function bindRef(node: HTMLSelectElement | null) {
    selectRef.current = node;
    if (typeof forwardedRef === "function") forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  }
  function change(event: ChangeEvent<HTMLSelectElement>) {
    const next = Array.from(event.currentTarget.selectedOptions, item => item.value);
    setInternal(next);
    onValuesChange?.(next);
    onChange?.(event);
  }
  function remove(valueToRemove: string) {
    if (disabled) return;
    const next = selected.filter(item => item !== valueToRemove);
    setInternal(next);
    const field = selectRef.current;
    if (field) {
      Array.from(field.options).forEach(option => { option.selected = next.includes(option.value); });
      field.dispatchEvent(new Event("change", { bubbles: true }));
    }
    onValuesChange?.(next);
  }
  return <div data-slot="multi-select-field" className={cx("min-w-0", className)}>
    <Select {...props} ref={bindRef} multiple disabled={disabled} value={value} defaultValue={defaultValue}
      size={Math.max(2, Math.min(10, Math.trunc(visibleRows) || 4))} error={error}
      data-slot="multi-select" onChange={change}>
      {options.map(option => <option key={option.value} value={option.value} disabled={option.disabled}>
        {typeof option.label === "string" || typeof option.label === "number" ? option.label : option.value}
      </option>)}
    </Select>
    {showSelectedTags && selected.length > 0
      ? <div aria-label="Selected values" className="mt-2 flex flex-wrap gap-2">
          {selected.map(item => {
            const label = options.find(option => option.value === item)?.label ?? item;
            return <span key={item} className="inline-flex min-h-9 items-center gap-1 rounded-full border border-[var(--lms-neutral-200)] bg-[var(--lms-primary-subtle)] px-2 text-[13px] leading-5 text-[var(--lms-body-text)]">
              {label}
              <Button type="button" variant="ghost" size="icon-sm" disabled={disabled}
                aria-label={`Remove ${item}`} onClick={() => remove(item)}
                className="!h-9 !w-9 !min-w-9 !rounded-full !p-0 max-[767px]:!min-h-11 max-[767px]:!min-w-11">×</Button>
            </span>;
          })}
        </div> : null}
  </div>;
}
