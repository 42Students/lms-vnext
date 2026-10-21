"use client";
import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {Input} from "@/components/ui/input";

/** Legacy 400 ms recruiter-style applicant search, scoped to the current drive. */
export function CollegeApplicationsDebouncedSearch({initialValue,placeholder}:{
 initialValue:string;placeholder:string;
}){
 const router=useRouter();
 const [value,setValue]=useState(initialValue);
 const timeout=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>()=>{if(timeout.current)clearTimeout(timeout.current);},[]);
 return <Input name="q" type="search" value={value} maxLength={100} placeholder={placeholder}
  onChange={event=>{
   const next=event.target.value;
   setValue(next);
   if(timeout.current)clearTimeout(timeout.current);
   timeout.current=setTimeout(()=>{
    const url=new URL(window.location.href);
    if(next.trim())url.searchParams.set("q",next.trim());
    else url.searchParams.delete("q");
    url.searchParams.set("page","1");
    router.replace(url.pathname+url.search,{scroll:false});
   },400);
  }}/>;
}
