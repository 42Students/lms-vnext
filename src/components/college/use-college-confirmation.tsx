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
  setMessage(next);
 }),[]);
 const finish=useCallback((answer:boolean)=>{
  const pending=resolver.current;
  resolver.current=null;
  setMessage(null);
  pending?.(answer);
 },[]);
 useEffect(()=>()=>{resolver.current?.(false);resolver.current=null;},[]);
 const confirmation=<ConfirmDialog open={message!==null} title={message??"Confirm"}
  onOpenChange={open=>{if(!open)finish(false);}}
  confirmLabel="Confirm" cancelLabel="Cancel" onConfirm={()=>finish(true)} />;
 return {ask,confirmation};
}
