"use client";
import { Button } from "@/components/ui/button";
import {useState} from "react";
import {projectResourceFileDeclaration,validProjectResourceUploadGrant,
 type ProjectResourceFile} from "@/modules/projects/project-resource-files-ui-model";
import {acceptAttributeFor} from "@/modules/storage/file-policy";
import {storageErrorMessage} from "@/modules/storage/ui-models";
type Attachment={kind:"FILE";name:string;fileId:string;url:null};
async function json<T>(url:string,method:"POST",body?:unknown):Promise<T>{
 const response=await fetch(url,{method,credentials:"same-origin",
  ...(body===undefined?{}:{headers:{"Content-Type":"application/json"},body:JSON.stringify(body)})});
 if(!response.ok){const data=await response.json().catch(()=>({error:"STORAGE_INVALID_STATE"})) as {error:string};
  throw Error(storageErrorMessage(data.error));}
 return response.json() as Promise<T>;
}
export function ProjectDeliveryFileUploader({projectId,disabled,onUploaded}:{
 projectId:string;disabled:boolean;onUploaded:(item:Attachment)=>void;
}){
 const [file,setFile]=useState<File|null>(null);
 const [progress,setProgress]=useState(0),[busy,setBusy]=useState(false),[error,setError]=useState("");
 async function upload(){
  if(!file||disabled||busy)return;
  const declaration=projectResourceFileDeclaration(file);
  if(!declaration.ok){setError(storageErrorMessage(declaration.error));return;}
  setBusy(true);setError("");setProgress(0);
  try{
   const base="/api/projects/"+encodeURIComponent(projectId)+"/resource-files";
   const grant=await json<{file:ProjectResourceFile;grant:unknown}>(base,"POST",{
     originalName:declaration.originalName,contentType:declaration.contentType,
     sizeBytes:declaration.sizeBytes,title:file.name.slice(0,200),resourceId:null,
   });
   const uploadGrant=grant.grant;
   if(!validProjectResourceUploadGrant(uploadGrant) ||
     uploadGrant.fileId!==grant.file.id||Date.parse(uploadGrant.expiresAt)<=Date.now())
     throw Error("Upload grant expired.");
   await new Promise<void>((resolve,reject)=>{
    const req=new XMLHttpRequest();req.open("PUT",uploadGrant.uploadUrl,true);
    for(const [key,val] of Object.entries(uploadGrant.requiredHeaders))req.setRequestHeader(key,val);
    req.upload.onprogress=event=>{if(event.lengthComputable)
      setProgress(Math.round(event.loaded/event.total*100));};
    req.onload=()=>req.status>=200&&req.status<300?resolve():reject(Error("File upload failed."));
    req.onerror=()=>reject(Error("File upload failed."));
    req.send(file);
   });
   const saved=await json<{file:ProjectResourceFile}>(base+"/"+encodeURIComponent(grant.file.id)+"/complete","POST");
   // The attachment must reference the exact scanner-verified project file
   // record, not arbitrary metadata supplied by the browser or signed PUT.
   if(saved.file.status!=="READY")throw Error("File requires verification before attaching.");
   if(saved.file.projectId!==projectId || saved.file.id!==grant.file.id ||
      saved.file.resourceId!==null ||
      saved.file.originalName!==declaration.originalName ||
      saved.file.contentType!==declaration.contentType ||
      saved.file.sizeBytes!==declaration.sizeBytes)
      throw Error("Verified file metadata does not match this upload. Please try again.");
   onUploaded({kind:"FILE",name:saved.file.originalName,fileId:saved.file.id,url:null});
   setFile(null);setProgress(0);
  }catch(e){setError(e instanceof Error?e.message:"File upload failed.");}finally{setBusy(false);}
 }
 return <div className="min-w-0 space-y-[var(--lms-space-3)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)]">
  <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Upload a file (up to 50 MB)
   <input type="file" accept={acceptAttributeFor("project-resource")} disabled={disabled||busy}
    className="block min-h-11 w-full min-w-0 md:min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface p-2 text-sm file:mr-3 file:rounded-[var(--lms-control-radius)] file:border-0 file:bg-primary-subtle file:px-3 file:py-1 file:text-link" onChange={e=>setFile(e.target.files?.[0]??null)}/>
  </label>
  <Button type="button" onClick={()=>void upload()} disabled={disabled||busy||!file}
   className="w-full sm:w-auto" loading={busy}>
   {busy?"Uploading…":"Attach file"}</Button>
  {busy?<p role="status" className="text-xs text-body leading-[20px]">Uploading · {progress}%</p>:null}
  {error?<p role="alert" className="text-xs text-error leading-[20px]">{error}</p>:null}
 </div>;
}
