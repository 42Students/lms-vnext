"use client";
import { useState, type ComponentPropsWithRef } from "react";
import { Input } from "./input";
import { Button } from "./button";
export type PasswordInputProps = Omit<ComponentPropsWithRef<"input">,"type"> & { error?: boolean };
export function PasswordInput({error=false,...props}:PasswordInputProps) {
  const [visible,setVisible]=useState(false);
  return <div data-slot="password-input" className="flex min-w-0 items-stretch gap-2">
    <Input {...props} type={visible?"text":"password"} error={error} />
    <Button type="button" variant="secondary" aria-label={visible?"Hide password":"Show password"} aria-pressed={visible} onClick={()=>setVisible(value=>!value)}>{visible?"Hide":"Show"}</Button>
  </div>;
}
