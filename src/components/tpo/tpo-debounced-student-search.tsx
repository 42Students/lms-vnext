"use client";
import { Input } from "@/components/ui/input";
import {useEffect,useRef,useState} from "react";
import {usePathname,useRouter,useSearchParams} from "next/navigation";
/** A legacy q= deep link resolves on the server; editing normalizes to search=. */
export function TpoDebouncedStudentSearch({initial}:{initial:string}){
 const [value,setValue]=useState(initial);
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const router=useRouter(),pathname=usePathname(),params=useSearchParams();
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);},[]);
 return <Input type="search" name="search" value={value} maxLength={150}
  placeholder="Search name, roll no., email"
  aria-label="Search name, roll no., email"
  onChange={event=>{
   const nextValue=event.target.value;setValue(nextValue);
   if(timer.current)clearTimeout(timer.current);
   timer.current=setTimeout(()=>{
    const next=new URLSearchParams(params.toString());
    next.delete("q");next.delete("page");
    if(nextValue.trim())next.set("search",nextValue.trim());else next.delete("search");
    router.replace(pathname+(next.size?"?"+next.toString():""),{scroll:false});
   },350);
  }}
  className="min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm text-foreground"/>;
}
