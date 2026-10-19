"use client";

import { useId, useState, type ComponentPropsWithRef, type ChangeEvent, type FocusEvent } from "react";
import { Input } from "./input";

export type SearchableSelectProps = Omit<ComponentPropsWithRef<"input">, "list" | "type"> & {
  options: ReadonlyArray<{ value: string; label?: string }>;
  creatable?: boolean;
  error?: boolean;
};

/**
 * Datalist maintains native keyboard/text entry and form support. When new
 * values are forbidden, native validity AND a visible error enforce selection.
 */
export function SearchableSelect({
  options, creatable = true, error = false, id, className, onChange, onBlur, ...props
}: SearchableSelectProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const listId = `${inputId}-options`;
  const validationId = `${inputId}-selection-error`;
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const describedBy = [props["aria-describedby"], selectionError ? validationId : null]
    .filter(Boolean).join(" ") || undefined;

  function change(event: ChangeEvent<HTMLInputElement>) {
    event.currentTarget.setCustomValidity("");
    setSelectionError(null);
    onChange?.(event);
  }
  function blur(event: FocusEvent<HTMLInputElement>) {
    const invalid = !creatable && event.currentTarget.value !== "" &&
      !options.some(option => option.value === event.currentTarget.value);
    const message = invalid ? "Choose a value from the available options." : null;
    event.currentTarget.setCustomValidity(message ?? "");
    setSelectionError(message);
    onBlur?.(event);
  }

  return <div data-slot="searchable-select" className="min-w-0">
    <Input {...props} id={inputId} type="text" list={listId} error={error || Boolean(selectionError)}
      aria-describedby={describedBy} aria-errormessage={selectionError ? validationId : undefined}
      className={className} aria-autocomplete="list" onChange={change} onBlur={blur} />
    <datalist id={listId}>
      {options.map(option => <option key={option.value} value={option.value} label={option.label ?? option.value} />)}
    </datalist>
    {selectionError ? <p id={validationId} role="alert" className="mt-1 text-[12px] leading-5 text-[var(--lms-error-text)]">{selectionError}</p> : null}
    {!creatable ? <span className="sr-only">Choose an existing option from the suggestions.</span> : null}
  </div>;
}
