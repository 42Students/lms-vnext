"use client";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {useEffect,useState} from "react";
import {apiFetch} from "@/lib/api-fetch";
import {safeTpoShellCounters,shellUnreadBadge} from "./shell-counts-model";
/** Never infer zero from a failed request: omit badge until the server confirms a count. */
export function TpoTopbarMessages(){
 const [count,setCount]=useState<number|null>(null);
 useEffect(()=>{
  let active=true;
  async function refresh(){
   if(document.hidden)return;
   try{
    const info=safeTpoShellCounters(await apiFetch<unknown>("/api/tpo/shell-counts",{credentials:"same-origin",cache:"no-store"}));
    if(active&&info)setCount(info.messages);
   }catch{/* retain last successful number */}
  }
  void refresh();
  const timer=window.setInterval(()=>void refresh(),30000);
  document.addEventListener("visibilitychange",refresh);
  return ()=>{active=false;window.clearInterval(timer);document.removeEventListener("visibilitychange",refresh);};
 },[]);
 return <Link href="/tpo/messages" aria-label={"Messages"+(count!==null?", "+count+" unread":"")}
  className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold text-primary-text">
  Messages {shellUnreadBadge(count)?<Badge tone="error" className="shrink-0 px-2 py-0.5 tabular-nums">{shellUnreadBadge(count)}</Badge>:null}
 </Link>;
}
