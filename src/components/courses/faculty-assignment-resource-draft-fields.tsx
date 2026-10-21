"use client";

import {useState} from "react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Alert} from "@/components/ui/alert";
import type {FacultyAssignmentResourceInput} from "@/modules/courses/faculty-assignment-authoring-model";

type Draft=FacultyAssignmentResourceInput;
type Kind=Draft["kind"];
type Grant={
 method:"PUT";objectKey:string;uploadUrl:string;
 requiredHeaders:Record<string,string>;
};
const allowedTypes=new Set([
 "application/pdf","text/plain","text/csv","image/jpeg","image/png",
 "image/webp","application/msword","application/vnd.ms-excel",
 "application/vnd.ms-powerpoint",
 "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
 "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
 "application/vnd.openxmlformats-officedocument.presentationml.presentation",
 "application/zip",
]);
function blank(kind:Kind):Draft{
 if(kind==="INSTRUCTIONS")return {kind,title:"Instructions",body:""};
 if(kind==="LINK")return {kind,title:"",externalUrl:""};
 return {kind,title:"",privateObjectKey:""};
}
export function FacultyAssignmentResourceDraftFields({
 deliveryId,resources,onChange,disabled,onPendingChange,
}:{
 deliveryId:string;
 resources:readonly Draft[];
 onChange:(resources:Draft[])=>void;
 disabled:boolean;
 onPendingChange:(pending:boolean)=>void;
}){
 const [uploading,setUploading]=useState(false);
 const [message,setMessage]=useState<string|null>(null);
 const [error,setError]=useState<string|null>(null);
 const blocked=disabled||uploading;
 function replace(index:number,draft:Draft){
  setError(null);onChange(resources.map((row,i)=>i===index?draft:row));
 }
 function add(kind:Kind){
  if(blocked||resources.length>=30||
     kind==="INSTRUCTIONS"&&resources.some(row=>row.kind==="INSTRUCTIONS"))return;
  setError(null);onChange([...resources,blank(kind)]);
 }
 function move(index:number,delta:number){
  if(blocked)return;
  const next=[...resources],destination=index+delta;
  if(destination<0||destination>=next.length)return;
  const [item]=next.splice(index,1);
  if(!item)return;
  next.splice(destination,0,item);onChange(next);
 }
 async function upload(index:number,file:File,kind:"PDF"|"FILE"){
  if(blocked)return;
  const mime=file.type.toLowerCase();
  if(!file.size||file.size>50*1024*1024||
      !allowedTypes.has(mime)||(kind==="PDF"&&mime!=="application/pdf")){
   setError("Choose a supported, non-empty "+(kind==="PDF"?"PDF":"file")+
     " no larger than 50 MB.");return;
  }
  setError(null);setMessage(null);setUploading(true);onPendingChange(true);
  try{
   const endpoint="/api/courses/faculty/assignments/"+
     encodeURIComponent(deliveryId)+"/resources";
   const response=await fetch(endpoint,{
    method:"POST",cache:"no-store",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({kind,contentType:mime,sizeBytes:file.size}),
   });
   if(!response.ok)throw new Error(
    response.status===403?"You do not have permission to upload to this Section.":
    "Cannot create private upload. Check your file and try again.");
   const result=await response.json() as {grant?:Grant};
   const grant=result.grant;
   if(!grant||grant.method!=="PUT"||!grant.uploadUrl||
      !grant.requiredHeaders||!grant.objectKey)
    throw new Error("The upload grant is incomplete.");
   const put=await fetch(grant.uploadUrl,{
    method:"PUT",headers:grant.requiredHeaders,body:file,
   });
   if(!put.ok)throw new Error("The file transfer did not complete.");
   onChange(resources.map((row,i)=>i===index&&
    (row.kind==="PDF"||row.kind==="FILE")?
    {...row,privateObjectKey:grant.objectKey}:row));
   setMessage("Private file uploaded. Save after the malware scan completes.");
  }catch(caught){
   setError(caught instanceof Error?caught.message:"Could not upload the file.");
  }finally{setUploading(false);onPendingChange(false);}
 }
 return <fieldset className="mt-4 min-w-0 space-y-3 border-t border-border pt-4">
  <legend className="text-sm font-semibold text-foreground">
   Instructions and resources ({resources.length}/30)
  </legend>
  <p className="text-xs leading-5 text-muted-foreground">
   Add one Instructions block, plus any number of PDF, File or Link entries.
   All file uploads are private and require malware-scan approval.
  </p>
  {resources.map((item,index)=><div key={index}
    className="min-w-0 space-y-3 rounded-[var(--lms-control-radius)] border border-border bg-surface p-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
     <strong className="text-sm">{index+1}. {item.kind==="INSTRUCTIONS"?"Instructions":
       item.kind==="PDF"?"PDF":item.kind==="FILE"?"File":"Link"}</strong>
     <div className="flex flex-wrap gap-2">
      <Button type="button" size="sm" variant="secondary"
       aria-label={"Move resource "+(index+1)+" up"}
       disabled={blocked||index===0} onClick={()=>move(index,-1)}>Up</Button>
      <Button type="button" size="sm" variant="secondary"
       aria-label={"Move resource "+(index+1)+" down"}
       disabled={blocked||index===resources.length-1}
       onClick={()=>move(index,1)}>Down</Button>
      <Button type="button" size="sm" variant="danger" disabled={blocked}
       onClick={()=>onChange(resources.filter((_,i)=>i!==index))}>Remove</Button>
     </div>
    </div>
    <label className="grid gap-[6px] text-[13px] font-semibold">
     Resource title
     <Input maxLength={255} value={item.title} required disabled={blocked}
      onChange={event=>replace(index,{...item,title:event.target.value})}/>
    </label>
    {item.kind==="INSTRUCTIONS"?
     <label className="grid gap-[6px] text-[13px] font-semibold">Instructions
      <Textarea value={item.body} maxLength={10000} rows={4}
       disabled={blocked} onChange={event=>replace(index,{...item,body:event.target.value})}/>
     </label>:
     item.kind==="LINK"?
     <label className="grid gap-[6px] text-[13px] font-semibold">HTTPS Link
      <Input value={item.externalUrl} type="url" maxLength={2048}
       placeholder="https://" disabled={blocked}
       onChange={event=>replace(index,{...item,externalUrl:event.target.value})}/>
     </label>:
     <label className="grid gap-[6px] text-[13px] font-semibold">
      Upload private {item.kind==="PDF"?"PDF":"file"}
      <Input type="file" accept={item.kind==="PDF"?".pdf,application/pdf":undefined}
       disabled={blocked}
       onChange={event=>{
        const file=event.currentTarget.files?.[0];
        if(file)void upload(index,file,item.kind);
        event.currentTarget.value="";
       }}/>
      <span className="text-xs font-normal text-muted-foreground">
       {item.privateObjectKey?"Private file attached (scan verification required)":
        "Choose a file before creating the assignment"}
      </span>
     </label>}
   </div>)}
  <div className="flex flex-wrap gap-2" role="group" aria-label="Add resource type">
   {(["INSTRUCTIONS","PDF","FILE","LINK"] as const).map(kind=>
    <Button key={kind} type="button" size="sm" variant="secondary"
     disabled={blocked||resources.length>=30||
      kind==="INSTRUCTIONS"&&resources.some(row=>row.kind==="INSTRUCTIONS")}
     onClick={()=>add(kind)}>
     Add {kind==="INSTRUCTIONS"?"Instructions":kind==="PDF"?"PDF":kind==="FILE"?"File":"Link"}
    </Button>)}
  </div>
  {uploading?<p role="status" className="text-sm">Uploading private file…</p>:null}
  {error?<Alert tone="error">{error}</Alert>:null}
  {message?<Alert tone="info">{message}</Alert>:null}
 </fieldset>;
}
