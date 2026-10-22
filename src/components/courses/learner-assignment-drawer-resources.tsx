"use client";
import {useEffect,useState} from "react";
import {Alert} from "@/components/ui/alert";
import {Button} from "@/components/ui/button";
import {ThirdPartyLink} from "@/components/ui/third-party-link";
import {LearnerAssignmentResourceOpenControl} from "./learner-assignment-resource-open-control";

type Resource={
 id:string;kind:"INSTRUCTIONS"|"PDF"|"FILE"|"LINK";
 title:string;body:string|null;href:string|null;position:number;
};
type MaterialLink={id:string;title:string;href:string};
type ResponseData={
 resources:{available:boolean;items:Resource[]};
 materials:{available:boolean;links:MaterialLink[]};
};

function safeHttps(raw:string|null|undefined):string|null{
 if(!raw||raw!==raw.trim()||/[\\\x00-\x1f\x7f]/.test(raw))return null;
 try{
  const url=new URL(raw);
  return url.protocol==="https:"&&!url.username&&!url.password?url.href:null;
 }catch{return null;}
}
function isResource(value:unknown):value is Resource{
 if(!value||typeof value!=="object")return false;
 const item=value as Partial<Resource>;
 return typeof item.id==="string"&&typeof item.title==="string"&&
  (item.kind==="INSTRUCTIONS"||item.kind==="PDF"||item.kind==="FILE"||item.kind==="LINK")&&
  (item.body===null||typeof item.body==="string")&&
  (item.href===null||typeof item.href==="string")&&typeof item.position==="number";
}
function isLink(value:unknown):value is MaterialLink{
 if(!value||typeof value!=="object")return false;
 const item=value as Partial<MaterialLink>;
 return typeof item.id==="string"&&typeof item.title==="string"&&typeof item.href==="string";
}
function isPayload(value:unknown):value is ResponseData{
 if(!value||typeof value!=="object")return false;
 const data=value as Partial<ResponseData>;
 return typeof data.resources?.available==="boolean"&&
  Array.isArray(data.resources.items)&&data.resources.items.every(isResource)&&
  typeof data.materials?.available==="boolean"&&
  Array.isArray(data.materials.links)&&data.materials.links.every(isLink);
}

/** Loaded only when the learner opens an assignment, not once per list row. */
export function LearnerAssignmentDrawerResources({
 assignmentId,deliveryId,
}:{assignmentId:string;deliveryId:string}){
 const [result,setResult]=useState<ResponseData|null>(null);
 const [error,setError]=useState<string|null>(null);
 const [loading,setLoading]=useState(true);
 const [attempt,setAttempt]=useState(0);
 useEffect(()=>{
  const controller=new AbortController();
  const url="/api/courses/deliveries/"+encodeURIComponent(deliveryId)+
   "/assignments/"+encodeURIComponent(assignmentId)+"/resources";
  void fetch(url,{cache:"no-store",credentials:"same-origin",signal:controller.signal})
   .then(async response=>{
    if(!response.ok)throw new Error(response.status===403?
     "You no longer have access to these assignment resources.":
     "Assignment resources could not be loaded.");
    const data:unknown=await response.json();
    if(!isPayload(data))throw new Error("Assignment resources returned an invalid response.");
    return data;
   }).then(data=>{
    if(controller.signal.aborted)return;
    setResult(data);setError(null);setLoading(false);
   }).catch(caught=>{
    if(controller.signal.aborted)return;
    setError(caught instanceof Error?caught.message:"Assignment resources could not be loaded.");
    setLoading(false);
   });
  return ()=>controller.abort();
 },[assignmentId,deliveryId,attempt]);
 const retry=()=>{
  setError(null);setResult(null);setLoading(true);setAttempt(value=>value+1);
 };
 if(loading)return <p role="status" className="text-sm text-muted-foreground">
  Loading instructor resources…
 </p>;
 if(error)return <Alert tone="error" role="alert">
  {error} <Button type="button" variant="secondary" className="ml-2 min-h-11 md:min-h-9"
   onClick={retry}>Retry resources</Button>
 </Alert>;
 if(!result)return null;
 const items=result.resources.items;
 const links=result.materials.links;
 return <div className="min-w-0 space-y-3" aria-label="Instructor resource files and links">
  {!result.resources.available||!result.materials.available?
   <Alert tone="warning" role="status">
    Some instructor resources are temporarily unavailable. Refresh to try again.
   </Alert>:null}
  {items.map(item=><article key={item.id}
   className="min-w-0 rounded-[var(--lms-control-radius)] border border-border p-3">
   <div className="flex flex-wrap items-center justify-between gap-3">
    <div className="min-w-0">
     <strong className="block break-words text-sm text-foreground">
      <span aria-hidden="true">{item.kind==="PDF"?"▣":item.kind==="LINK"?"↗":"▤"} </span>
      {item.title}
     </strong>
     <span className="text-xs text-muted-foreground">
      {item.kind==="INSTRUCTIONS"?"Instructions":item.kind==="PDF"?"PDF":item.kind==="FILE"?"File":"Link"}
     </span>
    </div>
    {item.kind==="LINK"&&safeHttps(item.href)?
     <ThirdPartyLink href={safeHttps(item.href)!} label="Open link"/>:null}
    {(item.kind==="PDF"||item.kind==="FILE")?
     <LearnerAssignmentResourceOpenControl assignmentId={assignmentId}
      deliveryId={deliveryId} resourceId={item.id} kind={item.kind}/>:null}
   </div>
   {item.kind==="INSTRUCTIONS"&&item.body?
    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-body">{item.body}</p>:null}
  </article>)}
  {links.map(link=><article key={link.id}
   className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-[var(--lms-control-radius)] border border-border p-3">
   <div className="min-w-0">
    <strong className="block break-words text-sm text-foreground"><span aria-hidden="true">↗ </span>{link.title}</strong>
    <span className="text-xs text-muted-foreground">Link</span>
   </div>
   {safeHttps(link.href)?<ThirdPartyLink href={safeHttps(link.href)!} label="Open link"/>:
    <span className="text-xs text-muted-foreground">Link unavailable</span>}
  </article>)}
  {!items.length&&!links.length&&result.resources.available&&result.materials.available?
   <p className="text-sm text-muted-foreground">No additional resource files or links were provided.</p>:null}
 </div>;
}
