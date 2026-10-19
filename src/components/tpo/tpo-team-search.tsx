"use client";
import { Input } from "@/components/ui/input";
import {useEffect,useRef} from "react";
import {useRouter} from "next/navigation";

/** TPO-inbox-team-19: search Team conversations after two characters. */
export function TpoTeamSearch({value}:{value:string}){
 const router=useRouter();
 const ref=useRef<HTMLInputElement>(null);
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>{
  const onKey=(event:KeyboardEvent)=>{
   if(event.key!=="/"||event.altKey||event.ctrlKey||event.metaKey)return;
   const target=event.target;
   if(target instanceof HTMLInputElement||target instanceof HTMLTextAreaElement||
    target instanceof HTMLSelectElement||(target instanceof HTMLElement&&target.isContentEditable))return;
   event.preventDefault();ref.current?.focus();
  };
  window.addEventListener("keydown",onKey);
  return ()=>{
   window.removeEventListener("keydown",onKey);
   if(timer.current)clearTimeout(timer.current);
  };
 },[]);
 return <label className="block text-sm font-semibold text-body">
  Search conversations
  <Input ref={ref} type="search" name="q" maxLength={120} defaultValue={value}
   placeholder="Search (press /)"
   className="mt-1 min-h-11 sm:min-h-9 w-full"
   onChange={event=>{
    const query=event.currentTarget.value.trim();
    if(timer.current)clearTimeout(timer.current);
    timer.current=setTimeout(()=>{
     const params=new URLSearchParams(window.location.search);
     params.set("tab","conversations");
     if(query.length>=2)params.set("q",query);
     else params.delete("q");
     router.replace("/tpo/team?"+params.toString(),{scroll:false});
    },200);
   }}/>
 </label>;
}
