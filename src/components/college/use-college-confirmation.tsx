"use client";

import {useCallback,useEffect,useRef,useState} from "react";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";

/** Native WebViews need real focus-managed confirmation, never blocking native browser prompts. */
export function useCollegeConfirmation(){
 const [message,setMessage]=useState<string|null>(null);
 const resolver=useRef<((answer:boolean)=>void)|null>(null);
 const ask=useCallback((next:string)=>new Promise<boolean>(resolve=>{
  resolver.current?.(false);
  resolver.current=resolve;
  setMessage(next.trim()||"Confirm");
 }),[]);
 const finish=useCallback((answer:boolean)=>{
  const pending=resolver.current;
  resolver.current=null;
  setMessage(null);
  pending?.(answer);
 },[]);
 useEffect(()=>()=>{resolver.current?.(false);resolver.current=null;},[]);
 const copy=message??"Confirm";
 // Keep the caller’s exact warning copy while giving a short question its own heading.
 const questionEnd=copy.indexOf("? ");
 const headline=questionEnd>=0?copy.slice(0,questionEnd+1):copy;
 const detail=questionEnd>=0?copy.slice(questionEnd+2):null;
 const confirmation=<ConfirmDialog open={message!==null} title={headline}
  onOpenChange={open=>{if(!open)finish(false);}}
  confirmLabel="Confirm" cancelLabel="Cancel" onConfirm={()=>finish(true)}>
   <p className="m-0 max-w-[65ch] whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-sm leading-6 text-body">
    {detail??"This action will be applied immediately."}
   </p>
  </ConfirmDialog>;
 return {ask,confirmation};
}
