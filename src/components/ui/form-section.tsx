import { useId, type ComponentPropsWithRef, type ReactNode } from "react";
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
  const generatedId = useId();
  const descriptionId = `${generatedId}-description`;
  const describedBy = [...new Set([
    ...(props["aria-describedby"]?.split(/\s+/).filter(Boolean) ?? []),
    ...(description ? [descriptionId] : []),
  ])].join(" ") || undefined;
  return (
    <fieldset {...props} aria-describedby={describedBy} data-slot="form-section"
      className={cx("m-0 min-w-0 border-0 p-0 disabled:cursor-not-allowed disabled:[&_legend]:text-[var(--lms-neutral-400)]", className)}>
      <legend className="mb-2 max-w-full break-words text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">{label}</legend>
      {description ? <div id={descriptionId} className="mb-3 min-w-0 break-words text-[13px] leading-5 text-[var(--lms-muted-text)]">{description}</div> : null}
      <div className="grid min-w-0 gap-[var(--lms-space-4)]">{children}</div>
    </fieldset>
  );
}
