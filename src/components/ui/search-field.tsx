"use client";
import { useRef, type ComponentPropsWithRef, type FormEvent } from "react";
import { Input } from "./input";
import { Button } from "./button";
import { cx } from "@/lib/class-names";
export type SearchFieldProps = Omit<ComponentPropsWithRef<"input">,"type"|"onSearch"> & {
  onSearch: (query: string) => void;
  buttonLabel?: string;
  wrapperClassName?: string;
};
/** Search remains submit-on-Enter and has an explicit old-LMS action button. */
export function SearchField({onSearch,buttonLabel="Search",wrapperClassName,className,ref:forwardedRef,...props}:SearchFieldProps) {
  const inputRef=useRef<HTMLInputElement|null>(null);
  function bindInput(node: HTMLInputElement|null) {
    inputRef.current=node;
    if (typeof forwardedRef==="function") forwardedRef(node);
    else if (forwardedRef) forwardedRef.current=node;
  }
  function submit(event:FormEvent<HTMLFormElement>) {event.preventDefault();if(props.disabled)return;onSearch(inputRef.current?.value??"");}
  return <form data-slot="search-field" role="search" onSubmit={submit} className={cx("flex min-w-0 flex-wrap items-stretch gap-2 max-[767px]:flex-col",wrapperClassName)}>
    <Input {...props} ref={bindInput} type="search" aria-label={props["aria-label"] ?? props.placeholder ?? buttonLabel} className={cx("min-w-0 !min-h-11 !rounded-[12px] !border-[var(--lms-neutral-100)] !px-[15px] !py-[11px] hover:!border-[var(--lms-field-hover-border)] focus-visible:!border-[var(--lms-primary)] w-[clamp(180px,20vw,280px)] appearance-none [&::-webkit-search-cancel-button]:hidden max-[767px]:w-full", className)} />
    <Button type="submit" variant="secondary" disabled={props.disabled} className="max-[767px]:min-h-11 focus-visible:!outline-offset-[3px] focus-visible:!outline-[var(--lms-primary-text)]">{buttonLabel}</Button>
  </form>;
}
