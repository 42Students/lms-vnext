"use client";
import { Badge } from "@/components/ui/badge";
import {useEffect,useState} from "react";
import {apiFetch} from "@/lib/api-fetch";
import {safeTpoShellCounters,shellUnreadBadge} from "./shell-counts-model";
import { ButtonLink } from "@/components/ui/button-link";
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
 return <ButtonLink variant="secondary" href="/tpo/messages" aria-label={"Messages"+(count!==null?", "+count+" unread":"")}
  className="max-w-full min-w-0">
  <span className="min-w-0 truncate">Messages</span>
  {shellUnreadBadge(count)?<Badge tone="error" className="shrink-0 whitespace-nowrap px-2 py-0.5 tabular-nums">{shellUnreadBadge(count)}</Badge>:null}
 </ButtonLink>;
}
