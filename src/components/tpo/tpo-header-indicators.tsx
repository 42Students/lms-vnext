"use client";
import Link from "next/link";
import {useEffect,useRef,useState} from "react";
import {TpoBellPanel} from "@/components/tpo/tpo-bell-panel";
import {tpoHeaderSnapshotSchema,type TpoHeaderSnapshot} from "@/modules/activity/tpo-header-snapshot-model";

export function TpoHeaderIndicators({initial}:{initial:TpoHeaderSnapshot}){
 const [snapshot,setSnapshot]=useState<{value:TpoHeaderSnapshot;revision:number}>({value:initial,revision:0});
 const [error,setError]=useState("");
 const loading=useRef(false);
 useEffect(()=>{
  let active=true;
  async function refresh(){
   if(!active||loading.current)return;
   loading.current=true;
   try{
    const response=await fetch("/api/tpo/header-snapshot",{cache:"no-store",credentials:"same-origin"});
    if(!response.ok)throw new Error("Couldn't refresh notifications");
    const raw:unknown=await response.json();
    const parsed=tpoHeaderSnapshotSchema.safeParse(raw);
    if(!parsed.success)throw new Error("Couldn't refresh notifications");
    if(active){setSnapshot(previous=>({value:parsed.data,revision:previous.revision+1}));setError("");}
   }catch{if(active)setError("Couldn't refresh notifications. Showing the last count.");}
   finally{loading.current=false;}
  }
  const onVisibility=()=>{if(document.visibilityState==="visible")void refresh();};
  const id=window.setInterval(()=>{if(document.visibilityState==="visible")void refresh();},30000);
  document.addEventListener("visibilitychange",onVisibility);
  return ()=>{active=false;window.clearInterval(id);document.removeEventListener("visibilitychange",onVisibility);};
 },[]);
 const {messages,items,unread}=snapshot.value;
 return <div className="flex min-w-0 items-center gap-3">
  <Link href="/tpo/messages" aria-label={"Messages"+(messages?", "+messages+" unread":"")}
   className="relative inline-flex h-11 w-11 min-h-11 min-w-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface text-foreground transition-colors hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:h-9 md:w-9 md:min-h-9 md:min-w-9"
   title="Messages">
   <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
     strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8A8.5 8.5 0 0 1 12.5 20a8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 12.5 3h.5A8.5 8.5 0 0 1 21 11v.5Z"/>
   </svg>
   {messages>0?<span aria-label={messages+" unread"} className="absolute -right-1.5 -top-1.5 inline-flex min-h-[17px] min-w-[17px] items-center justify-center rounded-[var(--lms-radius-pill)] border-2 border-surface bg-[var(--lms-topbar-unread)] px-0.5 text-center text-[10px] font-bold leading-none text-white">
    {messages>99?"99+":messages}
   </span>:null}
  </Link>
  <TpoBellPanel initialUnread={unread} items={items} revision={snapshot.revision}/>
  {error?<span role="status" className="max-w-32 text-xs text-warning-text">{error}</span>:null}
 </div>;
}
