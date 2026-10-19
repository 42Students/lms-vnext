import type { ComponentPropsWithRef, ReactNode } from "react";
import { Select } from "./select";
export type MultiSelectProps = Omit<ComponentPropsWithRef<"select">,"multiple"|"children"> & {
  options: ReadonlyArray<{ value: string; label: ReactNode; disabled?: boolean }>;
  visibleRows?: number;
  error?: boolean;
};
/** Accessible native multiple select: Ctrl/Cmd and Shift select multiple entries. */
export function MultiSelect({ options, visibleRows = 4, error = false, ...props }: MultiSelectProps) {
  return <Select {...props} multiple size={visibleRows} error={error} data-slot="multi-select">
    {options.map(option=><option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)}
  </Select>;
}
