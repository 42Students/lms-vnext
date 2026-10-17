"use client";
import {useState} from "react";
export function TrackerIssueCopyActions({publicId,description,page}:{publicId:string;description:string;page:string}){
 const [notice,setNotice]=useState("");
 async function copy(value:string){
  try{await navigator.clipboard.writeText(value);setNotice("Copied to clipboard.");}
  catch{setNotice("Could not copy automatically. Select the text and copy it manually.");}
 }
 const button="inline-flex min-h-10 items-center rounded border border-border bg-surface px-3 text-sm font-semibold text-primary-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";
 return <div className="flex flex-wrap items-center gap-3" aria-label="Issue sharing">
   <button type="button" className={button} onClick={()=>void copy(window.location.href)}>Copy link</button>
   <button type="button" className={button} onClick={()=>void copy(
     ["# "+publicId,"","Page: "+page,"",description].join("\n")
   )}>Copy as markdown</button>
   {notice?<p role="status" className="text-sm text-body">{notice}</p>:null}
 </div>;
}
