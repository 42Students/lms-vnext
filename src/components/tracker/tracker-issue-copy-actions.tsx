"use client";
import { Button } from "@/components/ui/button";
import {useState} from "react";
export function TrackerIssueCopyActions({publicId,description,page}:{publicId:string;description:string;page:string}){
 const [notice,setNotice]=useState("");
 async function copy(value:string){
  try{await navigator.clipboard.writeText(value);setNotice("Copied to clipboard.");}
  catch{setNotice("Could not copy automatically. Select the text and copy it manually.");}
 }
 return <div className="flex flex-wrap items-center gap-3" aria-label="Issue sharing">
   <Button variant="secondary" type="button" onClick={()=>void copy(window.location.href)}>Copy link</Button>
   <Button variant="secondary" type="button" onClick={()=>void copy(
     ["# "+publicId,"","Page: "+page,"",description].join("\n")
   )}>Copy as markdown</Button>
   {notice?<p role="status" className="text-sm text-body">{notice}</p>:null}
 </div>;
}
