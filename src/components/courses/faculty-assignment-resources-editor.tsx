"use client";

import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Drawer} from "@/components/ui/drawer";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Alert} from "@/components/ui/alert";
import {
 facultyAssignmentResourcesSchema,type FacultyAssignmentResourceInput,
} from "@/modules/courses/faculty-assignment-authoring-model";

type Resource=FacultyAssignmentResourceInput;
type ResourceKind=Resource["kind"];
type ServerRow={
 id:string;kind:string;title:string;body:string|null;
 externalUrl:string|null;privateObjectKey:string|null;position:number;
};
type Assignment={
 id:string;title:string;description:string|null;
 dueAt:Date|string|null;maxPoints:number;updatedAt:Date|string;
 status:string;
};
type Grant={
 uploadUrl:string;objectKey:string;method:"PUT";
 requiredHeaders:Record<string,string>;
};
const acceptedFileTypes=new Set([
 "application/pdf","text/plain","text/csv","image/jpeg","image/png",
 "image/webp","application/msword",
 "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
 "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
 "application/vnd.ms-excel","application/vnd.ms-powerpoint",
 "application/vnd.openxmlformats-officedocument.presentationml.presentation",
 "application/zip",
]);

function rowToResource(row:ServerRow):Resource{
 if(row.kind==="INSTRUCTIONS")
  return {kind:"INSTRUCTIONS",title:row.title,body:row.body??""};
 if(row.kind==="LINK")
  return {kind:"LINK",title:row.title,externalUrl:row.externalUrl??""};
 if((row.kind==="PDF"||row.kind==="FILE")&&row.privateObjectKey)
  return {kind:row.kind,title:row.title,privateObjectKey:row.privateObjectKey};
 throw new Error("An assignment resource is incomplete. Reload before editing.");
}
function startResource(kind:ResourceKind):Resource{
 if(kind==="INSTRUCTIONS")return {kind,title:"Instructions",body:""};
 if(kind==="LINK")return {kind,title:"",externalUrl:""};
 return {kind,title:"",privateObjectKey:""};
}
async function responseError(response:Response,fallback:string):Promise<string>{
 const raw:unknown=await response.json().catch(()=>null);
 if(raw&&typeof raw==="object"){
  const item=raw as Record<string,unknown>;
  if(typeof item.message==="string"&&item.message)return item.message;
  if(item.error==="ASSIGNMENT_HAS_SUBMISSIONS")
   return "Learner submissions exist. Resources are locked; only the assignment title can change.";
  if(item.error==="FACULTY_ASSIGNMENT_STALE_VERSION")
   return "This assignment was updated elsewhere. Reload it before saving resources.";
  if(typeof item.error==="string"&&item.error)return fallback+" ("+item.error+")";
 }
 return fallback;
}

/** Legacy Assignment builder: one Instructions plus repeatable PDF, File and
 * Link resources. Saves through the scoped faculty CAS endpoint. Uploaded files
 * remain private and are accepted only after scanner CLEAN attestation. */
