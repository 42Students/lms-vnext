"use client";
import {useState} from "react";
import {safeProjectExternalHref} from "@/modules/projects/mentor-workspace-evidence-model";

/** Learner resource opening must never render an unsafe URL or silently fail on a blocked popup. */
export function ProjectResourceOpenLink({url,linkText="Open resource ↗"}:{
 url:string|null;linkText?:string;
}){
 const [notice,setNotice]=useState("");
 const invalidAddressMessage = "This resource\'s link is not a valid web address, so it can\'t be opened.";
 const safe=url?safeProjectExternalHref(url):null;
 if(!url)return <p role="status" className="mt-3 text-sm text-muted-foreground">
  This resource has no link or file attached yet.
 </p>;
 if(!safe)return <p role="alert" className="mt-3 text-sm text-error">
  {invalidAddressMessage}
 </p>;
 function open(){
  const popup=window.open(safe??"","_blank");
  if(popup)popup.opener=null;
  if(!popup){
   setNotice("Your browser blocked the new tab. Allow pop-ups for this site to open resources.");
  }else setNotice("");
 }
 return <div className="mt-3 space-y-2 text-sm">
  <button type="button" onClick={open} className="min-h-10 font-semibold text-primary-text underline">
   {linkText}
  </button>
  {notice?<div role="status" className="rounded-md border border-border p-2 text-body">
   <p>{notice}</p><a href={safe} target="_blank" rel="noopener noreferrer"
    className="mt-1 block break-all font-semibold text-primary-text underline">{safe}</a>
  </div>:null}
 </div>;
}
