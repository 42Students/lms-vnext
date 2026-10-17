"use client";
import {useEffect,useRef} from "react";

/** FAC-courses-07: progressively enhanced GET filters.
 * No invented client dataset: the server remains the source of authorized rows. */
export function FacultyCourseFilterAutoSubmit(){
 const anchor=useRef<HTMLSpanElement>(null);
 useEffect(()=>{
  const form=anchor.current?.closest("form");
  if(!form)return;
  let pending:ReturnType<typeof setTimeout>|null=null;
  function changed(event:Event){
   const target=event.target;
   if(!(target instanceof HTMLInputElement||target instanceof HTMLSelectElement))return;
   if(!["q","period","section","role"].includes(target.name))return;
   if(pending!==null)window.clearTimeout(pending);
   pending=window.setTimeout(()=>{
    pending=null;
    if(form?.isConnected)form.requestSubmit();
   },target.name==="q"?350:0);
  }
  form.addEventListener("input",changed);
  form.addEventListener("change",changed);
  return ()=>{
   if(pending!==null)window.clearTimeout(pending);
   form.removeEventListener("input",changed);
   form.removeEventListener("change",changed);
  };
 },[]);
 return <span ref={anchor} hidden aria-hidden="true"/>;
}
