"use client";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";

type AvatarSnapshot={preview:string|null;version:number};

/** Faculty photos use the same scanned private object flow for local uploads
 * and imported HTTPS photos. A remote URL is never sent to the application
 * server: the user's browser first fetches its bytes without credentials. */
export function FacultyAvatarUpload({initialVersion,initials}:{initialVersion:number;initials:string}){
 const router=useRouter();
 const [pending,setPending]=useState(false);
 const [importing,setImporting]=useState(false);
 const [notice,setNotice]=useState("");
 const [version,setVersion]=useState(initialVersion);
 const [preview,setPreview]=useState<string|null>(null);
 const [awaiting,setAwaiting]=useState<string|null>(null);
 const [link,setLink]=useState("");
 const [showLink,setShowLink]=useState(false);
 async function reload(signal?:AbortSignal){
  const response=await fetch("/api/people/faculty-self-document/avatar",{
   cache:"no-store",credentials:"same-origin",signal,
  });
  if(!response.ok)throw new Error("Profile image is temporarily unavailable.");
  const snapshot=await response.json() as AvatarSnapshot;
  if(!signal?.aborted){setPreview(snapshot.preview);setVersion(snapshot.version);}
 }
 useEffect(()=>{
  const controller=new AbortController();
  void reload(controller.signal).catch(()=>{
   if(!controller.signal.aborted)setNotice("Could not load the current photo. Refresh to retry.");
  });
  return ()=>controller.abort();
 },[]);
 async function confirm(key:string){
  const response=await fetch("/api/people/faculty-self-document/avatar",{
   method:"PATCH",credentials:"same-origin",headers:{"content-type":"application/json"},
   body:JSON.stringify({objectKey:key,expectedVersion:version}),
  });
  if(!response.ok)throw new Error(response.status===409
   ?"Your profile changed. Refresh and try again.":"Security scan pending, or the image could not be saved.");
  setAwaiting(null);
  await reload();
  setNotice("Profile image updated.");
  router.refresh();
 }
 async function upload(file:File){
  if(pending)return;
  if(!["image/png","image/jpeg","image/webp"].includes(file.type)||
     file.size<1||file.size>5*1024*1024){
   setNotice("Use a PNG, JPEG or WebP image under 5 MB.");return;
  }
  setPending(true);setNotice("");
  try{
   const response=await fetch("/api/people/faculty-self-document/avatar",{
    method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},
    body:JSON.stringify({contentType:file.type,sizeBytes:file.size}),
   });
   if(!response.ok)throw new Error("Unable to start a private upload.");
   const data=await response.json() as {grant:{
    objectKey:string;uploadUrl:string;requiredHeaders:Record<string,string>}};
   const sent=await fetch(data.grant.uploadUrl,{
    method:"PUT",headers:data.grant.requiredHeaders,body:file,credentials:"omit",
   });
   if(!sent.ok)throw new Error("File upload failed.");
   setAwaiting(data.grant.objectKey);
   setNotice("Uploaded. Security scanning must finish before this image is published.");
  }catch(error){setNotice(error instanceof Error?error.message:"Upload unavailable.");}
  finally{setPending(false);}
 }
 async function importPhoto(){
  if(pending||importing||!link.trim())return;
  setImporting(true);setNotice("");
  try{
   const url=new URL(link.trim());
   if(url.protocol!=="https:"||url.username||url.password)
    throw new Error("Enter a public HTTPS image link without credentials.");
   // Browsers enforce CORS and do not forward the faculty session to a remote host.
   const response=await fetch(url.toString(),{
    mode:"cors",credentials:"omit",redirect:"error",cache:"no-store",
   });
   if(!response.ok)throw new Error("The image link could not be fetched.");
   const length=Number(response.headers.get("content-length")??"0");
   if(length>5*1024*1024)throw new Error("Image exceeds the 5 MB limit.");
   const image=await response.blob();
   if(image.size<1||image.size>5*1024*1024||
      !["image/png","image/jpeg","image/webp"].includes(image.type))
    throw new Error("The link must serve a PNG, JPEG or WebP image under 5 MB.");
   const extension=image.type==="image/png"?"png":image.type==="image/webp"?"webp":"jpg";
   await upload(new File([image],"profile."+extension,{type:image.type}));
  }catch(error){
   setNotice(error instanceof Error?error.message:"Image import failed.");
  }finally{setImporting(false);}
 }
 return <div className="min-w-0 space-y-2 text-sm">
  <div className="relative flex h-[120px] w-[120px] shrink-0 items-center justify-center overflow-hidden rounded-[12px] border border-[var(--lms-canvas-border)] bg-[var(--lms-primary-subtle)] text-3xl font-semibold text-[var(--lms-primary-text)]">
   {preview?<img alt="Current faculty profile" src={preview} className="h-full w-full object-cover"
     referrerPolicy="no-referrer" onError={()=>{setPreview(null);setNotice("Profile photo expired. Refresh to load it again.");}}/>:
     <span aria-label="Profile initials">{initials}</span>}
  </div>
  <label className="block font-semibold text-[var(--lms-heading)]">Change profile image
   <input className="mt-2 block w-full max-w-xs text-sm" type="file"
    accept="image/png,image/jpeg,image/webp" disabled={pending||importing}
    onChange={event=>{const file=event.currentTarget.files?.[0];
     if(file)void upload(file);event.currentTarget.value="";}}/>
  </label>
  <button type="button" className="text-sm font-semibold text-link underline"
   aria-expanded={showLink} onClick={()=>setShowLink(value=>!value)}>Import from image link</button>
  {showLink?<div className="flex max-w-sm flex-col gap-2">
   <label className="text-xs font-semibold" htmlFor="faculty-avatar-link">HTTPS image URL</label>
   <Input id="faculty-avatar-link" type="url" value={link} onChange={event=>setLink(event.target.value)}
    maxLength={2048} placeholder="https://example.com/profile.jpg" disabled={pending||importing}
    className="w-full min-w-0"/>
   <Button variant="secondary" type="button" disabled={pending||importing||!link.trim()}
    onClick={()=>void importPhoto()}>Import image</Button>
   <p className="text-xs text-muted-foreground">The image host must allow browser downloads (CORS). Images undergo the same private upload and security scan.</p>
  </div>:null}
  {awaiting?<Button variant="secondary" type="button" disabled={pending||importing}
   onClick={()=>{setPending(true);void confirm(awaiting).catch(error=>{
    setNotice(error instanceof Error?error.message:"Security scan pending. Try confirming later.");
   }).finally(()=>setPending(false));}}>Confirm after scan</Button>:null}
  {notice?<p role="status" aria-live="polite">{notice}</p>:null}
 </div>;
}
