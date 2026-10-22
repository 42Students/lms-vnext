"use client";
import {useRef,useState} from "react";
import {Button} from "@/components/ui/button";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
type Purpose="AADHAAR"|"PAN";
type Grant={objectKey:string;uploadUrl:string;requiredHeaders:Record<string,string>};
type Saved={saved:boolean;version:number;receiptId:string;kind:Purpose};
export function FacultyIdentityEvidenceEditor({
 aadhaarReceiptId,panReceiptId,version,pending,onSaved,onRevoked,
}:{
 aadhaarReceiptId:string|null;panReceiptId:string|null;version:number;
 pending:boolean;
 onSaved:(value:Saved)=>void;
 onRevoked:(value:{kind:Purpose;version:number})=>void;
}){
 const [busy,setBusy]=useState(false);
 const mutationRef=useRef(false);
 const [revokeKind,setRevokeKind]=useState<Purpose|null>(null);
 const [checking,setChecking]=useState<{kind:Purpose;key:string}|null>(null);
 const [message,setMessage]=useState("");
 const [error,setError]=useState("");
 const [readLink,setReadLink]=useState<{kind:Purpose;href:string;expiresAt:number}|null>(null);
 const blocked=busy||pending;
 async function begin(kind:Purpose,file:File){
  if(mutationRef.current)return;
  if(blocked)return;
  mutationRef.current = true;
  setBusy(true);setError("");setMessage("");setReadLink(null);
  try{
   if(!["application/pdf","image/png","image/jpeg","image/webp"].includes(file.type)||
      file.size<1||file.size>10*1024*1024)
    throw Error("Select a PDF, PNG, JPEG or WebP document up to 10 MB.");
   const response=await fetch("/api/people/faculty-self-document/identity",{
    method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},
    body:JSON.stringify({kind,contentType:file.type,sizeBytes:file.size}),
   });
   if(!response.ok)throw Error("Private upload is unavailable. Try again later.");
   const data=await response.json() as {grant:Grant};
   const sent=await fetch(data.grant.uploadUrl,{
    method:"PUT",headers:data.grant.requiredHeaders,body:file,credentials:"omit",
   });
   if(!sent.ok)throw Error("The file transfer failed. Choose the file again.");
   setChecking({kind,key:data.grant.objectKey});
   setMessage("Checking file. A clean security scan is required before this evidence is saved.");
  }catch(cause){setError(cause instanceof Error?cause.message:"Upload failed.");}
  finally{mutationRef.current = false;setBusy(false);}
 }
 async function finish(){
  if(mutationRef.current)return;
  if(blocked||!checking)return;
  mutationRef.current = true;
  setBusy(true);setError("");setMessage("");
  try{
   const response=await fetch("/api/people/faculty-self-document/identity",{
    method:"PATCH",credentials:"same-origin",headers:{"content-type":"application/json"},
    body:JSON.stringify({kind:checking.kind,objectKey:checking.key,expectedVersion:version}),
   });
   if(!response.ok)throw Error(response.status===409
    ?"The profile changed. Refresh the profile before retrying."
    :"Checking file is not complete. Retry confirmation after scanning finishes.");
   const result=await response.json() as Saved;
   if(!result.saved||result.kind!==checking.kind||!result.receiptId)
    throw Error("Save confirmation could not be verified. Refresh the profile.");
   onSaved(result);setChecking(null);setMessage("Private evidence saved successfully.");
  }catch(cause){setError(cause instanceof Error?cause.message:"Save unavailable.");}
  finally{mutationRef.current = false;setBusy(false);}
 }
 async function open(kind:Purpose,receiptId:string){
  if(mutationRef.current)return;
  if(blocked)return;
  mutationRef.current = true;
  setBusy(true);setError("");setReadLink(null);
  try{
   const query=new URLSearchParams({kind,receiptId});
   const response=await fetch("/api/people/faculty-self-document/identity?"+query,{
    credentials:"same-origin",cache:"no-store",
   });
   if(!response.ok)throw Error("Document could not be opened. Check that it is still verified.");
   const result=await response.json() as {readUrl:string;expiresAt:string};
   const expiresAt=Date.parse(result.expiresAt);
   if(!result.readUrl.startsWith("https://")||!Number.isFinite(expiresAt)||
      expiresAt<=Date.now())throw Error("The download link expired. Request another.");
   setReadLink({kind,href:result.readUrl,expiresAt});
   setMessage("A private document link is available for five minutes.");
  }catch(cause){setError(cause instanceof Error?cause.message:"Document unavailable.");}
  finally{mutationRef.current = false;setBusy(false);}
 }
 async function revoke(kind:Purpose){
  if(mutationRef.current)return;
  if(blocked)return;
  mutationRef.current = true;
  setBusy(true);setError("");setReadLink(null);
  try{
   const response=await fetch("/api/people/faculty-self-document/identity",{
    method:"DELETE",credentials:"same-origin",headers:{"content-type":"application/json"},
    body:JSON.stringify({kind,expectedVersion:version}),
   });
   if(!response.ok)throw Error("Evidence could not be removed. Refresh the profile.");
   const result=await response.json() as {saved:boolean;version:number};
   if(!result.saved)throw Error("The evidence is not current. Refresh the profile.");
   onRevoked({kind,version:result.version});setMessage("Private evidence access removed.");setRevokeKind(null);
  }catch(cause){setError(cause instanceof Error?cause.message:"Removal unavailable.");}
  finally{mutationRef.current = false;setBusy(false);}
 }
 const entries=[{kind:"AADHAAR" as const,label:"Aadhaar evidence",id:aadhaarReceiptId},
   {kind:"PAN" as const,label:"PAN evidence",id:panReceiptId}];
 return <section aria-label="Private identity evidence" className="space-y-3 border-t border-border pt-3">
  <h3 className="text-sm font-semibold">Private identity evidence</h3>
  <p className="text-xs text-muted-foreground">
   Upload your own PDF or image. Files are private, security-scanned and available
   only through a short-lived authorized link. Do not paste Aadhaar or PAN numbers
   into free text fields. A document is not saved until you confirm after scanning.
  </p>
  {entries.map(item=><div key={item.kind} className="space-y-2 rounded border border-border p-3">
   <div className="flex items-center justify-between gap-2">
    <strong className="text-sm">{item.label}</strong>
    <span className="text-xs">{item.id?"On file":"Not uploaded"}</span>
   </div>
   <label className="block text-xs font-medium">Upload or replace {item.label}
    <input type="file" accept="application/pdf,image/png,image/jpeg,image/webp"
     disabled={blocked} className="mt-1 block max-w-full text-xs"
     onChange={event=>{
      const file=event.currentTarget.files?.[0];
      if(file)void begin(item.kind,file);
      event.currentTarget.value="";
     }}/>
   </label>
   {item.id?<div className="flex flex-wrap gap-2">
    <Button type="button" variant="secondary" disabled={blocked}
     onClick={()=>void open(item.kind,item.id!)}>Request private link</Button>
    <Button type="button" variant="danger" disabled={blocked}
     onClick={()=>setRevokeKind(item.kind)}>Remove evidence</Button>
   </div>:null}
   {readLink?.kind===item.kind&&readLink.expiresAt>Date.now()?
    <a href={readLink.href} rel="noopener noreferrer"
      className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline">
      Open verified document (expires soon)
    </a>:null}
  </div>)}
  {checking?<Button type="button" variant="secondary" disabled={blocked}
    onClick={()=>void finish()}>Confirm {checking.kind==="PAN"?"PAN":"Aadhaar"} evidence after scan</Button>:null}
  <ConfirmDialog open={revokeKind!==null} onOpenChange={value=>{if(!value&&!blocked)setRevokeKind(null);}}
  title="Remove private evidence?" description="Remove access to this private evidence? Historical audit and retention records are kept."
  pending={blocked} confirmLabel="Remove evidence" onConfirm={()=>{if(revokeKind)void revoke(revokeKind);}}/>
  {busy?<p role="status" className="text-sm">Checking file or updating evidence…</p>:null}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {message?<p role="status" className="text-xs text-muted-foreground">{message}</p>:null}
 </section>;
}
