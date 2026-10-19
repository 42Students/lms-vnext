"use client";
import { useId, type ComponentPropsWithRef } from "react";
import { Input } from "./input";
export type SearchableSelectProps = Omit<ComponentPropsWithRef<"input">,"list"|"type"> & {
  options: ReadonlyArray<{ value: string; label?: string }>;
  creatable?: boolean;
  error?: boolean;
};
/** Native datalist gives search, keyboard completion and custom text values. */
export function SearchableSelect({options,creatable=true,error=false,id,className,...props}:SearchableSelectProps) {
  const generatedId=useId(); const listId=(id??generatedId)+"-options";
  return <div data-slot="searchable-select" className="min-w-0">
    <Input {...props} id={id} type="text" list={listId} error={error} className={className} aria-autocomplete="list" />
    <datalist id={listId}>{options.map(option=><option key={option.value} value={option.value} label={option.label??option.value} />)}</datalist>
    {!creatable ? <span className="sr-only">Choose an existing option from the suggestions.</span> : null}
  </div>;
}
