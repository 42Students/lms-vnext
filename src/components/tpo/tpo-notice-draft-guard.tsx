"use client";
import {useEffect,useState} from "react";

/** TPO-inbox-team-55 / GR-60, GR-61, GR-62:
 * Retain announcement fields when validation, a failed request, navigation or
 * session expiry returns staff to the form. Never persist passwords or tokens.
 */
export function TpoNoticeDraftGuard({formId,actorId}:{formId:string;actorId:string}){
 const [restored,setRestored]=useState(false);
 useEffect(()=>{
  const form=document.getElementById(formId);
  if(!(form instanceof HTMLFormElement))return;
  const key="tpo-announcement-draft:"+actorId;
  const fields=["title","message","buttonLabel","buttonUrl","sendAt","showUntil","pinned"];
  const read=()=>Object.fromEntries(fields.map(field=>{
   const element=form.elements.namedItem(field);
   return [field,element instanceof HTMLInputElement&&element.type==="checkbox"?element.checked:
    element instanceof HTMLInputElement||element instanceof HTMLTextAreaElement?element.value:""];
  }));
  const write=(values:Record<string,unknown>)=>{
   for(const field of fields){
    const element=form.elements.namedItem(field);
    const saved=values[field];
    if(element instanceof HTMLInputElement&&element.type==="checkbox"){
     if(typeof saved==="boolean")element.checked=saved;
    }else if(element instanceof HTMLInputElement||element instanceof HTMLTextAreaElement){
     if(typeof saved==="string")element.value=saved.slice(0,field==="message"?8000:field==="title"?200:500);
    }
   }
  };
  const stored=()=>{
   try{return JSON.parse(sessionStorage.getItem(key)??"null") as Record<string,unknown>|null;}
   catch{return null;}
  };
  const values=stored();
  if(new URLSearchParams(window.location.search).has("sentNotice")){
   try{sessionStorage.removeItem(key);}catch{/* Optional storage. */}
  }else if(values){
   write(values);
   // Deferred state update avoids synchronous effect-to-state cascading.
   window.setTimeout(()=>setRestored(true),0);
  }
  const save=()=>{
   try{sessionStorage.setItem(key,JSON.stringify(read()));}catch{/* Optional storage. */}
  };
  const warn=(event:BeforeUnloadEvent)=>{
   const draft=read();
   if(!String(draft["title"]??"").trim()&&!String(draft["message"]??"").trim())return;
   event.preventDefault();event.returnValue="";
  };
  // A real form POST must not trigger an extra unsaved-work prompt.
  const submitted=()=>window.removeEventListener("beforeunload",warn);
  form.addEventListener("input",save);
  form.addEventListener("change",save);
  form.addEventListener("submit",submitted);
  window.addEventListener("beforeunload",warn);
  return ()=>{
   form.removeEventListener("input",save);form.removeEventListener("change",save);
   form.removeEventListener("submit",submitted);
   window.removeEventListener("beforeunload",warn);
  };
 },[actorId,formId]);
 return restored?<p role="status" className="text-sm text-body">Draft restored</p>:null;
}
