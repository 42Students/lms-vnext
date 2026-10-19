import type { ReactNode } from "react";
import { cx } from "@/lib/class-names";
export type InputGroupProps = { prefix?:ReactNode; suffix?:ReactNode; children:ReactNode; className?:string };
/** Adjacent prefix/suffix are decorative; the child retains its own label, ID and focus. */
export function InputGroup({prefix,suffix,children,className}:InputGroupProps) {
  return <div data-slot="input-group" className={cx("flex min-w-0 items-center gap-2 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-[var(--lms-form-bg)] px-3 focus-within:border-[var(--lms-primary)] focus-within:shadow-[var(--lms-control-shadow)]",className)}>
    {prefix?<span aria-hidden="true" className="shrink-0 text-[13px] text-[var(--lms-muted-text)]">{prefix}</span>:null}
    <div className="min-w-0 flex-1 [&_[data-slot=input]]:border-0 [&_[data-slot=input]]:bg-transparent [&_[data-slot=input]]:px-0 [&_[data-slot=input]]:shadow-none [&_[data-slot=input]]:outline-none">{children}</div>
    {suffix?<span aria-hidden="true" className="shrink-0 text-[13px] text-[var(--lms-muted-text)]">{suffix}</span>:null}
  </div>;
}
