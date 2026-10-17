import type { ReactNode } from "react";

export type FormFieldProps = {
  id: string;
  label: string;
  required?: boolean;
  helper?: string;
  error?: string | null;
  children: (field: { id: string; "aria-invalid": boolean | undefined; "aria-describedby": string | undefined }) => ReactNode;
};

/** Owns visible labels and error descriptions for native Input/Select/Textarea. */
export function FormField({ id, label, required = false, helper, error, children }: FormFieldProps) {
  const describedBy = [helper ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;
  return <div data-slot="form-field" className="min-w-0 space-y-1.5">
    <label htmlFor={id} className="block text-sm font-semibold leading-6 text-foreground">
      {label}{required ? <span aria-hidden="true"> *</span> : null}
      {required ? <span className="sr-only">required</span> : null}
    </label>
    {children({ id, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy })}
    {helper ? <p id={`${id}-hint`} className="text-sm leading-6 text-body">{helper}</p> : null}
    {error ? <p id={`${id}-error`} role="alert" className="text-sm leading-6 text-foreground">{error}</p> : null}
  </div>;
}
