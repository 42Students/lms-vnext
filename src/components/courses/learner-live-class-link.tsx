"use client";
import {useState} from "react";
export function LearnerLiveClassLink({href}:{href:string}){
 const [message,setMessage]=useState("");
 async function copy(){
  try{await navigator.clipboard.writeText(href);setMessage("Meeting link copied.");}
  catch{setMessage("Could not copy the meeting link. Open the meeting instead.");}
 }
 return <div className="mt-3 flex flex-wrap items-center gap-2">
  <a href={href} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center rounded border border-border px-3 text-sm font-semibold text-primary-text">Join Meeting</a>
  <button type="button" onClick={()=>void copy()} className="min-h-10 rounded border border-border px-3 text-sm font-semibold text-primary-text">Copy meeting link</button>
  {message?<span role="status" className="text-xs text-muted-foreground">{message}</span>:null}
 </div>;
}
