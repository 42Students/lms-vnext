import type { ComponentPropsWithRef } from "react";
import { cx } from "@/lib/class-names";
import { Select } from "@/components/ui/select";

export type PageSizeSelectProps = Omit<ComponentPropsWithRef<"select">, "children"> & {
  options: readonly number[];
  label?: string;
  wrapperClassName?: string;
};

/** Native GET-form page-size selector with preserved input name and form behavior. */
export function PageSizeSelect({
  options, label = "Rows per page", wrapperClassName, className, ...props
}: PageSizeSelectProps) {
  return <label className={cx("grid gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]", wrapperClassName)}>
    {label}
    <Select {...props} className={cx("min-h-11 md:min-h-9", className)}>
      {options.map(size => <option key={size} value={size}>{size}</option>)}
    </Select>
  </label>;
}
