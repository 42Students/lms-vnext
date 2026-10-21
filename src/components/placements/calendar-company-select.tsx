"use client";

import {useTransition} from "react";
import {useRouter} from "next/navigation";
import {Select} from "@/components/ui/select";

/** Route-backed clearable company selection, preserving the selected date,
 * view and other chips. Never relies on the browser's local timezone. */
export function CalendarCompanySelect({href,companies,selected}:{
 href:string;companies:readonly string[];selected:string;
}){
 const router=useRouter();
 const [pending,startTransition]=useTransition();
 const choices=selected&&!companies.includes(selected)
  ?[selected,...companies]:companies;
 return <Select name="company" defaultValue={selected} disabled={pending}
  aria-label="Filter calendar by company"
  onChange={event=>{
   const value=event.target.value;
   const [route,search=""]=href.split("?",2);
   const params=new URLSearchParams(search);
   if(value)params.set("company",value);
   else params.delete("company");
   startTransition(()=>router.push(route+(params.size?"?"+params.toString():"")));
  }} className="w-full">
   <option value="">All companies</option>
   {choices.map(name=><option key={name} value={name}>{name}</option>)}
 </Select>;
}

/** Applies an IST calendar day immediately without a form submit. */
export function CalendarDateSelect({href,value}:{href:string;value:string}){
 const router=useRouter();const [pending,startTransition]=useTransition();
 return <input type="date" name="date" defaultValue={value} disabled={pending}
  required aria-label="Calendar date"
  className="min-h-11 w-full min-w-0 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm text-body md:min-h-9"
  onChange={event=>{
   const date=event.target.value;
   if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+"T12:00:00Z")))return;
   const [route,search=""]=href.split("?",2);
   const params=new URLSearchParams(search);
   params.set("date",date);
   startTransition(()=>router.push(route+"?"+params.toString()));
  }}/>;
}
/** Selecting an event kind supersedes a multi-chip query and keeps other filters. */
export function CalendarEventKindSelect({href,selected,options}:{
 href:string;selected:string;options:readonly {value:string;label:string}[];
}){
 const router=useRouter();const [pending,startTransition]=useTransition();
 return <Select name="kind" defaultValue={selected} disabled={pending}
  aria-label="Calendar event type" className="w-full" onChange={event=>{
   const kind=event.target.value;
   const [route,search=""]=href.split("?",2);
   const params=new URLSearchParams(search);
   params.delete("kinds");
   if(kind)params.set("kind",kind);else params.delete("kind");
   startTransition(()=>router.push(route+"?"+params.toString()));
  }}>
   {options.map(item=><option key={item.value} value={item.value}>{item.label}</option>)}
 </Select>;
}
