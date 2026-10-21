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
