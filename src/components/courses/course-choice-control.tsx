import type { ComponentPropsWithRef } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Radio } from "@/components/ui/radio";

/** Render the legacy-styled shared input while preserving radio/checkbox grouping. */
export function CourseChoiceControl({
  single,
  ...props
}: Omit<ComponentPropsWithRef<"input">, "type"> & { single: boolean }) {
  const Choice = single ? Radio : Checkbox;
  return <Choice {...props} />;
}
