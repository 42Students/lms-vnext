"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
/** Never infer zero from a failed request: omit badge until the server confirms a count. */
export function TpoTopbarMessages(){
 const [count,setCount]=useState<number|null>(null);
 useEffect(()=>{
  let active=true;
  async function refresh(){
   if(document.hidden)return;
   try{
    const res=await fetch("/api/tpo/shell-counts",{credentials:"same-origin",cache:"no-store"});
    if(!res.ok)return;
    const info=await res.json() as {messages?:number};
    if(active&&typeof info.messages==="number")setCount(info.messages);
   }catch{/* retain last successful number */}
  }
  void refresh();
  const timer=window.setInterval(()=>void refresh(),30000);
  document.addEventListener("visibilitychange",refresh);
  return ()=>{active=false;window.clearInterval(timer);document.removeEventListener("visibilitychange",refresh);};
 },[]);
 return <Link href="/tpo/messages" aria-label={"Messages"+(count!==null?", "+count+" unread":"")}
  className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold text-primary-text">
  Messages {count!==null&&count>0?<span className="rounded-full bg-primary-subtle px-2 py-0.5 text-xs tabular-nums">{count>99?"99+":count}</span>:null}
 </Link>;
}
