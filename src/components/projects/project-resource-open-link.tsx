"use client";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Banner } from "@/components/ui/banner";
import {useState} from "react";
import {safeProjectExternalHref} from "@/modules/projects/mentor-workspace-evidence-model";

/** Learner resource opening must never render an unsafe URL or silently fail on a blocked popup. */
export function ProjectResourceOpenLink({url,linkText="Open resource ↗"}:{
 url:string|null;linkText?:string;
}){
 const [notice,setNotice]=useState("");
 const invalidAddressMessage = "This resource has an invalid address.";
 const safe=url?safeProjectExternalHref(url):null;
 if(!url)return <Alert tone="info" className="mt-3">This resource has no link or file attached yet.</Alert>;
 if(!safe)return <Alert tone="error" className="mt-3">{invalidAddressMessage}</Alert>;
 function open(){
  const popup=window.open(safe??"","_blank");
  if(popup)popup.opener=null;
  if(!popup){
   setNotice("Your browser blocked the new tab. Allow pop-ups for this site to open resources, or use the safe link below.");
  }else setNotice("");
 }
 return <div className="mt-3 space-y-2 text-sm">
  <Button variant="ghost" type="button" onClick={open} className="text-link underline">
   {linkText}
  </Button>
  {notice?<Banner tone="warning" action={<a href={safe} target="_blank" rel="noopener noreferrer"
    className="inline-flex min-h-11 max-w-full items-center break-all font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Open safe link</a>}>
   {notice}
  </Banner>:null}
 </div>;
}
