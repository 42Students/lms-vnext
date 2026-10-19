import { Badge } from "@/components/ui/badge";
"use client";
import { Badge } from "@/components/ui/badge";

import {useEffect,useState} from "react";

type Link={id:string;kind:string;url:string;caption:string;sequence:number};
function safeHref(value:string){
 try{
  const url=new URL(value);
  return url.protocol==="https:"&&!url.username&&!url.password?url.toString():null;
 }catch{return null;}
}
/** Same authenticated audience as submission-file download. No signed URLs persisted. */
export function AssignmentSubmissionLinks({submissionId}:{submissionId:string}){
 const [links,setLinks]=useState<Link[]>([]);
 const [error,setError]=useState<string|null>(null);
 const [prevSubmissionId,setPrevSubmissionId]=useState(submissionId);
 if(prevSubmissionId!==submissionId){setPrevSubmissionId(submissionId);setLinks([]);setError(null);}
 useEffect(()=>{
  const abort=new AbortController();
  void (async()=>{
   try{
    const response=await fetch("/api/courses/assignment-submissions/"+
     encodeURIComponent(submissionId)+"/links",{cache:"no-store",signal:abort.signal});
    if(!response.ok)throw new Error("Could not load submitted links.");
    const raw:unknown=await response.json();
    const data=raw&&typeof raw==="object"&&"links" in raw?
     (raw as {links:unknown}).links:null;
    if(!Array.isArray(data))throw new Error("Unexpected submitted-link response.");
    if(!abort.signal.aborted)setLinks(data.filter((item):item is Link=>
      Boolean(item&&typeof item.id==="string"&&typeof item.url==="string"&&
       typeof item.kind==="string"&&typeof item.caption==="string"&&
       typeof item.sequence==="number")));
   }catch(cause){if(!abort.signal.aborted)setError(cause instanceof Error?cause.message:"Could not load links.");}
  })();
  return ()=>abort.abort();
 },[submissionId]);
 if(error)return <p role="alert" className="text-sm text-error">{error}</p>;
 if(!links.length)return null;
 return <section aria-label="Submitted repository and website links" className="space-y-2">
  <h4 className="text-sm font-semibold">Submitted links</h4>
  <ul className="space-y-1">
   {links.map(link=><li key={link.id} className="text-sm">
    {safeHref(link.url)?<a href={safeHref(link.url)!} target="_blank"
      rel="noopener noreferrer" className="break-all text-primary-text underline">
      {link.caption||link.url}
    </a>:<span>Link unavailable</span>}
    <Badge tone="neutral" className="ml-2">
      {link.kind==="REPOSITORY_LINK"?"Repository":"Website"}
    </Badge>
   </li>)}
  </ul>
 </section>;
}
