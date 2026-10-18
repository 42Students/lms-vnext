"use client";
import {useEffect,useRef} from "react";
import {useRouter} from "next/navigation";

/** FAC-courses-07: live, scoped server filters without a full-page reload.
 * Next router navigation retains server-side authorization and filtering;
 * the GET form still works when JavaScript is unavailable. */
export function FacultyCourseFilterAutoSubmit(){
 const anchor=useRef<HTMLSpanElement>(null);
 const router=useRouter();
 useEffect(()=>{
  const form=anchor.current?.closest("form");
  if(!form)return;
  let pending:number|null=null;
  function changed(event:Event){
   const target=event.target;
   if(!(target instanceof HTMLInputElement||target instanceof HTMLSelectElement))return;
   if(!["q","period","section","role"].includes(target.name))return;
   if(pending!==null)window.clearTimeout(pending);
   pending=window.setTimeout(()=>{
    pending=null;
    if(!form?.isConnected)return;
    const params=new URLSearchParams();
    for(const [name,value] of new FormData(form)){
     if(typeof value==="string"&&value.trim())params.set(name,value);
    }
    const query=params.toString();
    // App Router soft navigation: no document reload or unscoped client rows.
    router.replace("/teacher/courses"+(query?"?"+query:""),{scroll:false});
   },target.name==="q"?350:0);
  }
  form.addEventListener("input",changed);
  form.addEventListener("change",changed);
  return ()=>{
   if(pending!==null)window.clearTimeout(pending);
   form.removeEventListener("input",changed);
   form.removeEventListener("change",changed);
  };
 },[router]);
 return <span ref={anchor} hidden aria-hidden="true"/>;
}