export function FacultyAssignmentResourcesEditor({
 assignment,deliveryId,
}:{assignment:Assignment;deliveryId:string}){
 const router=useRouter();
 const [open,setOpen]=useState(false);
 const [drafts,setDrafts]=useState<Resource[]>([]);
 const [snapshot,setSnapshot]=useState("[]");
 const [loading,setLoading]=useState(false);
 const [loaded,setLoaded]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState<string|null>(null);
 const [notice,setNotice]=useState<string|null>(null);
 const [confirm,setConfirm]=useState<"SAVE"|"DISCARD"|null>(null);
 const endpoint="/api/courses/faculty/assignments/"+
  encodeURIComponent(deliveryId)+"/resources";
 const commandEndpoint="/api/courses/faculty/assignments/"+
  encodeURIComponent(deliveryId)+"/command";
 const dirty=JSON.stringify(drafts)!==snapshot;
 const editable=assignment.status==="DRAFT"||assignment.status==="PUBLISHED";

 useEffect(()=>{
  if(!open)return;
  const controller=new AbortController();
  setLoading(true);setLoaded(false);setError(null);setNotice(null);
  void (async()=>{
   const response=await fetch(endpoint+"?assignmentId="+encodeURIComponent(assignment.id),
    {signal:controller.signal,cache:"no-store"});
   if(!response.ok)throw new Error(
    await responseError(response,"Could not load assignment resources."));
   const payload:unknown=await response.json();
   if(!payload||typeof payload!=="object"||!("items" in payload)||
     !Array.isArray(payload.items))
    throw new Error("The resource list could not be verified.");
   const list=(payload.items as ServerRow[]).map(rowToResource);
   const parsed=facultyAssignmentResourcesSchema.safeParse(list);
   if(!parsed.success)throw new Error("The resource list has invalid data.");
   if(controller.signal.aborted)return;
   setDrafts(parsed.data);setSnapshot(JSON.stringify(parsed.data));setLoaded(true);
  })().catch(caught=>{
   if(!controller.signal.aborted){setLoaded(false);setError(
    caught instanceof Error?caught.message:"Could not load resources.");}
  }).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return ()=>controller.abort();
 },[open,endpoint,assignment.id]);

 function change(index:number,item:Resource){
  setError(null);
  setDrafts(items=>items.map((old,i)=>i===index?item:old));
 }
 function add(kind:ResourceKind){
  if(busy||loading||drafts.length>=30||
    (kind==="INSTRUCTIONS"&&drafts.some(item=>item.kind===kind)))return;
  setError(null);setDrafts(items=>[...items,startResource(kind)]);
 }
 function remove(index:number){
  if(busy)return;
  setError(null);setDrafts(items=>items.filter((_,i)=>i!==index));
 }
 function move(index:number,offset:number){
  if(busy)return;
  setDrafts(items=>{
   const next=[...items],to=index+offset;
   if(to<0||to>=next.length)return items;
   const item=next[index];
   if(!item)return items;
   next.splice(index,1);next.splice(to,0,item);
   return next;
  });
 }

 async function upload(index:number,file:File,kind:"PDF"|"FILE"){
  if(busy||!editable)return;
  if(!file.size||file.size>50*1024*1024){
   setError("Choose a non-empty file of 50 MB or less.");return;
  }
  const mime=file.type.toLowerCase();
  if(!acceptedFileTypes.has(mime)||(kind==="PDF"&&mime!=="application/pdf")){
   setError(kind==="PDF"?"Choose a PDF file.":"This file type is not supported.");return;
  }
  setBusy(true);setError(null);setNotice(null);
  try{
   const response=await fetch(endpoint,{
    method:"POST",headers:{"Content-Type":"application/json"},cache:"no-store",
    body:JSON.stringify({kind,sizeBytes:file.size,contentType:mime}),
   });
   if(!response.ok)throw new Error(
    await responseError(response,"Could not prepare the private file upload."));
   const payload=await response.json() as {grant?:Grant};
   const grant=payload.grant;
   if(!grant||grant.method!=="PUT"||!grant.uploadUrl||!grant.objectKey||
      !grant.requiredHeaders)throw new Error("Private upload grant is incomplete.");
   const put=await fetch(grant.uploadUrl,{
    method:"PUT",headers:grant.requiredHeaders,body:file,
   });
   if(!put.ok)throw new Error("The private upload did not complete. Try again.");
   setDrafts(items=>items.map((item,i)=>
    i===index&&(item.kind==="PDF"||item.kind==="FILE")
      ?{...item,privateObjectKey:grant.objectKey}:item));
   setNotice("File uploaded privately. Scanner verification must finish before Save.");
  }catch(caught){
   setError(caught instanceof Error?caught.message:"File upload failed.");
  }finally{setBusy(false);}
 }

 async function save(){
  if(busy||loading||!editable)return;
  const parsed=facultyAssignmentResourcesSchema.safeParse(drafts);
  if(!parsed.success){
   setError(parsed.error.issues[0]?.message??"Check the resource fields.");return;
  }
  if(JSON.stringify(parsed.data)===snapshot){setOpen(false);return;}
  const due=assignment.dueAt?new Date(assignment.dueAt):null;
  const version=new Date(assignment.updatedAt);
  if((due&&!Number.isFinite(due.getTime()))||!Number.isFinite(version.getTime())){
   setError("The assignment version is invalid. Refresh before editing.");return;
  }
  setBusy(true);setError(null);
  try{
   const response=await fetch(commandEndpoint,{
    method:"POST",headers:{"Content-Type":"application/json"},cache:"no-store",
    body:JSON.stringify({
     action:"EDIT",assignmentId:assignment.id,
     title:assignment.title,description:assignment.description,
     dueAt:due?.toISOString()??null,maxPoints:assignment.maxPoints,
     resources:parsed.data,expectedUpdatedAt:version.toISOString(),confirmed:true,
    }),
   });
   if(!response.ok)throw new Error(
    await responseError(response,"Could not save assignment resources."));
   const payload:unknown=await response.json();
   const saved=payload&&typeof payload==="object"&&"assignment" in payload
    ?payload.assignment:null;
   if(!saved||typeof saved!=="object"||!("id" in saved)||
     saved.id!==assignment.id)
    throw new Error("The save receipt could not be verified. Refresh before retrying.");
   setSnapshot(JSON.stringify(parsed.data));
   setNotice("Assignment resources saved.");
   setOpen(false);router.refresh();
  }catch(caught){
   setError(caught instanceof Error?caught.message:"Could not save resources.");
  }finally{setBusy(false);}
 }
 function requestClose(next:boolean){
  if(next||busy){if(next&&!busy)setOpen(true);return;}
  if(dirty){setConfirm("DISCARD");return;}
  setOpen(false);
 }

 return <>
  <Button size="md" variant="secondary" type="button" disabled={!editable}
   onClick={()=>{setOpen(true);setConfirm(null);}}>
   Instructions &amp; resources
  </Button>
  <Drawer open={open} onOpenChange={requestClose}
   title="Assignment instructions & resources"
   description="Add one Instructions block, plus PDF, File or Link resources. Files stay private until verified."
   footer={<Button type="button" disabled={loading||!loaded||busy||!editable||!dirty}
     loading={busy} onClick={()=>setConfirm("SAVE")}>
     Save resources
   </Button>}>
   <div className="space-y-4">
    {loading?<p role="status" className="text-sm">Loading resources…</p>:null}
    {!loading&&loaded?<div className="space-y-3">
     <p className="text-sm text-muted-foreground">
      {drafts.length} of 30 resources · Only one Instructions block is allowed.
     </p>
     {drafts.map((item,index)=>
      <section key={index} aria-label={item.kind+" resource "+(index+1)}
       className="space-y-3 rounded-[var(--lms-control-radius)] border border-border bg-surface p-3">
       <div className="flex flex-wrap items-center justify-between gap-2">
        <strong className="text-sm">{index+1}. {item.kind==="INSTRUCTIONS"?
         "Instructions":item.kind==="LINK"?"Link":item.kind==="PDF"?"PDF":"File"}</strong>
        <div className="flex flex-wrap gap-2">
         <Button type="button" variant="secondary" size="sm"
          disabled={busy||index===0} onClick={()=>move(index,-1)}
          aria-label={"Move resource "+(index+1)+" up"}>Up</Button>
         <Button type="button" variant="secondary" size="sm"
          disabled={busy||index===drafts.length-1} onClick={()=>move(index,1)}
          aria-label={"Move resource "+(index+1)+" down"}>Down</Button>
         <Button type="button" variant="danger" size="sm" disabled={busy}
          onClick={()=>remove(index)}>Remove</Button>
        </div>
       </div>
       <label className="grid gap-[6px] text-[13px] font-semibold">Resource title
        <Input maxLength={255} required disabled={busy} value={item.title}
         onChange={event=>change(index,{...item,title:event.target.value})}/>
       </label>
       {item.kind==="INSTRUCTIONS"?
        <label className="grid gap-[6px] text-[13px] font-semibold">Instructions
         <Textarea rows={5} maxLength={10000} required disabled={busy}
          value={item.body}
          onChange={event=>change(index,{...item,body:event.target.value})}/>
        </label>:
        item.kind==="LINK"?
        <label className="grid gap-[6px] text-[13px] font-semibold">HTTPS link
         <Input type="url" maxLength={2048} required disabled={busy}
          placeholder="https://" value={item.externalUrl}
          onChange={event=>change(index,{...item,externalUrl:event.target.value})}/>
        </label>:
        <label className="grid gap-[6px] text-[13px] font-semibold">Private {item.kind==="PDF"?"PDF":"file"}
         <Input type="file" disabled={busy} accept={item.kind==="PDF"?
          ".pdf,application/pdf":undefined}
          onChange={event=>{
           const file=event.currentTarget.files?.[0];
           if(file)void upload(index,file,item.kind);
           event.currentTarget.value="";
          }}/>
         <span className="text-xs font-normal text-muted-foreground">
          {item.privateObjectKey?
           "Private upload attached. File access requires malware-scan verification.":
           "Select a file to upload before saving."}
         </span>
        </label>}
      </section>)}
     {drafts.length===0?<p className="text-sm text-muted-foreground">
      No instructions or resources yet.</p>:null}
     <div className="flex flex-wrap gap-2" role="group" aria-label="Add assignment resource">
      {(["INSTRUCTIONS","PDF","FILE","LINK"] as const).map(kind=>
       <Button key={kind} type="button" variant="secondary" size="sm"
        disabled={busy||drafts.length>=30||
         (kind==="INSTRUCTIONS"&&drafts.some(row=>row.kind==="INSTRUCTIONS"))}
        onClick={()=>add(kind)}>
        Add {kind==="INSTRUCTIONS"?"Instructions":kind==="PDF"?"PDF":kind==="FILE"?"File":"Link"}
       </Button>)}
     </div>
     <p className="text-xs text-muted-foreground">
      Existing learner submissions lock resource changes. A saved PDF or File is not public;
      only a clean, verified object can be included in an assignment.
     </p>
    </div>:null}
    {error?<Alert tone="error">{error}</Alert>:null}
    {notice?<Alert tone="info">{notice}</Alert>:null}
   </div>
  </Drawer>
  <ConfirmDialog open={confirm!==null}
   onOpenChange={next=>{if(!next&&!busy)setConfirm(null);}}
   title={confirm==="SAVE"?"Save assignment resources?":"Discard resource edits?"}
   description={confirm==="SAVE"?
    "This changes the assignment for its current Section. Existing learner submissions remain protected.":
    "Your unsaved resource edits and any unattached private uploads will not be published."}
   confirmLabel={confirm==="SAVE"?"Save resources":"Discard changes"}
   confirmVariant={confirm==="SAVE"?"primary":"danger"} pending={busy}
   onConfirm={()=>{
    const action=confirm;setConfirm(null);
    if(action==="SAVE")void save();
    else if(action==="DISCARD")setOpen(false);
   }}/>
 </>;
}
