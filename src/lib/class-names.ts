import { twMerge } from "tailwind-merge";

export type ClassNameValue =
  | string
  | false
  | null
  | undefined;

/** Joins class names; when two utilities set the same property the later one wins (no !important needed). */
export function cx(...values: ClassNameValue[]) {
  return twMerge(values.filter(Boolean).join(" "));
}

// shadcn/custom registries conventionally expect a cn helper.
// Keep it behavior-identical to the existing lightweight cx helper.
export const cn = cx;
