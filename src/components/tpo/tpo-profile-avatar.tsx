"use client";
import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";

type AvatarSnapshot = {preview:string|null;version:number};
const endpoint="/api/placements/tpo/profile/avatar";
const limit=5*1024*1024;
const accepted=["image/png","image/jpeg","image/webp"];

export function TpoProfileAvatar({name,initials}:{name:string;initials:string}){
 const router=useRouter();
 const fileRef=useRef<HTMLInputElement>(null);
 const [preview,setPreview]=useState<string|null>(null);
 const [version,setVersion]=useState(0);
 const [busy,setBusy]=useState(false);
 const [pendingKey,setPendingKey]=useState<string|null>(null);
 const [showLink,setShowLink]=useState(false);
 const [link,setLink]=useState("");
 const [notice,setNotice]=useState("");
 const [error,setError]=useState("");
 async function refresh(signal?:AbortSignal){
  const response=await fetch(endpoint,{cache:"no-store",credentials:"same-origin",signal});
  if(!response.ok)throw new Error("Could not load the current photo");
  const snapshot=await response.json() as AvatarSnapshot;
  if(!signal?.aborted){setPreview(snapshot.preview);setVersion(snapshot.version);}
 }
 useEffect(()=>{
  const controller=new AbortController();
  void refresh(controller.signal).catch(()=>{
   if(!controller.signal.aborted)setError("Could not load the current photo. Retry to refresh it.");
  });
  return ()=>controller.abort();
 },[]);
 async function upload(file:File){
  if(busy)return;
  if(!accepted.includes(file.type)||file.size<1||file.size>limit){
   setError("Use a PNG, JPEG or WebP image under 5 MB.");return;
  }
  setBusy(true);setError("");setNotice("");
  try{
   const request=await fetch(endpoint,{method:"POST",credentials:"same-origin",
    headers:{"content-type":"application/json"},
    body:JSON.stringify({contentType:file.type,sizeBytes:file.size})});
   if(!request.ok)throw new Error("Could not upload the photo");
   const response=await request.json() as {grant:{objectKey:string;uploadUrl:string;requiredHeaders:Record<string,string>}};
   const sent=await fetch(response.grant.uploadUrl,{
    method:"PUT",headers:response.grant.requiredHeaders,body:file,credentials:"omit"});
   if(!sent.ok)throw new Error("Could not upload the photo");
   setPendingKey(response.grant.objectKey);
   setNotice("Photo uploaded. Confirm once the security scan is complete.");
  }catch(reason){setError(reason instanceof Error?reason.message:"Could not upload the photo");}
  finally{setBusy(false);}
 }
 async function importLink(){
  if(busy||!link.trim())return;
  setBusy(true);setError("");setNotice("");
  let downloaded:File|null=null;
  try{
   const url=new URL(link.trim());
   if(url.protocol!=="https:"||url.username||url.password)throw new Error("Use a public HTTPS image link.");
   const result=await fetch(url.toString(),{mode:"cors",credentials:"omit",redirect:"error",cache:"no-store"});
   if(!result.ok||Number(result.headers.get("content-length")??0)>limit)throw new Error("Could not use that image");
   const blob=await result.blob();
   if(!accepted.includes(blob.type)||blob.size<1||blob.size>limit)throw new Error("Could not use that image");
   downloaded=new File([blob],"tpo-profile-image",{type:blob.type});
  }catch{setError("Could not use that image");}
  finally{setBusy(false);}
  if(downloaded)await upload(downloaded);
 }
 async function confirm(){
  if(!pendingKey||busy)return;
  setBusy(true);setError("");setNotice("");
  try{
   const response=await fetch(endpoint,{method:"PATCH",credentials:"same-origin",
    headers:{"content-type":"application/json"},
    body:JSON.stringify({objectKey:pendingKey,expectedVersion:version})});
   if(!response.ok)throw new Error(response.status===409?
    "Your profile changed. Refresh and try again.":"Security scan pending or photo could not be saved.");
   setPendingKey(null);await refresh();setNotice("Photo updated");router.refresh();
  }catch(reason){setError(reason instanceof Error?reason.message:"Could not upload the photo");}
  finally{setBusy(false);}
 }
 return <div className="min-w-0 shrink-0 space-y-2">
  <div className="relative h-[120px] w-[120px]">
   <div className="flex h-[120px] w-[120px] items-center justify-center overflow-hidden rounded-[var(--lms-control-radius)] border border-[#d2e7e7] bg-[#e9f6f5] text-[34px] font-semibold text-[#1a6872]">
    {preview?<img src={preview} alt={name+"'s profile photo"} referrerPolicy="no-referrer"
      className="h-full w-full object-cover"
      onError={()=>{setPreview(null);setError("Could not load the current photo. Retry to refresh it.");}}/>:
      <span role="img" aria-label={name+"'s profile photo is unavailable"}>{initials}</span>}
   </div>
   <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp"
    className="sr-only" tabIndex={-1} disabled={busy}
    onChange={event=>{const selected=event.currentTarget.files?.[0];
     if(selected)void upload(selected);event.currentTarget.value="";}}/>
   <button type="button" title="Change profile photo" aria-label="Change profile photo"
    disabled={busy} onClick={()=>fileRef.current?.click()}
    className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--lms-canvas-border)] bg-white text-[var(--lms-primary-text)] shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary-text)]">
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
     <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L9 17l-4 1 1-4Z"/>
    </svg>
   </button>
  </div>
  <button type="button" className="block min-h-9 text-left text-xs font-semibold text-link underline"
   disabled={busy} aria-expanded={showLink} onClick={()=>setShowLink(!showLink)}>Use an image link</button>
  {showLink?<div className="w-full min-w-[220px] max-w-[340px] space-y-2">
   <label htmlFor="tpo-avatar-link" className="block text-xs font-semibold">HTTPS image URL</label>
   <Input id="tpo-avatar-link" type="url" maxLength={2048} value={link}
    onChange={event=>setLink(event.target.value)} placeholder="https://example.com/photo.jpg" disabled={busy}/>
   <Button type="button" size="sm" variant="secondary" disabled={busy||!link.trim()}
    onClick={()=>void importLink()}>Use this image</Button>
   <p className="text-xs text-muted-foreground">Image links must allow browser downloads. All photos are privately uploaded and scanned before publishing.</p>
  </div>:null}
  {pendingKey?<Button type="button" size="sm" variant="secondary" disabled={busy}
    onClick={()=>void confirm()}>Confirm photo after scan</Button>:null}
  {error?<p role="alert" className="max-w-xs text-xs text-[var(--lms-danger)]">{error}</p>:null}
  {notice?<p role="status" aria-live="polite" className="max-w-xs text-xs text-[var(--lms-primary-text)]">{notice}</p>:null}
 </div>;
}
