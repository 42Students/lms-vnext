"use client";
import { Input } from "@/components/ui/input";

import {useEffect,useRef} from "react";
import {useRouter} from "next/navigation";

/** The legacy recruiter inbox searches after two characters, in 200 ms. */
export function TpoInboxSearch({value,placeholder}:{
 value:string;placeholder:string;
}){
 const router=useRouter();
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const searchInput=useRef<HTMLInputElement>(null);
 useEffect(()=>{
  const onKey=(event:KeyboardEvent)=>{
   if(event.key!=="/"||event.altKey||event.ctrlKey||event.metaKey)return;
   const target=event.target;
   if(target instanceof HTMLInputElement||target instanceof HTMLTextAreaElement||
     target instanceof HTMLSelectElement||(target instanceof HTMLElement&&target.isContentEditable))return;
   event.preventDefault();searchInput.current?.focus();
  };
  window.addEventListener("keydown",onKey);
  return ()=>{window.removeEventListener("keydown",onKey);if(timer.current)clearTimeout(timer.current);};
 },[]);
 return <Input ref={searchInput} name="q" type="search" defaultValue={value} maxLength={120}
  placeholder={placeholder}
  className="min-h-11 w-full md:min-h-9"
  onChange={event=>{
    const text=event.currentTarget.value.trim();
    if(timer.current)clearTimeout(timer.current);
    timer.current=setTimeout(()=>{
      const params=new URLSearchParams(window.location.search);
      if(text.length>=2)params.set("q",text);
      else params.delete("q");
      params.delete("page");
      router.replace("/tpo/messages"+(params.size?"?"+params.toString():""),{scroll:false});
    },200);
  }}/>;
}
