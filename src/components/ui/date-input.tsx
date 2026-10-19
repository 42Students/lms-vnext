"use client";

import {
  useEffect, useId, useRef, useState,
  type ComponentPropsWithRef, type KeyboardEvent,
} from "react";
import { Input } from "./input";
import { Button } from "./button";
import { PopoverPanel } from "./popover";
import { cx } from "@/lib/class-names";

export type DateInputProps = Omit<ComponentPropsWithRef<"input">, "type"> & {
  mode?: "date" | "time" | "datetime-local" | "month" | "week";
  error?: boolean;
  /** Disable the legacy month-grid only when another date UI owns this input. */
  calendarPopup?: boolean;
};

const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;
const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

function localISO(date: Date): string {
  const y = date.getFullYear();
  return `${y}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function initialMonth(raw: unknown): Date {
  if (typeof raw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [year, month] = raw.split("-").map(Number);
    if (year >= 1 && month >= 1 && month <= 12) return new Date(year, month - 1, 1);
  }
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), 1);
}

/**
 * Real date input for forms and native validation, plus a legacy-themed calendar.
 * Selection dispatches a normal bubbling input/change event so existing onChange
 * callers remain the source of truth; no synthetic shape-casts are required.
 */
export function DateInput({
  mode = "date", error = false, calendarPopup = true,
  className, disabled, readOnly, value, defaultValue, id, ref: forwardedRef,
  onChange, onKeyDown, ...props
}: DateInputProps) {
  const uid = useId();
  const inputId = id ?? uid;
  const popupId = `${inputId}-legacy-calendar`;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => initialMonth(value ?? defaultValue));
  const enabled = mode === "date" && calendarPopup && !disabled && !readOnly;
  const selected = String(value ?? (inputRef.current?.value || defaultValue || ""));
  const today = localISO(new Date());
  const monthYear = `${monthNames[viewMonth.getMonth()]} ${viewMonth.getFullYear()}`;

  useEffect(() => {
    if (!open) return;
    function closeOutside(event: PointerEvent) {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);
  useEffect(() => {
    if (disabled || readOnly || !calendarPopup || mode !== "date") setOpen(false);
  }, [disabled, readOnly, calendarPopup, mode]);

  function bindRef(node: HTMLInputElement | null) {
    inputRef.current = node;
    if (typeof forwardedRef === "function") forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  }
  function choose(next: string) {
    const input = inputRef.current;
    if (input) {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      setter?.call(input, next);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
    setOpen(false);
    input?.focus();
  }
  function toggle() {
    if (!enabled) return;
    if (!open) setViewMonth(initialMonth(inputRef.current?.value ?? value ?? defaultValue));
    setOpen(!open);
  }
  function monthDelta(delta: number) {
    setViewMonth(current => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  }
  function handleCalendarKey(event: KeyboardEvent<HTMLElement>) {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    const days = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[data-calendar-day]:not(:disabled)'));
    const index = days.indexOf(document.activeElement as HTMLButtonElement);
    if (index < 0 || days.length === 0) return;
    const movement = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 :
      event.key === "ArrowUp" ? -7 : 7;
    event.preventDefault();
    days[Math.max(0, Math.min(days.length - 1, index + movement))]?.focus();
  }

  const first = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const days = Array.from({ length: 42 }, (_, index) =>
    new Date(viewMonth.getFullYear(), viewMonth.getMonth(), index + 1 - first.getDay()));
  const native = <Input {...props} id={inputId} ref={bindRef} type={mode}
    value={value} defaultValue={defaultValue} disabled={disabled} readOnly={readOnly}
    aria-readonly={readOnly || undefined} error={error}
    className={cx(enabled ? "pr-12" : "", className)}
    onChange={onChange} onKeyDown={onKeyDown} />;

  if (mode !== "date" || !calendarPopup) return native;

  return (
    <div ref={rootRef} data-slot="date-field" className="relative min-w-0">
      {native}
      <Button type="button" variant="ghost" size="icon-sm"
        aria-label="Open date calendar" aria-expanded={open} aria-controls={open ? popupId : undefined}
        disabled={!enabled} onClick={toggle}
        className="absolute right-1 top-0 !h-9 !w-9 !min-w-9 !rounded-[9px] !border-0 !p-0 max-[767px]:!h-11 max-[767px]:!w-11">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M7 3v4M17 3v4M3 10h18" />
        </svg>
      </Button>
      {open && enabled
        ? <PopoverPanel id={popupId} label="Choose date" onDismiss={() => { setOpen(false); inputRef.current?.focus(); }}
            onKeyDown={handleCalendarKey}
            data-slot="legacy-date-calendar"
            className="absolute right-0 top-[calc(100%_+_5px)] z-50 w-[min(19rem,calc(100vw_-_2rem))] !rounded-[12px] border border-[var(--lms-neutral-200)] bg-white p-3 !shadow-[var(--lms-search-dropdown-shadow)]">
            <div className="mb-3 flex items-center justify-between gap-2">
              <Button type="button" variant="ghost" size="icon-sm"
                aria-label="Previous month" onClick={() => monthDelta(-1)}>‹</Button>
              <span aria-live="polite" className="text-[14px] font-semibold text-[var(--lms-neutral-900)]">{monthYear}</span>
              <Button type="button" variant="ghost" size="icon-sm"
                aria-label="Next month" onClick={() => monthDelta(1)}>›</Button>
            </div>
            <div role="group" aria-label={monthYear} className="grid grid-cols-7 gap-1 text-center">
              {weekdays.map(day => <span key={day} aria-hidden="true" className="py-1 text-[12px] font-semibold text-[var(--lms-muted-text)]">{day}</span>)}
              {days.map((day, index) => {
                const iso = localISO(day);
                const outsideMonth = day.getMonth() !== viewMonth.getMonth();
                const limited = (props.min && iso < props.min) || (props.max && iso > props.max);
                return <Button key={iso} type="button" variant="ghost" size="icon-sm"
                  data-calendar-day={iso} aria-label={day.toLocaleDateString(undefined, { dateStyle: "full" })}
                  aria-current={iso === today ? "date" : undefined} aria-pressed={selected === iso}
                  disabled={Boolean(limited)}
                  onClick={() => choose(iso)}
                  className={cx("!min-h-9 !h-9 !w-full !min-w-0 !rounded-[6px] !border-0 !p-0 !text-[13px]",
                    outsideMonth ? "!text-[var(--lms-neutral-400)]" : "",
                    selected === iso ? "!bg-[var(--lms-primary)] !text-white" :
                    iso === today ? "!text-[var(--lms-primary-text)] !underline" : "hover:!bg-[var(--lms-primary-subtle)]",
                    index === 0 ? "" : "")}>
                  {day.getDate()}
                </Button>;
              })}
            </div>
          </PopoverPanel> : null}
    </div>
  );
}
