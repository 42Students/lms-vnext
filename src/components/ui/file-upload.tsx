"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent, type ComponentPropsWithRef, type ReactNode } from "react";
import { cx } from "@/lib/class-names";
import { Input } from "./input";

export type FileUploadProps = Omit<ComponentPropsWithRef<"input">, "type" | "onChange"> & {
  label: string;
  maxBytes?: number;
  onFiles: (files: FileList | null) => void;
  helper?: string;
  /** Parent-owned external URL field or safe alternative for unsupported WebView pickers. */
  fallback?: ReactNode;
  pickerUnavailable?: boolean;
};

export function fileSizeIsValid(size: number, maxBytes?: number) {
  return Number.isFinite(size) && size >= 0 && (maxBytes === undefined || size <= maxBytes);
}
/** Client-side UX precheck only: the upload route MUST independently validate size, type and authority. */
export function fileMatchesAccept(file: Pick<File,"name"|"type">, accept?: string) {
  if (!accept?.trim()) return true;
  return accept.split(",").map(value=>value.trim().toLowerCase()).filter(Boolean).some(rule=>{
    if(rule.startsWith(".")) return file.name.toLowerCase().endsWith(rule);
    const type = file.type.toLowerCase();
    if(rule.endsWith("/*")) return type.startsWith(rule.slice(0,-1));
    return type === rule;
  });
}
export function mustClearFileSelection(selected: boolean, pickerUnavailable: boolean, disabled: boolean): boolean {
  return selected && (pickerUnavailable || disabled);
}

export function FileUpload({ label, maxBytes, onFiles, helper, fallback, pickerUnavailable = false,
  id: suppliedId, className, disabled, accept, ref: forwardedRef, ...props }: FileUploadProps) {
  const autoId = useId();
  const id = suppliedId ?? autoId;
  const [error, setError] = useState<string | null>(null);
  // Preserve every applicable assistive description when a picker is disabled
  // or rejects a file; an error must not make the size/type guidance vanish.
  const describedBy = [...new Set([
    ...(props["aria-describedby"]?.split(/\s+/).filter(Boolean) ?? []),
    helper ? `${id}-help` : null,
    error && !pickerUnavailable && !disabled ? `${id}-error` : null,
    (pickerUnavailable || disabled) ? `${id}-unavailable` : null,
  ].filter((value): value is string => Boolean(value)))].join(" ") || undefined;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const selectedRef = useRef(false);
  const onFilesRef = useRef(onFiles);
  useEffect(() => { onFilesRef.current = onFiles; }, [onFiles]);
  // Clearing after a picker is disabled is necessary even if the DOM input
  // unmounts: the form's parent must never retain a previously approved file.
  useEffect(() => {
    if (pickerUnavailable || disabled) setError(null);
    if (!mustClearFileSelection(selectedRef.current, pickerUnavailable, Boolean(disabled))) return;
    selectedRef.current = false;
    if (inputRef.current) inputRef.current.value = "";
    onFilesRef.current(null);
    // The unavailable/disabled alert is rendered by the component; no stale
    // file or DOM input value remains for a submit before re-enablement.
  }, [pickerUnavailable, disabled]);
  function bindInput(node: HTMLInputElement | null) {
    inputRef.current = node;
    if (typeof forwardedRef === "function") forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  }
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const files = event.currentTarget.files;
    const oversized = Array.from(files ?? []).some(file => !fileSizeIsValid(file.size, maxBytes));
    const wrongType = Array.from(files ?? []).some(file => !fileMatchesAccept(file,accept));
    if (oversized || wrongType) {
      setError(oversized ? "This file is larger than the allowed limit." : "This file type is not allowed.");
      selectedRef.current = false;
      onFiles(null);
      event.currentTarget.value = "";
      return;
    }
    selectedRef.current = Boolean(files?.length);
    setError(null);
    onFiles(files);
  }
  return <div className={cx("min-w-0 space-y-2", className)} data-slot="file-upload">
    <label htmlFor={id} className="block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">{label}</label>
    {pickerUnavailable ? <p role="status" className="text-[13px] leading-5 text-[var(--lms-body-text)]">File selection is unavailable in this app view. {fallback ? "Use the alternative below." : "Open this form in a browser that supports file selection."}</p> :
      <Input {...props} ref={bindInput} id={id} type="file" accept={accept} disabled={disabled} onChange={handleChange}
        aria-invalid={pickerUnavailable || disabled ? undefined : error ? true : props["aria-invalid"]}
        aria-describedby={describedBy}
        className="block min-h-9 w-full min-w-0 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-[var(--lms-form-bg)] px-3 py-2 text-[14px] text-foreground file:mr-3 file:rounded-[var(--lms-radius-control)] file:border-0 file:bg-[var(--lms-primary-subtle)] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[var(--lms-primary-text)] aria-invalid:border-[var(--lms-error)] aria-invalid:bg-[var(--lms-error-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] aria-invalid:focus-visible:outline-[var(--lms-error)] disabled:opacity-50 motion-reduce:transition-none" />}
    {helper ? <p id={`${id}-help`} className="text-[13px] leading-5 text-[var(--lms-body-text)]">{helper}</p> : null}
    {error ? <p id={`${id}-error`} role="alert" className="text-[12px] leading-5 text-[var(--lms-error-text)]">{error}</p> : null}
    {fallback ? <div className="min-w-0 space-y-2">{fallback}</div> : null}
    {(pickerUnavailable || disabled) ? <p id={`${id}-unavailable`} role="alert" className="text-[13px] leading-5 text-[var(--lms-body-text)]">This upload cannot continue with the file picker disabled. {fallback ? "Use the alternative provided." : "Enable file selection before continuing."}</p> : null}
  </div>;
}
