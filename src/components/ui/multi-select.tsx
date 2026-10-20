"use client";

import { useId, useRef, useState, type ChangeEvent, type ComponentPropsWithRef, type KeyboardEvent, type ReactNode } from "react";
import { Select } from "./select";
import { Button } from "./button";
import { cx } from "@/lib/class-names";

export type MultiSelectProps = Omit<ComponentPropsWithRef<"select">, "multiple" | "children"> & {
  options: ReadonlyArray<{ value: string; label: ReactNode; disabled?: boolean }>;
  visibleRows?: number;
  error?: boolean;
  showSelectedTags?: boolean;
  readOnly?: boolean;
  onValuesChange?: (values: string[]) => void;
};

function valuesOf(value: string | number | readonly string[] | undefined): string[] {
  if (Array.isArray(value)) return value.map(String);
  return value === undefined ? [] : [String(value)];
}

/**
 * Legacy AntD option colour: components___antddesign.scss:134-140
 * (#26bac7 checked, white lettering, wrapped labels).
 * Native multiple selection is retained for keyboard Ctrl/Shift and form data.
 * Optional tags provide a separately labeled, mobile-friendly selection list.
 */
export function MultiSelect({
  options, visibleRows = 4, error = false, showSelectedTags = false, readOnly = false,
  onValuesChange, onChange, onKeyDown, className, value, defaultValue, disabled,
  ref: forwardedRef, ...props
}: MultiSelectProps) {
  const tagsId = useId();
  const selectRef = useRef<HTMLSelectElement | null>(null);
  const dispatchFromTag = useRef(false);
  const [uncontrolledValues, setUncontrolledValues] = useState<string[]>(() => valuesOf(defaultValue));
  const selected = value === undefined ? uncontrolledValues : valuesOf(value);
  const describedBy = [...new Set([
    ...(props["aria-describedby"]?.split(/\s+/).filter(Boolean) ?? []),
    showSelectedTags && selected.length > 0 ? tagsId : null,
  ].filter((token): token is string => Boolean(token)))].join(" ") || undefined;
  const rows = Number.isFinite(visibleRows) ? Math.max(2, Math.min(10, Math.trunc(visibleRows))) : 4;

  function bindRef(node: HTMLSelectElement | null) {
    selectRef.current = node;
    if (typeof forwardedRef === "function") forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  }
  function change(event: ChangeEvent<HTMLSelectElement>) {
    if (readOnly) {
      for (const option of Array.from(event.currentTarget.options)) option.selected = selected.includes(option.value);
      return;
    }
    const next = Array.from(event.currentTarget.selectedOptions, option => option.value);
    setUncontrolledValues(next);
    // Tag removals report onValuesChange explicitly; do not emit it twice when
    // the bubbling native change is also observed by React.
    if (!dispatchFromTag.current) onValuesChange?.(next);
    onChange?.(event);
  }
  function remove(valueToRemove: string) {
    if (disabled || readOnly || options.find(option => option.value === valueToRemove)?.disabled) return;
    const next = selected.filter(item => item !== valueToRemove);
    const field = selectRef.current;
    setUncontrolledValues(next);
    onValuesChange?.(next);
    if (field) {
      for (const option of Array.from(field.options)) option.selected = next.includes(option.value);
      // Keep the preexisting onChange contract as well as onValuesChange.
      dispatchFromTag.current = true;
      try { field.dispatchEvent(new Event("change", { bubbles: true })); }
      finally { dispatchFromTag.current = false; }
      field.focus();
    }
  }

  function keyDown(event: KeyboardEvent<HTMLSelectElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented || !readOnly) return;
    if ([" ", "ArrowDown", "ArrowUp", "Home", "End", "PageUp", "PageDown"].includes(event.key)) {
      event.preventDefault();
    }
  }
  return (
    <div data-slot="multi-select-field" className={cx("min-w-0", className)}>
      <Select {...props} ref={bindRef} multiple disabled={disabled} aria-readonly={readOnly || undefined} aria-describedby={describedBy}
        value={value} defaultValue={defaultValue} size={rows} error={error}
        data-slot="multi-select" onChange={change} onKeyDown={keyDown}>
        {options.map(option => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {typeof option.label === "string" || typeof option.label === "number" ? option.label : option.value}
          </option>
        ))}
      </Select>
      {showSelectedTags && selected.length > 0
        ? <ul id={tagsId} aria-label="Selected values" className="mt-2 flex min-w-0 flex-wrap gap-2">
            {selected.map(item => {
              const option = options.find(candidate => candidate.value === item);
              const canRemove = !disabled && !readOnly && !option?.disabled;
              const displayLabel = typeof option?.label === "string" || typeof option?.label === "number"
                ? String(option.label) : item;
              return (
                <li key={item} className="inline-flex min-h-9 max-w-full items-center gap-1 rounded-[6px] border border-[var(--lms-neutral-200)] bg-[var(--lms-primary-subtle)] pl-2 text-[13px] leading-5 text-[var(--lms-body-text)] max-[767px]:min-h-11">
                  <span className="min-w-0 break-words">
                    {option?.label ?? item}
                  </span>
                  <Button type="button" variant="ghost" size="icon-sm"
                    disabled={!canRemove} aria-label={`Remove ${displayLabel}`}
                    onClick={() => remove(item)}
                    className="!h-9 !w-9 !min-w-9 !rounded-[6px] !p-0 max-[767px]:!h-11 max-[767px]:!w-11 max-[767px]:!min-w-11">
                    <span aria-hidden="true">×</span>
                  </Button>
                </li>
              );
            })}
          </ul> : null}
    </div>
  );
}
