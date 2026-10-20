"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent, type ComponentPropsWithRef, type ReactNode } from "react";
import { cx } from "@/lib/class-names";
import { Input } from "./input";
import { Button } from "./button";

export type FileUploadProps = Omit<ComponentPropsWithRef<"input">, "type" | "onChange"> & {
  label: string;
  maxBytes?: number;
  onFiles: (files: FileList | null) => void;
  helper?: string;
  /** Parent-owned external URL field or safe alternative for unsupported WebView pickers. */
  fallback?: ReactNode;
  pickerUnavailable?: boolean;
  /** Actual completed upload percentage, supplied by the caller when known. */
  progress?: number;
  /** Opt in to a compact selection list; does not alter the upload request. */
  showSelectedFiles?: boolean;
  /** Preview the first selected image locally; never uploads or stores image bytes. */
  showImagePreview?: boolean;
  /** Legacy profile frame uses 175 x 194px cover; attachments remain contained. */
  imagePreviewKind?: "attachment" | "profile";
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
  progress, showSelectedFiles = false, showImagePreview = false, imagePreviewKind = "attachment",
  id: suppliedId, className, disabled, accept, ref: forwardedRef, ...props }: FileUploadProps) {
  const autoId = useId();
  const id = suppliedId ?? autoId;
  const [error, setError] = useState<string | null>(null);
  const [selectedNames, setSelectedNames] = useState<string[]>([]);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const required = Boolean(props.required);
  useEffect(() => {
    if (!showImagePreview || !previewFile || !previewFile.type.startsWith("image/")) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(previewFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [previewFile, showImagePreview]);
  const percentage = typeof progress === "number" && Number.isFinite(progress) ? Math.max(0, Math.min(100, progress)) : null;
  const unavailable = pickerUnavailable || Boolean(disabled);
  // Preserve every applicable assistive description when a picker is disabled
  // or rejects a file; an error must not make the size/type guidance vanish.
  const describedBy = [...new Set([
    ...(props["aria-describedby"]?.split(/\s+/).filter(Boolean) ?? []),
    helper ? `${id}-help` : null,
    error && !unavailable ? `${id}-error` : null,
    unavailable ? `${id}-unavailable` : null,
  ].filter((value): value is string => Boolean(value)))].join(" ") || undefined;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const selectedRef = useRef(false);
  const onFilesRef = useRef(onFiles);
  useEffect(() => { onFilesRef.current = onFiles; }, [onFiles]);
  // Clearing after a picker is disabled is necessary even if the DOM input
  // unmounts: the form's parent must never retain a previously approved file.
  useEffect(() => {
    if (pickerUnavailable || disabled) { setError(null); setSelectedNames([]); setPreviewFile(null); setPreviewUrl(null); }
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
      setSelectedNames([]);
      setPreviewFile(null);
      setPreviewUrl(null);
      onFiles(null);
      event.currentTarget.value = "";
      return;
    }
    selectedRef.current = Boolean(files?.length);
    setSelectedNames(Array.from(files ?? [], file => file.name));
    setPreviewFile(files?.[0] ?? null);
    setPreviewUrl(null);
    setError(null);
    onFiles(files);
  }
  function clearSelection() {
    if (disabled || pickerUnavailable) return;
    if (inputRef.current) inputRef.current.value = "";
    selectedRef.current = false;
    setSelectedNames([]);
    setPreviewFile(null);
    setPreviewUrl(null);
    setError(null);
    onFiles(null);
    inputRef.current?.focus();
  }
  return <div className={cx("min-w-0 space-y-2", className)} data-slot="file-upload">
    <label htmlFor={id} className="block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
      {label}{required ? <span aria-hidden="true" className="ml-1 text-[var(--lms-error)]">*</span> : null}
      {required ? <span className="sr-only"> required</span> : null}
    </label>
    {pickerUnavailable ? <p id={`${id}-unavailable`} role="status" className="text-[13px] leading-5 text-[var(--lms-body-text)]">File selection is unavailable in this app view. {fallback ? "Use the alternative below." : "Open this form in a browser that supports file selection."}</p> :
      <Input {...props} ref={bindInput} id={id} type="file" accept={accept} disabled={disabled} onChange={handleChange}
        aria-invalid={unavailable ? undefined : error ? true : props["aria-invalid"]}
        aria-describedby={describedBy}
        aria-errormessage={error && !unavailable ? `${id}-error` : props["aria-errormessage"]}
        aria-required={required || undefined}
        className="block min-h-9 max-[767px]:min-h-11 w-full min-w-0 rounded-[var(--lms-field-radius)] border border-[var(--lms-canvas-border)] bg-[var(--lms-form-bg)] px-3 py-2 text-[14px] text-[var(--lms-form-ink)] file:mr-3 file:rounded-[var(--lms-radius-control)] file:border-0 file:bg-[var(--lms-primary-subtle)] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[var(--lms-primary-text)] aria-invalid:border-[var(--lms-error)] aria-invalid:bg-[var(--lms-error-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] aria-invalid:focus-visible:outline-[var(--lms-error)] disabled:opacity-50 motion-reduce:transition-none" />}
    {helper ? <p id={`${id}-help`} className="text-[13px] leading-5 text-[var(--lms-body-text)]">{helper}</p> : null}
    {showSelectedFiles && selectedNames.length > 0 && !pickerUnavailable && !disabled
      ? <ul aria-label="Selected files" className="space-y-1 text-[13px] leading-5 text-[var(--lms-body-text)]">
          {selectedNames.map((name, index) => <li key={`${index}-${name}`} className="min-w-0 break-all">{name}</li>)}
        </ul> : null}
    {showSelectedFiles && selectedNames.length > 0 && !unavailable
      ? <Button type="button" variant="ghost" size="sm" onClick={clearSelection}
          className="!min-h-9 !px-2 max-[767px]:!min-h-11" aria-label="Remove selected files">
          Remove selected files
        </Button> : null}
    {showImagePreview && previewFile && previewUrl && !pickerUnavailable && !disabled
      ? <div data-slot="image-upload-preview" data-preview-kind={imagePreviewKind}
          className={cx("border border-[var(--lms-neutral-200)] bg-[var(--lms-neutral-50)]",
            imagePreviewKind === "profile"
              ? "h-[194px] w-[175px] max-w-full overflow-hidden rounded-[8px]"
              : "rounded-[10px] p-2")}>
          <img src={previewUrl} alt={`${label} preview`}
            className={imagePreviewKind === "profile" ? "h-full w-full object-cover object-center" : "max-h-40 max-w-full rounded-[6px] object-contain"} />
        </div> : null}
    {percentage !== null && selectedNames.length > 0 && !pickerUnavailable && !disabled
      ? <div role="progressbar" aria-label={`${label} upload progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage}
          className="h-2 w-full overflow-hidden rounded-full bg-[var(--lms-primary-light)]">
          <div className="h-full rounded-full bg-[var(--lms-primary)] transition-[width] duration-150 motion-reduce:transition-none" style={{ width: `${percentage}%` }} />
        </div> : null}
    {error && !unavailable ? <p id={`${id}-error`} role="alert" className="text-[12px] leading-5 text-[var(--lms-error-text)]">{error}</p> : null}
    {fallback ? <div className="min-w-0 space-y-2">{fallback}</div> : null}
    {disabled && !pickerUnavailable ? <p id={`${id}-unavailable`} role="status" className="text-[13px] leading-5 text-[var(--lms-body-text)]">This upload cannot continue with the file picker disabled. {fallback ? "Use the alternative provided." : "Enable file selection before continuing."}</p> : null}
  </div>;
}
