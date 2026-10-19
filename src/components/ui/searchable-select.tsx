"use client";
import { useId, type ComponentPropsWithRef, type ChangeEvent, type FocusEvent } from "react";
import { Input } from "./input";
export type SearchableSelectProps = Omit<ComponentPropsWithRef<"input">,"list"|"type"> & {
  options: ReadonlyArray<{ value: string; label?: string }>;
  creatable?: boolean;
  error?: boolean;
};
/** Native datalist gives search, keyboard completion and custom text values. */
export function SearchableSelect({options,creatable=true,error=false,id,className,onChange,onBlur,...props}:SearchableSelectProps) {
  const generatedId=useId(); const listId=(id??generatedId)+"-options";
  function change(event:ChangeEvent<HTMLInputElement>) {event.currentTarget.setCustomValidity("");onChange?.(event);}
  function blur(event:FocusEvent<HTMLInputElement>) {
    if(!creatable&&event.currentTarget.value&&!options.some(option=>option.value===event.currentTarget.value)){
      event.currentTarget.setCustomValidity("Choose a value from the available options.");
    }else event.currentTarget.setCustomValidity("");
    onBlur?.(event);
  }
  return <div data-slot="searchable-select" className="min-w-0">
    <Input {...props} id={id} type="text" list={listId} error={error} className={className} aria-autocomplete="list" onChange={change} onBlur={blur} />
    <datalist id={listId}>{options.map(option=><option key={option.value} value={option.value} label={option.label??option.value} />)}</datalist>
    {!creatable ? <span className="sr-only">Choose an existing option from the suggestions.</span> : null}
  </div>;
}
