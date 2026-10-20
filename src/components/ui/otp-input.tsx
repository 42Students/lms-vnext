import type { ComponentPropsWithRef } from "react";
import { Input } from "./input";
import { cx } from "@/lib/class-names";

export type OtpInputProps = Omit<ComponentPropsWithRef<"input">, "type" | "inputMode" | "autoComplete"> & {
  digits?: number;
  error?: boolean;
};

/**
 * Keep native paste and one-time-code autofill: do not render six separate
 * input boxes that would break password manager / Android OTP handling.
 * Legacy: components___form.scss:117-143 (.ln-in2: 10px, 14px/400,
 * teal focus halo and error red 20%); components___variables.scss:139
 * phone touch target 44px, :184 14px base. Numeric input has no spinners.
 */
export function OtpInput({ digits = 6, error = false, className, ...props }: OtpInputProps) {
  const count = Number.isFinite(digits) ? Math.max(1, Math.min(12, Math.trunc(digits))) : 6;
  // Never render an impossible native minlength > maxlength combination.
  const minLength = Math.max(0, Math.min(count, props.minLength ?? count));
  return (
    <Input
      {...props}
      data-slot="otp-input"
      type="text"
      aria-label={props["aria-label"] ?? "One-time code"}
      inputMode="numeric"
      enterKeyHint={props.enterKeyHint ?? "done"}
      autoComplete="one-time-code"
      autoCapitalize="off"
      spellCheck={false}
      pattern={props.pattern ?? "[0-9]*"}
      minLength={minLength}
      maxLength={count}
      error={error}
      className={cx("tabular-nums tracking-[0.2px] text-center max-[767px]:min-h-11", className)}
    />
  );
}
