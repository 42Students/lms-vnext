import { cloneElement, Fragment, isValidElement, type ReactNode } from "react";

export type FormFieldProps = {
  id: string;
  label: string;
  required?: boolean;
  helper?: string;
  error?: string | null;
  children: (field: { id: string; required: boolean | undefined; "aria-invalid": boolean | undefined; "aria-describedby": string | undefined }) => ReactNode;
};

/** Owns visible labels and error descriptions for native Input/Select/Textarea. */
export function FormField({ id, label, required = false, helper, error, children }: FormFieldProps) {
  const describedBy = [helper ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;
  const rendered = children({ id, required: required || undefined, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy });
  // Apply the accessible relation at the container boundary even if a caller
  // forgets to spread the render-function props. Fragments cannot receive IDs.
  const associated = isValidElement<{id?:string; required?:boolean; "aria-invalid"?: boolean; "aria-describedby"?: string}>(rendered) &&
    rendered.type !== Fragment
    ? cloneElement(rendered, {
        id,
        required: required || rendered.props.required || undefined,
        "aria-invalid": error ? true : rendered.props["aria-invalid"],
        "aria-describedby": [...new Set([
          ...(rendered.props["aria-describedby"]?.split(/\s+/) ?? []),
          ...(describedBy?.split(/\s+/) ?? []),
        ].filter(Boolean))].join(" ") || undefined,
      })
    : rendered;
  return <div data-slot="form-field" className="min-w-0 space-y-[6px] text-[13px]">
    <label htmlFor={id} className="block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
      {label}{required ? <span aria-hidden="true" className="text-[var(--lms-error)]"> *</span> : null}
      {required ? <span className="sr-only">required</span> : null}
    </label>
    {associated}
    {helper ? <p id={`${id}-hint`} className="text-[13px] leading-5 text-[var(--lms-muted-text)]">{helper}</p> : null}
    {error ? <p id={`${id}-error`} role="alert" className="text-[12px] leading-5 text-[var(--lms-error-text)]">{error}</p> : null}
  </div>;
}
