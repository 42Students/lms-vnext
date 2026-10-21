"use client";
import {useState} from "react";
import {Button} from "@/components/ui/button";
import {Alert} from "@/components/ui/alert";

export function LearnerAssignmentResourceOpenControl({
 assignmentId,deliveryId,resourceId,kind,
}:{assignmentId:string;deliveryId:string;resourceId:string;kind:"PDF"|"FILE"}){
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState<string|null>(null);
 async function open(){
  if(loading)return;
  setLoading(true);setError(null);
  try{
   const path="/api/courses/deliveries/"+encodeURIComponent(deliveryId)+
    "/assignments/"+encodeURIComponent(assignmentId)+
    "/resources/"+encodeURIComponent(resourceId)+"/url";
   const response=await fetch(path,{cache:"no-store",credentials:"same-origin"});
   if(!response.ok)throw new Error(response.status===409?
    "The file is still being checked. Try again.":response.status===503?
    "Private file storage is temporarily unavailable.":
    "You cannot open this resource right now.");
   const payload:unknown=await response.json();
   const readUrl=payload&&typeof payload==="object"&&
    "readUrl" in payload?payload.readUrl:null;
   if(typeof readUrl!=="string")throw new Error("Could not verify the file link.");
   const target=new URL(readUrl);
   if(target.protocol!=="https:"||target.username||target.password)
    throw new Error("This file link is not secure.");
   window.location.assign(target.href);
  }catch(caught){
   setError(caught instanceof Error?caught.message:"Could not open resource.");
  }finally{setLoading(false);}
 }
 return <span className="inline-flex flex-col items-start gap-2">
  <Button size="sm" type="button" variant="secondary" loading={loading}
   onClick={()=>void open()}>
   {loading?"Preparing file…":kind==="PDF"?"Open PDF":"Open file"}
  </Button>
  {error?<Alert tone="error">{error}</Alert>:null}
 </span>;
}
