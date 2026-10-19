"use client";

import { useId, useState, type ComponentPropsWithRef } from "react";
import { Input } from "./input";
import { Button } from "./button";
import { cx } from "@/lib/class-names";

export type PasswordInputProps = Omit<ComponentPropsWithRef<"input">, "type"> & {
  error?: boolean;
};

/**
 * Real password field: native password-manager autofill and keyboard preserved.
 * Legacy: components___form.scss:117-143, 10px/14px/400, teal focus and red
 * invalid state; components___variables.scss:139/148 for touch on <=767px.
 */
export function PasswordInput({ error = false, className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const generatedId = useId();
  const inputId = props.id ?? generatedId;
  return (
    <div data-slot="password-input" className="flex min-w-0 items-stretch gap-2">
      <Input {...props} id={inputId} type={visible ? "text" : "password"}
        error={error} className={cx("min-w-0 flex-1", className)} />
      <Button type="button" variant="secondary" disabled={props.disabled}
        aria-controls={inputId}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="shrink-0 max-[767px]:min-h-11 max-[767px]:min-w-11"
        onClick={() => setVisible(current => !current)}>
        {visible ? "Hide" : "Show"}
      </Button>
    </div>
  );
}
