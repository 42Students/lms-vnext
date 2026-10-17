"use client";

import {useEffect,useRef} from "react";
import {useRouter} from "next/navigation";

/** The legacy recruiter inbox searches after two characters, in 200 ms. */
export function TpoInboxSearch({value,placeholder}:{
 value:string;placeholder:string;
}){
 const router=useRouter();
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);},[]);
 return <input name="q" type="search" defaultValue={value} maxLength={120}
  placeholder={placeholder}
  className="min-h-11 rounded-md border border-border bg-surface px-3 text-sm text-foreground"
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
