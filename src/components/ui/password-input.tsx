"use client";
import { useId, useState, type ComponentPropsWithRef } from "react";
import { Input } from "./input";
import { Button } from "./button";
export type PasswordInputProps = Omit<ComponentPropsWithRef<"input">,"type"> & { error?: boolean };
export function PasswordInput({error=false,...props}:PasswordInputProps) {
  const [visible,setVisible]=useState(false);
  const generatedId = useId();
  const inputId = props.id ?? generatedId;
  return <div data-slot="password-input" className="flex min-w-0 items-stretch gap-2">
    <Input {...props} id={inputId} type={visible?"text":"password"} error={error} />
    <Button type="button" variant="secondary" disabled={props.disabled} aria-controls={inputId} aria-label={visible?"Hide password":"Show password"} aria-pressed={visible} onClick={()=>setVisible(value=>!value)}>{visible?"Hide":"Show"}</Button>
  </div>;
}
