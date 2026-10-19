"use client";
import { useRef, type ComponentPropsWithRef, type FormEvent } from "react";
import { Input } from "./input";
import { Button } from "./button";
import { cx } from "@/lib/class-names";
export type SearchFieldProps = Omit<ComponentPropsWithRef<"input">,"type"> & {
  onSearch: (query: string) => void;
  buttonLabel?: string;
  wrapperClassName?: string;
};
/** Search remains submit-on-Enter and has an explicit old-LMS action button. */
export function SearchField({onSearch,buttonLabel="Search",wrapperClassName,className,...props}:SearchFieldProps) {
  const inputRef=useRef<HTMLInputElement>(null);
  function submit(event:FormEvent<HTMLFormElement>) {event.preventDefault();onSearch(inputRef.current?.value??"");}
  return <form data-slot="search-field" role="search" onSubmit={submit} className={cx("flex min-w-0 items-stretch gap-2",wrapperClassName)}>
    <Input {...props} ref={inputRef} type="search" className={className} />
    <Button type="submit" variant="secondary">{buttonLabel}</Button>
  </form>;
}
