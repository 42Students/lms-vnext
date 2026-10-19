import type { ComponentPropsWithRef, ReactNode } from "react";
import { cx } from "@/lib/class-names";

export type FormSectionProps = Omit<ComponentPropsWithRef<"fieldset">, "children"> & {
  label: string;
  description?: ReactNode;
  children: ReactNode;
};

/** Fieldset/legend preserve a visible group label and accessible grouping. */
export function FormSection({
  label, description, className, children, ...props
}: FormSectionProps) {
  return (
    <fieldset {...props} data-slot="form-section"
      className={cx("min-w-0 border-0 p-0 disabled:opacity-50", className)}>
      <legend className="mb-2 text-[14px] font-semibold leading-5 text-[var(--lms-neutral-900)]">{label}</legend>
      {description ? <p className="mb-3 text-[13px] leading-5 text-[var(--lms-muted-text)]">{description}</p> : null}
      <div className="grid min-w-0 gap-[var(--lms-space-4)]">{children}</div>
    </fieldset>
  );
}
