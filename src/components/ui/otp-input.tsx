import type { ComponentPropsWithRef } from "react";
import { Input } from "./input";
export type OtpInputProps = Omit<ComponentPropsWithRef<"input">,"type"|"inputMode"|"autoComplete"> & { digits?: number; error?: boolean };
/** One-time-code field keeps mobile OS autofill and paste intact. */
export function OtpInput({digits=6,error=false,...props}:OtpInputProps) {
  return <Input {...props} data-slot="otp-input" type="text" inputMode="numeric" autoComplete="one-time-code"
    pattern="[0-9]*" maxLength={digits} error={error}
    className={["tabular-nums tracking-[0.3em] text-center",props.className].filter(Boolean).join(" ")} />;
}
