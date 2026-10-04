export type ClassNameValue =
  | string
  | false
  | null
  | undefined;

export function cx(...values: ClassNameValue[]) {
  return values.filter(Boolean).join(" ");
}

// shadcn/custom registries conventionally expect a cn helper.
// Keep it behavior-identical to the existing lightweight cx helper.
export const cn = cx;
