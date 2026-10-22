"use client";

import {useEffect,useRef,useState} from "react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Alert} from "@/components/ui/alert";

type FileMaterial={
 id:string;kind:string;title:string;originalName:string|null;uploadStatus:string;
};
const extensions=["pdf","doc","docx","ppt","pptx","xls","xlsx","txt","csv","png","jpg","jpeg","gif","webp","zip"];
const mimeByExtension:Record<string,string>={
 pdf:"application/pdf",doc:"application/msword",
 docx:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
 ppt:"application/vnd.ms-powerpoint",
 pptx:"application/vnd.openxmlformats-officedocument.presentationml.presentation",
 xls:"application/vnd.ms-excel",
 xlsx:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
 txt:"text/plain",csv:"text/csv",png:"image/png",jpg:"image/jpeg",jpeg:"image/jpeg",
 gif:"image/gif",webp:"image/webp",zip:"application/zip",
};
const blank={title:"",notes:""};
type UploadGrant={
 uploadUrl:string;method:"PUT";requiredHeaders:Record<string,string>;expiresAt:string;
};
function parseGrant(raw:unknown):{materialId:string;grant:UploadGrant}{
 if(!raw||typeof raw!=="object"||!("material" in raw)||!("grant" in raw))
  throw Error("The signed upload grant was not available.");
 const material=raw.material,grant=raw.grant;
 if(!material||typeof material!=="object"||!("id" in material)||
    typeof material.id!=="string"||!grant||typeof grant!=="object"||
    !("uploadUrl" in grant)||typeof grant.uploadUrl!=="string"||
    !("method" in grant)||grant.method!=="PUT"||
    !("requiredHeaders" in grant)||!grant.requiredHeaders||
    typeof grant.requiredHeaders!=="object"||Array.isArray(grant.requiredHeaders)||
    !("expiresAt" in grant)||typeof grant.expiresAt!=="string")
  throw Error("The signed upload grant was not valid.");
 const url=new URL(grant.uploadUrl);
 if(url.protocol!=="https:"||url.username||url.password)
  throw Error("The signed upload grant was not valid.");
 const headers:Record<string,string>={};
 for(const [key,value] of Object.entries(grant.requiredHeaders)){
  if(typeof value!=="string")throw Error("The signed upload grant was not valid.");
  headers[key]=value;
 }
 return {materialId:material.id,grant:{
  uploadUrl:url.href,method:"PUT",requiredHeaders:headers,expiresAt:grant.expiresAt,
 }};
}
function signedUpload(
 file:File,grant:UploadGrant,setProgress:(value:number)=>void,
 xhrRef:{current:XMLHttpRequest|null},
){
 return new Promise<void>((resolve,reject)=>{
  const xhr=new XMLHttpRequest();
  xhrRef.current=xhr;
  xhr.open(grant.method,grant.uploadUrl,true);
  for(const [key,value] of Object.entries(grant.requiredHeaders))
   xhr.setRequestHeader(key,value);
  xhr.upload.onprogress=event=>{
   if(event.lengthComputable&&event.total>0)
    setProgress(Math.round(100*event.loaded/event.total));
  };
  xhr.onload=()=>xhr.status>=200&&xhr.status<300?
   resolve():reject(Error("The private upload was rejected; choose the file again."));
  xhr.onerror=()=>reject(Error("Could not reach private storage; choose the file again."));
  xhr.onabort=()=>reject(Error("The private upload was cancelled."));
  xhr.send(file);
 });
}
export function LessonResourceFileUploader({
 contentId,deliveryId,materials,onChanged,
}:{
 contentId:string;deliveryId:string|null;materials:readonly FileMaterial[];
 onChanged:()=>Promise<void>;
}){
 const [file,setFile]=useState<File|null>(null);
 const [draft,setDraft]=useState(blank);
 const [busy,setBusy]=useState(false);
 const [progress,setProgress]=useState(0);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [busyMaterialId,setBusyMaterialId]=useState<string|null>(null);
 const xhrRef=useRef<XMLHttpRequest|null>(null);
 const mounted=useRef(true);
 useEffect(()=>{
  mounted.current=true;
  return ()=>{mounted.current=false;xhrRef.current?.abort();};
 },[]);
 const base="/api/courses/lesson-contents/"+encodeURIComponent(contentId)+"/materials/files";
 async function mutateMaterial(id:string,method:"POST"|"DELETE"){
  if(busy)return;
  if(method==="DELETE"&&!window.confirm("Remove this file? Learners will no longer be able to open it."))return;
  setBusy(true);setBusyMaterialId(id);setError("");setNotice("");
  try{
   const response=await fetch(base+"/"+encodeURIComponent(id),{
    method,credentials:"same-origin",cache:"no-store",
    headers:{"Content-Type":"application/json"},body:JSON.stringify({deliveryId}),
   });
   if(!response.ok)throw Error(method==="DELETE"?
    "Unable to remove Resource file.":"Unable to verify Resource file.");
   const body:unknown=await response.json();
   const result=body&&typeof body==="object"&&"result" in body?body.result:null;
   const state=result&&typeof result==="object"&&"uploadStatus" in result?result.uploadStatus:null;
   await onChanged();
   if(mounted.current)setNotice(method==="DELETE"?"File removed.":
    state==="READY"?"File is verified and available.":"Security verification is still pending.");
  }catch(cause){
   if(mounted.current)setError(cause instanceof Error?cause.message:"File operation failed.");
  }finally{
   if(mounted.current){setBusy(false);setBusyMaterialId(null);}
  }
 }
 async function upload(){
  if(busy||!file)return;
  const extension=file.name.split(".").at(-1)?.toLowerCase()??"";
  if(!extensions.includes(extension)||file.size<1||file.size>50*1024*1024){
   setError("Choose an approved Resource file no larger than 50 MB.");return;
  }
  if(!draft.title.trim()){setError("Enter a file title.");return;}
  const contentType=file.type.toLowerCase()||mimeByExtension[extension];
  if(!contentType){setError("This file format is not supported.");return;}
  setBusy(true);setProgress(0);setError("");setNotice("");
  let id:string|null=null,putFinished=false;
  try{
   const response=await fetch(base,{
    method:"POST",credentials:"same-origin",cache:"no-store",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({deliveryId,originalName:file.name,sizeBytes:file.size,
     contentType,title:draft.title.trim(),notes:draft.notes.trim()||null}),
   });
   if(!response.ok)throw Error("Unable to prepare Resource upload. Check storage or permissions.");
   const parsed=parseGrant(await response.json() as unknown);
   id=parsed.materialId;
   if(!mounted.current)return;
   await signedUpload(file,parsed.grant,setProgress,xhrRef);
   xhrRef.current=null;putFinished=true;
   if(!mounted.current)return;
   const complete=await fetch(base+"/"+encodeURIComponent(id),{
    method:"POST",credentials:"same-origin",cache:"no-store",
    headers:{"Content-Type":"application/json"},body:JSON.stringify({deliveryId}),
   });
   if(!complete.ok)throw Error("The file was sent, but verification is not yet available. Retry verification from the list.");
   const data:unknown=await complete.json();
   const result=data&&typeof data==="object"&&"result" in data?data.result:null;
   const state=result&&typeof result==="object"&&"uploadStatus" in result?result.uploadStatus:null;
   await onChanged();
   if(!mounted.current)return;
   setFile(null);setDraft(blank);
   setNotice(state==="READY"?"Resource file verified and available.":
    "Upload complete. Security verification is pending; students cannot open this file yet.");
  }catch(cause){
   if(mounted.current)setError(cause instanceof Error?cause.message:"Resource upload failed.");
   // A failed PUT never promotes READY. Clean up the receipt and pending key.
   if(id&&!putFinished){
    try{await fetch(base+"/"+encodeURIComponent(id),{
     method:"DELETE",credentials:"same-origin",
     headers:{"Content-Type":"application/json"},body:JSON.stringify({deliveryId}),
    });}catch{ /* The pending row still cannot be read by a learner. */ }
   }
   if(mounted.current){
    try{await onChanged();}catch{ /* Keep original upload error. */ }
   }
  }finally{
   xhrRef.current=null;
   if(mounted.current){setBusy(false);setProgress(0);}
  }
 }
 return <div className="space-y-3">
  {materials.filter(item=>item.kind==="FILE"&&["UPLOADING","VERIFYING"].includes(item.uploadStatus)).length?
   <div className="space-y-2 border-t border-border pt-3">
    <h5 className="text-sm font-semibold">Pending file verification</h5>
    {materials.filter(item=>item.kind==="FILE"&&["UPLOADING","VERIFYING"].includes(item.uploadStatus))
      .map(item=><div key={item.id} className="flex flex-wrap items-center gap-2 text-xs">
       <span className="min-w-0 flex-1 break-words">{item.title} · {item.uploadStatus==="VERIFYING"?"Scan pending":"Upload pending"}</span>
       <Button type="button" size="sm" variant="secondary" disabled={busy}
        loading={busyMaterialId===item.id} onClick={()=>void mutateMaterial(item.id,"POST")}>Check verification</Button>
       <Button type="button" size="sm" variant="danger" disabled={busy}
        onClick={()=>void mutateMaterial(item.id,"DELETE")}>Remove</Button>
      </div>)}
   </div>:null}
  {materials.filter(item=>item.kind==="FILE"&&item.uploadStatus==="READY").map(item=>
   <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 text-xs">
    <span className="min-w-0 truncate">{item.title}</span>
    <Button type="button" size="sm" variant="danger" disabled={busy}
     onClick={()=>void mutateMaterial(item.id,"DELETE")}>Remove file</Button>
   </div>)}
  {materials.filter(item=>item.uploadStatus!=="DELETED").length<20?
   <div className="space-y-2 border-t border-border pt-3">
    <h5 className="text-sm font-semibold">Upload file material</h5>
    <p className="text-xs text-muted-foreground">PDF, Office, CSV, text, images or ZIP; up to 50 MB per file. Files remain private until scanned and verified.</p>
    <label className="grid gap-1 text-xs font-semibold">File
     <Input type="file" accept={extensions.map(extension=>"."+extension).join(",")} disabled={busy}
      onChange={event=>{
       const chosen=event.currentTarget.files?.[0]??null;
       setFile(chosen);setError("");
       if(chosen)setDraft(previous=>({...previous,title:chosen.name.replace(/\.[^.]+$/,"")}));
       event.currentTarget.value="";
      }}/>
    </label>
    <label className="grid gap-1 text-xs font-semibold">Title
     <Input maxLength={255} disabled={busy} value={draft.title}
      onChange={event=>setDraft(previous=>({...previous,title:event.target.value}))}/>
    </label>
    <label className="grid gap-1 text-xs font-semibold">Notes (optional)
     <Textarea maxLength={2000} rows={2} disabled={busy} value={draft.notes}
      onChange={event=>setDraft(previous=>({...previous,notes:event.target.value}))}/>
    </label>
    {file?<p className="text-xs text-muted-foreground">{file.name} · {Math.ceil(file.size/1024)} KB</p>:null}
    {busy&&file?<div role="status" className="space-y-1">
     <p className="text-xs">Upload {progress}%</p>
     <progress value={progress} max={100} className="h-2 w-full"/>
    </div>:null}
    <div className="flex flex-wrap gap-2">
     <Button type="button" size="sm" disabled={busy||!file||!draft.title.trim()}
      loading={busy&&Boolean(file)} onClick={()=>void upload()}>Upload file</Button>
     {file&&!busy?<Button type="button" size="sm" variant="secondary"
      onClick={()=>{setFile(null);setDraft(blank);}}>Clear</Button>:null}
    </div>
   </div>:null}
  {error?<Alert tone="error">{error}</Alert>:null}
  {notice?<Alert tone="success">{notice}</Alert>:null}
 </div>;
}
