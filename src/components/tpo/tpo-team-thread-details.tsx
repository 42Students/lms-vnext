"use client";
import { Button } from "@/components/ui/button";
import {useEffect,useState} from "react";
export function TpoTeamThreadDetails({threadId,topic,counterpart,createdDate,decisions,openAsks,awayLabel}:{
 threadId:string;topic:string;counterpart:string;createdDate:string;decisions:number;openAsks:number;awayLabel:string|null;
}){
 const storageKey="tpo-team-details:"+threadId;
 const [open,setOpen]=useState(false);
 useEffect(()=>{
  const timer=window.setTimeout(()=>{
   try{setOpen(sessionStorage.getItem(storageKey)==="open");}
   catch{/* Session preference is optional. */}
  },0);
  return ()=>window.clearTimeout(timer);
 },[storageKey]);
 function toggle(){
  setOpen(current=>{
   const next=!current;
   try{sessionStorage.setItem(storageKey,next?"open":"closed");}
   catch{/* Optional preference. */}
   return next;
  });
 }
 return <section className="space-y-2">
  <Button variant="secondary" type="button" onClick={toggle} aria-expanded={open}
   aria-controls={"team-details-"+threadId}
   className="min-h-11 sm:min-h-[var(--lms-control-height)]">
   {open?"Hide details":"Details"}
  </Button>
  {open?<aside id={"team-details-"+threadId} aria-label="Conversation details"
   className="w-full rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4 text-sm lg:max-w-md">
   <h2 className="font-semibold">About this conversation</h2>
   <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2">
    <dt className="text-muted-foreground">Topic</dt><dd className="break-words">{topic}</dd>
    <dt className="text-muted-foreground">With</dt><dd className="break-words">{counterpart}</dd>
    <dt className="text-muted-foreground">Started</dt>
    <dd>{createdDate} IST</dd>
    <dt className="text-muted-foreground">Decisions here</dt><dd>{decisions}</dd>
    <dt className="text-muted-foreground">Open asks</dt><dd>{openAsks}</dd>
    <dt className="text-muted-foreground">People</dt><dd className="break-words">You · {counterpart}{awayLabel?" · away until "+awayLabel:""}</dd>
   </dl>
   <p className="mt-3 text-xs text-muted-foreground">Only this conversation&apos;s participants can see its messages.</p>
  </aside>:null}
 </section>;
}
