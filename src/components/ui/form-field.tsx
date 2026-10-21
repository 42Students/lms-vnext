import { cloneElement, Fragment, isValidElement, type ReactNode } from "react";

export type FormFieldProps = {
  id: string;
  label: string;
  required?: boolean;
  helper?: string;
  error?: string | null;
  action?: ReactNode;
  compact?: boolean;
  children: (field: { id: string; required: boolean | undefined; "aria-invalid": boolean | undefined; "aria-describedby": string | undefined; "aria-errormessage": string | undefined }) => ReactNode;
};

/** Owns visible labels and error descriptions for native Input/Select/Textarea. */
export function FormField({ id, label, required = false, helper, error, action, compact = false, children }: FormFieldProps) {
  const describedBy = [helper ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;
  const rendered = children({ id, required: required || undefined, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy, "aria-errormessage": error ? `${id}-error` : undefined });
  // Apply the accessible relation at the container boundary even if a caller
  // forgets to spread the render-function props. Fragments cannot receive IDs.
  const associated = isValidElement<{id?:string; required?:boolean; "aria-invalid"?: boolean; "aria-describedby"?: string; "aria-errormessage"?: string}>(rendered) &&
    rendered.type !== Fragment
    ? cloneElement(rendered, {
        id,
        required: required || rendered.props.required || undefined,
        "aria-invalid": error ? true : rendered.props["aria-invalid"],
        "aria-errormessage": error ? `${id}-error` : rendered.props["aria-errormessage"],
        "aria-describedby": [...new Set([
          ...(rendered.props["aria-describedby"]?.split(/\s+/) ?? []),
          ...(describedBy?.split(/\s+/) ?? []),
        ].filter(Boolean))].join(" ") || undefined,
      })
    : rendered;
  return <div data-slot="form-field" className={compact ? "min-w-0 space-y-1 text-[13px]" : "min-w-0 space-y-[var(--lms-space-2)] text-[13px]"}>
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-2"><label htmlFor={id} className="block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
      {label}{required ? <span aria-hidden="true" className="ml-1 text-[var(--lms-error)]">*</span> : null}
      {required ? <span className="sr-only"> required</span> : null}
    </label>{action ? <div className="flex min-h-9 items-center">{action}</div> : null}</div>
    {associated}
    {helper ? <p id={`${id}-hint`} className="text-[13px] leading-5 text-[var(--lms-muted-text)]">{helper}</p> : null}
    {error ? <p id={`${id}-error`} role="alert" className="text-[12px] leading-5 text-[var(--lms-error)]">{error}</p> : null}
  </div>;
}
