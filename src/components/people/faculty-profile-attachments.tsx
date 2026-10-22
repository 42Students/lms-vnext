"use client";
import {useRef,useState} from "react";
import {Button} from "@/components/ui/button";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import type {FacultyProfileDocument} from "@/modules/people/faculty-profile-document";
type Purpose="EDUCATION_CERTIFICATE"|"CERTIFICATION"|"EXPERIENCE_CERTIFICATE"|"OFFER_LETTER";
type Item={purpose:Purpose;entryId:string;label:string;receiptId:string|null};
type Changed={purpose:Purpose;entryId:string;receiptId:string|null;version:number};
const ENDPOINT="/api/people/faculty-self-document/attachments";
export function FacultyProfileAttachments({document,version,pending,onChanged}:{
 document:FacultyProfileDocument;version:number;pending:boolean;
 onChanged:(change:Changed)=>void;
}){
 const [busy,setBusy]=useState(false);
 const mutationRef=useRef(false);
 const [stage,setStage]=useState<"IDLE"|"GRANT"|"TRANSFER"|"SCANNING"|"OPENING">("IDLE");
 const [awaiting,setAwaiting]=useState<{purpose:Purpose;entryId:string;key:string}|null>(null);
 const [link,setLink]=useState<{key:string;url:string;expiresAt:number}|null>(null);
 const [status,setStatus]=useState("");
 const [error,setError]=useState("");
 const [revokeItem,setRevokeItem]=useState<Item|null>(null);
 const locked=pending||busy;
 const items:Item[]=[
  ...document.education.map(row=>({purpose:"EDUCATION_CERTIFICATE" as const,
   entryId:row.id,label:(row.institutionName||"Education")+" · certificate",receiptId:row.certificateDocumentId})),
  ...document.certifications.map(row=>({purpose:"CERTIFICATION" as const,
   entryId:row.id,label:(row.name||"Certification")+" · certificate",receiptId:row.certificateDocumentId})),
  ...document.experiences.flatMap(row=>[
   {purpose:"EXPERIENCE_CERTIFICATE" as const,entryId:row.id,
    label:(row.organization||"Experience")+" · certificate",receiptId:row.experienceCertificateDocumentId},
   {purpose:"OFFER_LETTER" as const,entryId:row.id,
    label:(row.organization||"Experience")+" · offer letter",receiptId:row.offerLetterDocumentId},
  ]),
 ];
 async function upload(item:Item,file:File){
  if(mutationRef.current)return;
  if(locked)return;
  mutationRef.current = true;setBusy(true);setError("");setStatus("");setLink(null);setStage("GRANT");
  try{
   if(!["application/pdf","image/jpeg","image/png","image/webp"].includes(file.type)||
      file.size<1||file.size>10*1024*1024)
    throw Error("Choose a PDF, JPEG, PNG or WebP document up to 10 MB.");
   const response=await fetch(ENDPOINT,{
    method:"POST",headers:{"content-type":"application/json"},credentials:"same-origin",
    body:JSON.stringify({purpose:item.purpose,entryId:item.entryId,
     contentType:file.type,sizeBytes:file.size}),
   });
   if(!response.ok)throw Error("Could not issue an authorized private file grant.");
   const result=await response.json() as {grant:{
    objectKey:string;uploadUrl:string;requiredHeaders:Record<string,string>}};
   setStage("TRANSFER");
   const uploaded=await fetch(result.grant.uploadUrl,{
    method:"PUT",body:file,headers:result.grant.requiredHeaders,credentials:"omit",
   });
   if(!uploaded.ok)throw Error("Transfer did not complete. Choose the file and retry.");
   setStage("SCANNING");
   setAwaiting({purpose:item.purpose,entryId:item.entryId,key:result.grant.objectKey});
   setStatus("Upload finished. Security scanning must finish before the attachment can be saved.");
  }catch(reason){setError(reason instanceof Error?reason.message:"Unable to upload file.");setStage("IDLE");}
  finally{mutationRef.current = false;setBusy(false);}
 }
 async function confirm(){
  if(mutationRef.current)return;
  if(locked||!awaiting)return;
  mutationRef.current = true;setBusy(true);setError("");setStatus("");setStage("SCANNING");
  try{
   const response=await fetch(ENDPOINT,{
    method:"PATCH",headers:{"content-type":"application/json"},
    credentials:"same-origin",body:JSON.stringify({
     purpose:awaiting.purpose,entryId:awaiting.entryId,
     objectKey:awaiting.key,expectedVersion:version,
    }),
   });
   if(!response.ok)throw Error(response.status===409?
    "Profile was changed elsewhere. Refresh before trying again.":
    "Scan still pending or rejected. Try confirming again after security review.");
   const saved=await response.json() as {
    saved:boolean;version:number;purpose:Purpose;entryId:string;receiptId:string};
   if(!saved.saved||!saved.receiptId)throw Error("Save receipt unavailable. Refresh before retrying.");
   onChanged({...saved,receiptId:saved.receiptId});
   setAwaiting(null);setStage("IDLE");setStatus("Private attachment saved.");
  }catch(reason){setError(reason instanceof Error?reason.message:"Save failed.");}
  finally{mutationRef.current = false;setBusy(false);}
 }
 async function open(item:Item){
  if(mutationRef.current)return;
  if(locked||!item.receiptId)return;
  mutationRef.current = true;setBusy(true);setError("");setStatus("");setLink(null);setStage("OPENING");
  try{
   const params=new URLSearchParams({
    purpose:item.purpose,entryId:item.entryId,receiptId:item.receiptId});
   const response=await fetch(ENDPOINT+"?"+params,{
    cache:"no-store",credentials:"same-origin"});
   if(!response.ok)throw Error("The private attachment is unavailable or revoked.");
   const data=await response.json() as {readUrl:string;expiresAt:string};
   const expiresAt=Date.parse(data.expiresAt);
   if(!data.readUrl.startsWith("https://")||!Number.isFinite(expiresAt)||
      expiresAt<=Date.now())throw Error("The signed file link expired. Request another.");
   setLink({key:item.purpose+":"+item.entryId,url:data.readUrl,expiresAt});
   setStatus("Signed read link is available for five minutes.");
  }catch(reason){setError(reason instanceof Error?reason.message:"Read unavailable.");}
  finally{mutationRef.current = false;setBusy(false);setStage("IDLE");}
 }
 async function revoke(item:Item){
  if(mutationRef.current)return;
  if(locked||!item.receiptId)return;
  setRevokeItem(null);
  mutationRef.current = true;setBusy(true);setError("");setLink(null);
  try{
   const response=await fetch(ENDPOINT,{
    method:"DELETE",credentials:"same-origin",headers:{"content-type":"application/json"},
    body:JSON.stringify({purpose:item.purpose,entryId:item.entryId,
     expectedVersion:version}),
   });
   if(!response.ok)throw Error("Could not revoke this attachment. Refresh and retry.");
   const saved=await response.json() as {saved:boolean;version:number};
   if(!saved.saved)throw Error("The evidence was already changed. Refresh the profile.");
   onChanged({purpose:item.purpose,entryId:item.entryId,
    receiptId:null,version:saved.version});
   setStatus("Private attachment removed from your active profile.");
  }catch(reason){setError(reason instanceof Error?reason.message:"Removal failed.");}
  finally{mutationRef.current = false;setBusy(false);}
 }
 return <section aria-label="Faculty private qualification attachments"
   className="space-y-3 rounded-[var(--lms-control-radius)] border border-border p-4">
  <h2 className="text-base font-semibold">Private qualification attachments</h2>
  <p className="text-xs text-muted-foreground">
   Save an education, certification or experience row before attaching its document.
   Files stay private and require a security scan. Replacing or removing an
   attachment revokes the previous file; historical audit records are retained.
  </p>
  {items.length===0?<p className="text-sm text-muted-foreground">Add and save a qualification or experience before uploading files.</p>:null}
  {items.map(item=><div key={item.purpose+":"+item.entryId}
    className="space-y-2 border-t border-border pt-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
     <strong className="text-sm">{item.label}</strong>
     <span className="text-xs">{item.receiptId?"On file":"Not uploaded"}</span>
    </div>
    <label className="block text-xs font-medium">Upload or replace
     <input type="file" disabled={locked} accept="application/pdf,image/png,image/jpeg,image/webp"
      className="mt-1 block max-w-full text-xs"
      onChange={event=>{
       const file=event.currentTarget.files?.[0];
       if(file)void upload(item,file);
       event.currentTarget.value="";
      }}/>
    </label>
    {item.receiptId?<div className="flex flex-wrap gap-2">
      <Button type="button" variant="secondary" disabled={locked}
       onClick={()=>void open(item)}>Request private link</Button>
      <Button type="button" variant="danger" disabled={locked}
       onClick={()=>setRevokeItem(item)}>Remove</Button>
     </div>:null}
    {link?.key===item.purpose+":"+item.entryId&&link.expiresAt>Date.now()?
     <a href={link.url} rel="noopener noreferrer"
      className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline">
      Open verified attachment (expires soon)
     </a>:null}
   </div>)}
  {awaiting?<Button type="button" variant="secondary" disabled={locked}
    onClick={()=>void confirm()}>Confirm uploaded attachment after scan</Button>:null}
  {stage!=="IDLE"&&busy?<p role="status" className="text-sm">
    {stage==="GRANT"?"Requesting private upload…":stage==="TRANSFER"?"Uploading document…":
     stage==="SCANNING"?"Checking file…":"Preparing private link…"}
   </p>:null}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {status?<p role="status" className="text-xs text-muted-foreground">{status}</p>:null}
  <ConfirmDialog open={revokeItem!==null}
   onOpenChange={open=>{if(!open)setRevokeItem(null);}}
   title="Remove private attachment?"
   description="Remove this private attachment? Records and audit history remain."
   confirmLabel="Remove" pending={busy}
   onConfirm={()=>{if(revokeItem)void revoke(revokeItem);}}/>
 </section>;
}
