"use client";

import {
  useEffect, useId, useRef, useState,
  type ComponentPropsWithRef, type KeyboardEvent,
} from "react";
import { Input } from "./input";
import { Button } from "./button";
import { PopoverPanel } from "./popover";
import { CalendarGrid } from "./calendar-grid";
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
function pad2(value: number) { return String(value).padStart(2, "0"); }
function isoWeek(date: Date): string {
  // ISO weeks begin on Monday and belong to the year containing Thursday.
  const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  utc.setUTCDate(utc.getUTCDate() + 4 - (utc.getUTCDay() || 7));
  const year = utc.getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const week = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${year}-W${pad2(week)}`;
}
function weekStart(raw: string): Date | null {
  const match = /^(\d{4})-W(\d{2})$/.exec(raw);
  if (!match) return null;
  const year = Number(match[1]);
  const week = Number(match[2]);
  if (year < 1 || week < 1 || week > 53) return null;
  const jan4 = new Date(year, 0, 4);
  const monday = new Date(year, 0, 4 - ((jan4.getDay() + 6) % 7) + (week - 1) * 7);
  return isoWeek(monday) === raw ? monday : null;
}
function initialMonth(raw: unknown): Date {
  if (typeof raw === "string") {
    const monday = weekStart(raw);
    if (monday) return new Date(monday.getFullYear(), monday.getMonth(), 1);
    if (/^\d{4}-\d{2}(?:-\d{2}(?:T\d{2}:\d{2}(?::\d{2})?)?)?$/.test(raw)) {
      const dateParts = raw.split("-");
      const year = Number(dateParts[0]);
      const month = Number(dateParts[1]);
      if (year >= 1 && month >= 1 && month <= 12) return new Date(year, month - 1, 1);
    }
  }
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), 1);
}
function minuteOf(raw: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(raw);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours < 24 && minutes < 60 ? hours * 60 + minutes : null;
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
  const [draftHour, setDraftHour] = useState(0);
  const [draftDate, setDraftDate] = useState(() => String(value ?? defaultValue ?? "").slice(0, 10));
  const [draftTime, setDraftTime] = useState(() => String(value ?? defaultValue ?? "").split("T")[1]?.slice(0, 5) || "00:00");
  const requestedStep = props.step === "any" ? NaN : Number(props.step ?? 60);
  // Second-level precision remains the browser's native picker; the legacy
  // time panel is minute-based, like components___antddesign.scss:204-211.
  const minuteStep = Number.isInteger(requestedStep) && requestedStep >= 60 && requestedStep % 60 === 0
    ? requestedStep / 60 : null;
  // A minute-only custom panel must not truncate values or bounds that use
  // native second precision; use the browser picker for those existing forms.
  const hasSecondPrecision = [value, defaultValue, props.min, props.max].some(raw =>
    typeof raw === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(raw));
  const hasPanel = mode === "date" || mode === "week" || mode === "month" || ((mode === "time" || (mode === "datetime-local" && !hasSecondPrecision)) && minuteStep !== null);
  const enabled = hasPanel && calendarPopup && !disabled && !readOnly;
  const selected = String(value ?? (inputRef.current?.value || defaultValue || ""));
  const today = localISO(new Date());
  const monthYear = `${monthNames[viewMonth.getMonth()]} ${viewMonth.getFullYear()}`;
  const minimumMinute = minuteOf(String(props.min ?? ""));
  const maximumMinute = minuteOf(String(props.max ?? ""));
  const stepBaseMinute = minimumMinute ?? 0;
  const dateTimeCandidate = `${draftDate}T${draftTime}`;
  const dateTimeMin = String(props.min ?? "");
  const dateTimeMax = String(props.max ?? "");
  function dateTimeMinuteNumber(raw: string): number | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(raw);
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const hour = Number(match[4]);
    const minute = Number(match[5]);
    if (month < 1 || month > 12 || hour > 23 || minute > 59) return null;
    const utc = Date.UTC(year, month - 1, day, hour, minute);
    const reconstructed = new Date(utc);
    if (reconstructed.getUTCMonth() !== month - 1 || reconstructed.getUTCDate() !== day) return null;
    return Number.isFinite(utc) ? utc / 60000 : null;
  }
  const candidateMinutes = dateTimeMinuteNumber(dateTimeCandidate);
  const stepBaseDateTime = dateTimeMinuteNumber(dateTimeMin) ?? dateTimeMinuteNumber(String(value ?? defaultValue ?? "")) ??
    dateTimeMinuteNumber("1970-01-01T00:00") ?? 0;
  const canApplyDateTime = mode === "datetime-local" && candidateMinutes !== null && minuteStep !== null &&
    (dateTimeMin === "" || dateTimeCandidate >= dateTimeMin) &&
    (dateTimeMax === "" || dateTimeCandidate <= dateTimeMax) &&
    (candidateMinutes - stepBaseDateTime) % minuteStep === 0;
  function timeAllowed(hour: number, minute: number) {
    const time = hour * 60 + minute;
    // Native time inputs allow a min-to-max interval that crosses midnight.
    const insideRange = minimumMinute !== null && maximumMinute !== null && minimumMinute > maximumMinute
      ? time >= minimumMinute || time <= maximumMinute
      : (minimumMinute === null || time >= minimumMinute) &&
        (maximumMinute === null || time <= maximumMinute);
    return minuteStep !== null && (time - stepBaseMinute) % minuteStep === 0 && insideRange;
  }

  function calendarStepAllowed(candidate: string): boolean {
    if (props.step === "any" || mode === "datetime-local") return true;
    const step = Number(props.step ?? 1);
    if (!Number.isInteger(step) || step <= 0) return true; // native constraint validation remains authoritative
    const base = String(props.min ?? value ?? defaultValue ?? "");
    if (mode === "month") {
      const monthNumber = (raw: string): number | null => {
        const match = /^(\d{4})-(\d{2})$/.exec(raw);
        return match ? Number(match[1]) * 12 + Number(match[2]) - 1 : null;
      };
      return ((monthNumber(candidate) ?? 0) - (monthNumber(base) ?? 1970 * 12)) % step === 0;
    }
    if (mode === "week") {
      const monday = weekStart(candidate);
      if (!monday) return false;
      const start = weekStart(base) ?? weekStart("1970-W01");
      if (!start) return false;
      const dayUTC = (date: Date) => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
      return ((dayUTC(monday) - dayUTC(start)) / 604800000) % step === 0;
    }
    if (mode === "date") {
      const dayNumber = (raw: string): number | null => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
        const parts = raw.split("-");
        return Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])) / 86400000;
      };
      return ((dayNumber(candidate) ?? 0) - (dayNumber(base) ?? 0)) % step === 0;
    }
    return true;
  }

  useEffect(() => {
    if (!open) return;
    function closeOutside(event: PointerEvent) {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);
  useEffect(() => {
    if (!enabled) setOpen(false);
  }, [enabled]);
  useEffect(() => {
    if (!open || !enabled) return;
    const panel = rootRef.current?.querySelector<HTMLElement>('[role="dialog"][data-slot^="legacy-"]');
    // Prefer the existing selection; otherwise focus a selectable day rather
    // than a noninteractive weekday header or disabled boundary.
    const target = panel?.querySelector<HTMLElement>(
      '[data-calendar-day][aria-pressed="true"]:not(:disabled), [data-calendar-day]:not(:disabled), [aria-pressed="true"]:not(:disabled), button:not(:disabled)',
    );
    target?.focus();
  }, [open, enabled]);

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
    if (!open) {
      const raw = String(inputRef.current?.value ?? value ?? defaultValue ?? "");
      setViewMonth(initialMonth(raw));
      setDraftHour(Math.floor((minuteOf(raw) ?? 0) / 60));
      setDraftDate(/^\d{4}-\d{2}-\d{2}/.test(raw) ? raw.slice(0, 10) : localISO(new Date()));
      setDraftTime(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(raw) ? raw.slice(11, 16) : "00:00");
    }
    setOpen(!open);
  }
  function monthDelta(delta: number) {
    setViewMonth(current => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  }
  function handleCalendarKey(event: KeyboardEvent<HTMLElement>) {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
    if (event.target instanceof Element && event.target.closest("input, select, textarea")) return;
    const selector = mode === "month" ? "[data-picker-month]:not(:disabled)" :
      mode === "time" ? "[data-picker-hour]:not(:disabled), [data-picker-minute]:not(:disabled)" :
      "[data-calendar-day]:not(:disabled)";
    const choices = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>(selector));
    const index = choices.indexOf(document.activeElement as HTMLButtonElement);
    if (index < 0 || choices.length === 0) return;
    const columns = mode === "month" ? 3 : mode === "time" ? 1 : 7;
    let next = event.key === "Home" ? 0 : event.key === "End" ? choices.length - 1 :
      event.key === "ArrowUp" ? index - columns : event.key === "ArrowDown" ? index + columns :
      event.key === "ArrowLeft" ? index - 1 : index + 1;
    if (mode === "time" && event.key === "ArrowRight" && choices[index]?.dataset.pickerHour !== undefined) {
      const minuteIndex = choices.findIndex(item => item.dataset.pickerMinute !== undefined);
      if (minuteIndex >= 0) next = minuteIndex;
    }
    if (mode === "time" && event.key === "ArrowLeft" && choices[index]?.dataset.pickerMinute !== undefined) {
      const hourIndex = choices.findIndex(item => item.dataset.pickerHour !== undefined);
      if (hourIndex >= 0) next = hourIndex;
    }
    event.preventDefault();
    choices[Math.max(0, Math.min(choices.length - 1, next))]?.focus();
  }

  const first = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const weekMode = mode === "week";
  const offset = weekMode ? (first.getDay() + 6) % 7 : first.getDay();
  const weekdayLabels = weekMode ? [...weekdays.slice(1), weekdays[0]] : weekdays;
  const days = Array.from({ length: 42 }, (_, index) =>
    new Date(viewMonth.getFullYear(), viewMonth.getMonth(), index + 1 - offset));
  const native = <Input {...props} id={inputId} ref={bindRef} type={mode}
    value={value} defaultValue={defaultValue} disabled={disabled} readOnly={readOnly}
    aria-readonly={readOnly || undefined} error={error}
    className={cx(enabled ? "pr-12 [&::-webkit-calendar-picker-indicator]:opacity-0" : "", className)}
    onChange={onChange} onKeyDown={onKeyDown} />;

  if (!hasPanel || !calendarPopup) return native;

  return (
    <div ref={rootRef} data-slot="date-field" className="relative min-w-0"
      onBlur={event => {
        if (open && !event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={event => {
        if (event.defaultPrevented || event.key !== "Escape" || !open) return;
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
        inputRef.current?.focus();
      }}>
      {native}
      <Button type="button" variant="ghost" size="icon-sm"
        aria-label={mode === "time" ? "Open time picker" : mode === "datetime-local" ? "Open date and time picker" : mode === "month" ? "Open month picker" : mode === "week" ? "Open week picker" : "Open date calendar"}
        aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? popupId : undefined}
        disabled={!enabled} onClick={toggle}
        className="absolute right-1 top-0 !h-9 !w-9 !min-w-9 !rounded-[9px] !border-0 !p-0 max-[767px]:!h-11 max-[767px]:!w-11">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M7 3v4M17 3v4M3 10h18" />
        </svg>
      </Button>
      {open && enabled
        ? <PopoverPanel id={popupId} label={mode === "time" ? "Choose time" : mode === "datetime-local" ? "Choose date and time" : mode === "month" ? "Choose month" : mode === "week" ? "Choose week" : "Choose date"}
            onDismiss={() => { setOpen(false); inputRef.current?.focus(); }}
            onKeyDown={handleCalendarKey}
            data-slot={mode === "time" ? "legacy-time-picker" : mode === "datetime-local" ? "legacy-datetime-picker" : mode === "month" ? "legacy-month-picker" : mode === "week" ? "legacy-week-picker" : "legacy-date-calendar"}
            className="absolute right-0 top-[calc(100%_+_5px)] z-50 w-[min(19rem,calc(100vw_-_2rem))] max-[767px]:w-[min(22rem,calc(100vw_-_2rem))] !rounded-[12px] border border-[var(--lms-neutral-200)] bg-white p-3 !shadow-[var(--lms-search-dropdown-shadow)]">
            {mode !== "time"
              ? <div className="mb-3 flex items-center justify-between gap-2">
                  <Button type="button" variant="ghost" size="icon-sm"
                    aria-label={mode === "month" ? "Previous year" : "Previous month"}
                    onClick={() => monthDelta(mode === "month" ? -12 : -1)}>‹</Button>
                  <span aria-live="polite" className="text-[14px] font-semibold text-[var(--lms-neutral-900)]">
                    {mode === "month" ? viewMonth.getFullYear() : monthYear}
                  </span>
                  <Button type="button" variant="ghost" size="icon-sm"
                    aria-label={mode === "month" ? "Next year" : "Next month"}
                    onClick={() => monthDelta(mode === "month" ? 12 : 1)}>›</Button>
                </div> : null}
            {mode === "time"
              ? <div className="grid grid-cols-2 gap-2" role="group" aria-label="Hours and minutes">
                  <div aria-label="Hour" className="max-h-56 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {Array.from({ length: 24 }, (_, hour) => {
                      const available = Array.from({ length: 60 }, (_, minute) => timeAllowed(hour, minute)).some(Boolean);
                      return <Button key={hour} data-picker-hour={hour} variant="ghost" type="button" size="sm" disabled={!available}
                        aria-pressed={draftHour === hour} onClick={() => setDraftHour(hour)}
                        className={cx("mb-1 !w-full !justify-center !rounded-[6px] !border-0 max-[767px]:!min-h-11",
                          draftHour === hour ? "!bg-[var(--lms-primary)] !text-white" : "hover:!bg-[var(--lms-primary-subtle)]")}>
                        {pad2(hour)}
                      </Button>;
                    })}
                  </div>
                  <div aria-label="Minute" className="max-h-56 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {Array.from({ length: 60 }, (_, minute) => (
                      <Button key={minute} data-picker-minute={minute} variant="ghost" type="button" size="sm"
                        disabled={!timeAllowed(draftHour, minute)}
                        aria-pressed={selected === `${pad2(draftHour)}:${pad2(minute)}`}
                        onClick={() => choose(`${pad2(draftHour)}:${pad2(minute)}`)}
                        className={cx("mb-1 !w-full !justify-center !rounded-[6px] !border-0 max-[767px]:!min-h-11",
                          selected === `${pad2(draftHour)}:${pad2(minute)}`
                            ? "!bg-[var(--lms-primary)] !text-white" : "hover:!bg-[var(--lms-primary-subtle)]")}>
                        {pad2(minute)}
                      </Button>
                    ))}
                  </div>
                </div>
              : mode === "month"
                ? <div className="grid grid-cols-3 gap-2" role="group" aria-label={String(viewMonth.getFullYear())}>
                    {monthNames.map((month, index) => {
                      const monthValue = `${viewMonth.getFullYear()}-${pad2(index + 1)}`;
                      const limited = (props.min != null && monthValue < String(props.min)) ||
                        (props.max != null && monthValue > String(props.max)) ||
                        !calendarStepAllowed(monthValue);
                      return <Button key={month} data-picker-month={index} type="button" variant="ghost" size="sm" disabled={Boolean(limited)}
                        aria-pressed={selected === monthValue} onClick={() => choose(monthValue)}
                        className={cx("!rounded-[6px] !border-0 !px-1 max-[767px]:!min-h-11",
                          selected === monthValue ? "!bg-[var(--lms-primary)] !text-white" : "hover:!bg-[var(--lms-primary-subtle)]")}>
                        {month.slice(0, 3)}
                      </Button>;
                    })}
                  </div>
                : <CalendarGrid variant="spaced" role="group" aria-label={monthYear} className="overflow-x-auto overscroll-x-contain text-center max-[767px]:[grid-template-columns:repeat(7,minmax(44px,1fr))]">
              {weekdayLabels.map(day => <span key={day} aria-hidden="true"
                className={cx("py-1 text-[12px] font-semibold",
                  day === "Su" ? "text-[var(--lms-calendar-sunday)]" : "text-[var(--lms-muted-text)]")}>
                {day}
              </span>)}
              {days.map(day => {
                const iso = localISO(day);
                const candidate = weekMode ? isoWeek(day) : iso;
                const outsideMonth = day.getMonth() !== viewMonth.getMonth();
                const minValue = mode === "datetime-local" ? dateTimeMin.slice(0, 10) : String(props.min ?? "");
                const maxValue = mode === "datetime-local" ? dateTimeMax.slice(0, 10) : String(props.max ?? "");
                const limited = Boolean((minValue && candidate < minValue) || (maxValue && candidate > maxValue)) || !calendarStepAllowed(candidate);
                return <Button key={iso} type="button" variant="ghost" size="icon-sm"
                  data-calendar-day={iso} aria-label={`${day.toLocaleDateString(undefined, { dateStyle: "full" })}${weekMode ? `, ${candidate}` : ""}`}
                  aria-current={iso === today ? "date" : undefined} aria-pressed={mode === "datetime-local" ? draftDate === candidate : selected === candidate}
                  disabled={Boolean(limited)}
                  onClick={() => { if (mode === "datetime-local") setDraftDate(candidate); else choose(candidate); }}
                  className={cx("!min-h-9 !h-9 !w-full !min-w-0 !rounded-[6px] !border-0 !p-0 !text-[13px] max-[767px]:!min-h-11 max-[767px]:!h-11",
                    outsideMonth ? "!text-[var(--lms-neutral-400)]" : "",
                    (mode === "datetime-local" ? draftDate === candidate : selected === candidate) ? "!bg-[var(--lms-primary)] !text-white" :
                    iso === today ? "!text-[var(--lms-primary-text)] !underline" :
                    !outsideMonth && day.getDay() === 0
                      ? "!text-[var(--lms-calendar-sunday)] hover:!bg-[var(--lms-primary-subtle)]"
                      : "hover:!bg-[var(--lms-primary-subtle)]")}>
                  {day.getDate()}
                </Button>;
              })}
            </CalendarGrid>}
            {mode === "datetime-local"
              ? <div className="mt-3 flex min-w-0 flex-wrap items-end gap-2 border-t border-[var(--lms-neutral-200)] pt-3">
                  <label className="grid min-w-0 flex-1 gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
                    Time
                    <Input type="time" step={Number(props.step ?? 60)} value={draftTime}
                      min={dateTimeMin.slice(0, 10) === draftDate ? dateTimeMin.slice(11, 16) : undefined}
                      max={dateTimeMax.slice(0, 10) === draftDate ? dateTimeMax.slice(11, 16) : undefined}
                      onChange={event => setDraftTime(event.currentTarget.value)}
                      className="max-[767px]:min-h-11" />
                  </label>
                  <Button type="button" variant="primary" size="sm"
                    disabled={!canApplyDateTime} onClick={() => choose(dateTimeCandidate)}
                    className="max-[767px]:min-h-11">Apply</Button>
                </div> : null}
          </PopoverPanel> : null}
    </div>
  );
}
