"use client";

import { useEffect, useId, useImperativeHandle, useRef, useState, type ComponentPropsWithRef } from "react";
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
  // A disabled password must never remain in a previously revealed text state.
  useEffect(() => { if (props.disabled) setVisible(false); }, [props.disabled]);
  const fieldRef = useRef<HTMLInputElement | null>(null);
  // A commit-phase imperative handle replaces mutating forwarded refs in a\n  // render-created callback, which React lint rejects.\n  // Expose the mounted native input
  // through its imperative ref hook rather than mutating a caller's ref.
  useImperativeHandle(props.ref, () => {
    const node = fieldRef.current;
    if (!node) throw new Error("Password input is not mounted");
    return node;
  }, []);
  const effectiveVisible = visible && !props.disabled;
  const generatedId = useId();
  const inputId = props.id ?? generatedId;
  return (
    <div data-slot="password-input" className="flex w-full min-w-0 items-stretch gap-[var(--lms-space-2)]">
      <Input {...props} id={inputId} ref={fieldRef} type={effectiveVisible ? "text" : "password"}
        error={error} className={cx("min-w-0 flex-1", className)} />
      <Button type="button" variant="secondary" disabled={props.disabled}
        aria-controls={inputId}
        aria-label={effectiveVisible ? "Hide password" : "Show password"}
        aria-pressed={effectiveVisible}
        className="min-w-[4rem] shrink-0 max-[767px]:min-h-11 max-[767px]:min-w-11 focus-visible:!outline-offset-[3px] focus-visible:!outline-[var(--lms-primary-text)]"
        onClick={() => { setVisible(current => !current); fieldRef.current?.focus(); }}>
        {effectiveVisible ? "Hide" : "Show"}
      </Button>
    </div>
  );
}
