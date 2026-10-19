"use client";

import {
  useEffect, useId, useRef, useState,
  type ChangeEvent, type ComponentPropsWithRef, type FocusEvent, type KeyboardEvent,
} from "react";
import { Input } from "./input";
import { cx } from "@/lib/class-names";

export type SearchableSelectProps = Omit<ComponentPropsWithRef<"input">, "list" | "type"> & {
  options: ReadonlyArray<{ value: string; label?: string; disabled?: boolean }>;
  creatable?: boolean;
  error?: boolean;
  onValueChange?: (value: string) => void;
};

/**
 * Legacy Ant-style search options without a second native datalist popup.
 * The text input remains a real input for autofill, validation and forms.
 */
export function SearchableSelect({
  options, creatable = true, error = false, id, className, onChange, onBlur,
  onFocus, onKeyDown, onValueChange, value, defaultValue, disabled, readOnly,
  ref: forwardedRef, ...props
}: SearchableSelectProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const listId = `${inputId}-options`;
  const validationId = `${inputId}-selection-error`;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState(String(value ?? defaultValue ?? ""));
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const visibleQuery = value === undefined ? query : String(value);
  const normalized = visibleQuery.trim().toLocaleLowerCase();
  const matches = options.filter(option =>
    option.value.toLocaleLowerCase().includes(normalized) ||
    (option.label ?? option.value).toLocaleLowerCase().includes(normalized));
  const enabledIndices = matches.map((option, index) => option.disabled ? -1 : index).filter(index => index >= 0);
  const describedBy = [props["aria-describedby"], selectionError ? validationId : null]
    .filter(Boolean).join(" ") || undefined;

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function bindInput(node: HTMLInputElement | null) {
    inputRef.current = node;
    if (typeof forwardedRef === "function") forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  }
  function validate(text: string) {
    const invalid = !creatable && text !== "" && !options.some(option => option.value === text && !option.disabled);
    const message = invalid ? "Choose a value from the available options." : null;
    inputRef.current?.setCustomValidity(message ?? "");
    setSelectionError(message);
    return !invalid;
  }
  function select(valueToSet: string) {
    const element = inputRef.current;
    if (element) {
      // Native setter produces an input event that React's onChange can observe.
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      setter?.call(element, valueToSet);
      element.dispatchEvent(new Event("input", { bubbles: true }));
    }
    setQuery(valueToSet);
    setSelectionError(null);
    element?.setCustomValidity("");
    setOpen(false);
    setActiveIndex(-1);
    onValueChange?.(valueToSet);
    element?.focus();
  }
  function change(event: ChangeEvent<HTMLInputElement>) {
    setQuery(event.currentTarget.value);
    event.currentTarget.setCustomValidity("");
    setSelectionError(null);
    setOpen(true);
    setActiveIndex(-1);
    onChange?.(event);
  }
  function focus(event: FocusEvent<HTMLInputElement>) {
    if (!disabled && !readOnly) setOpen(true);
    onFocus?.(event);
  }
  function blur(event: FocusEvent<HTMLInputElement>) {
    if (!rootRef.current?.contains(event.relatedTarget)) {
      setOpen(false);
      validate(event.currentTarget.value);
    }
    onBlur?.(event);
  }
  function keyDown(event: KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented || disabled || readOnly) return;
    if (event.key === "Escape") { setOpen(false); setActiveIndex(-1); return; }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      if (!enabledIndices.length) return;
      const position = enabledIndices.indexOf(activeIndex);
      const next = event.key === "ArrowDown"
        ? enabledIndices[(position + 1) % enabledIndices.length]
        : enabledIndices[(position <= 0 ? enabledIndices.length : position) - 1];
      setActiveIndex(next);
    }
    if (event.key === "Enter" && open && activeIndex >= 0 && matches[activeIndex]) {
      event.preventDefault();
      select(matches[activeIndex].value);
    }
    if (event.key === "Tab") { setOpen(false); validate(event.currentTarget.value); }
  }

  return <div ref={rootRef} data-slot="searchable-select" className="relative min-w-0">
    <Input {...props} id={inputId} ref={bindInput} type="text"
      value={value} defaultValue={defaultValue} disabled={disabled} readOnly={readOnly}
      error={error || Boolean(selectionError)} aria-invalid={error || Boolean(selectionError) || props["aria-invalid"]}
      aria-describedby={describedBy} aria-errormessage={selectionError ? validationId : undefined}
      role="combobox" aria-autocomplete="list" aria-haspopup="listbox"
      aria-controls={listId} aria-expanded={open && !disabled && !readOnly}
      aria-activedescendant={open && activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined}
      className={className} onChange={change} onFocus={focus} onBlur={blur} onKeyDown={keyDown} />
    {open && !disabled && !readOnly
      ? <div id={listId} role="listbox" aria-label={props["aria-label"] ?? "Available options"}
          className="absolute left-0 top-[calc(100%_+_5px)] z-[var(--lms-z-dropdown)] max-h-[200px] min-h-[44px] w-full min-w-0 overflow-y-auto rounded-[12px] border border-[var(--lms-neutral-200)] bg-white pt-[5px] shadow-[var(--lms-search-dropdown-shadow)]">
          {matches.length
            ? matches.map((option, index) =>
              <button key={option.value} id={`${listId}-option-${index}`} type="button" role="option"
                aria-selected={index === activeIndex} disabled={option.disabled} tabIndex={-1}
                className={cx("flex min-h-11 w-full items-center px-[10px] py-[5px] text-left text-[14px] leading-5 text-[var(--lms-body-text)] transition-colors duration-200 hover:bg-[#d1f1f1] focus-visible:outline-2 focus-visible:outline-[var(--lms-primary)] disabled:cursor-not-allowed disabled:opacity-50", index === activeIndex ? "bg-[#d1f1f1]" : "")}
                onPointerDown={event => event.preventDefault()} onClick={() => select(option.value)}>
                {option.label ?? option.value}
              </button>)
            : <p role="status" className="px-[10px] py-[10px] text-center text-[13px] text-[var(--lms-muted-text)]">No results</p>}
        </div> : null}
    {selectionError
      ? <p id={validationId} role="alert" className="mt-1 text-[12px] leading-5 text-[var(--lms-error-text)]">{selectionError}</p>
      : null}
  </div>;
}
