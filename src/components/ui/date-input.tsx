import type { ComponentPropsWithRef } from "react";
import { Input } from "./input";
export type DateInputProps = Omit<ComponentPropsWithRef<"input">, "type"> & {
  mode?: "date" | "time" | "datetime-local" | "month" | "week";
  error?: boolean;
};
/** Native locale-aware picker with one legacy focus/error skin. */
export function DateInput({ mode = "date", error = false, ...props }: DateInputProps) {
  return <Input {...props} data-slot="date-input" type={mode} error={error} />;
}
