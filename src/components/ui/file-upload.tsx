"use client";

import { useId, useState, type ChangeEvent, type ComponentPropsWithRef } from "react";
import { cx } from "@/lib/class-names";

export type FileUploadProps = Omit<ComponentPropsWithRef<"input">, "type" | "onChange"> & {
  label: string;
  maxBytes?: number;
  onFiles: (files: FileList | null) => void;
  helper?: string;
};

export function fileSizeIsValid(size: number, maxBytes?: number) {
  return Number.isFinite(size) && size >= 0 && (maxBytes === undefined || size <= maxBytes);
}
export function FileUpload({ label, maxBytes, onFiles, helper, id: suppliedId, className, disabled, ...props }: FileUploadProps) {
  const autoId = useId();
  const id = suppliedId ?? autoId;
  const [error, setError] = useState<string | null>(null);
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const files = event.currentTarget.files;
    const oversized = Array.from(files ?? []).some(file => !fileSizeIsValid(file.size, maxBytes));
    if (oversized) {
      setError("This file is larger than the allowed limit.");
      event.currentTarget.value = "";
      return;
    }
    setError(null);
    onFiles(files);
  }
  return <div className={cx("min-w-0 space-y-2", className)} data-slot="file-upload">
    <label htmlFor={id} className="block text-sm font-semibold text-foreground">{label}</label>
    <input {...props} id={id} type="file" disabled={disabled} onChange={handleChange}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? `${id}-error` : helper ? `${id}-help` : undefined}
      className="block min-h-11 w-full min-w-0 rounded-md border border-border bg-surface px-3 py-2 text-base text-foreground file:mr-3 file:rounded file:border-0 file:bg-primary-subtle file:px-3 file:py-2 file:text-sm file:font-semibold file:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)] disabled:opacity-50" />
    {helper ? <p id={`${id}-help`} className="text-sm leading-6 text-body">{helper}</p> : null}
    {error ? <p id={`${id}-error`} role="alert" className="text-sm text-foreground">{error}</p> : null}
  </div>;
}
