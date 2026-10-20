import type { ComponentPropsWithRef } from "react";
import { Checkbox } from "./checkbox";
import { Radio } from "./radio";
/** Dynamic choice type without bypassing the shared old-LMS controls. */
export type ChoiceInputProps = Omit<ComponentPropsWithRef<"input">, "type"> & { type:"checkbox"|"radio"; indeterminate?: boolean };
export function ChoiceInput({type,indeterminate,...props}:ChoiceInputProps) {
  return type==="radio" ? <Radio {...props} /> : <Checkbox {...props} indeterminate={indeterminate} />;
}
