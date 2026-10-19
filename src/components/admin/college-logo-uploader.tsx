"use client";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";

import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
export function CollegeLogoUploader({collegeId,currentUrl,canEdit}:{
 collegeId:string;currentUrl:string|null;canEdit:boolean;
}){
 const router=useRouter();
 const [file,setFile]=useState<File|null>(null),[preview,setPreview]=useState<string|null>(null);
 const [positionX,setPositionX]=useState(50),[positionY,setPositionY]=useState(50);
 const [zoom,setZoom]=useState(1),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 const [savedUrl,setSavedUrl]=useState<string|null>(null);
 const [confirmRemove,setConfirmRemove]=useState(false);
 useEffect(()=>()=>{if(preview)URL.revokeObjectURL(preview);},[preview]);
 function select(value:File|null){
  setFile(value);setPreview(value?URL.createObjectURL(value):null);
  setPositionX(50);setPositionY(50);setZoom(1);setMessage("");
 }
 async function remove(){
  if(!canEdit||busy)return;
  setBusy(true);setMessage("");
  try{
   const response=await fetch("/api/colleges/"+encodeURIComponent(collegeId)+"/branding/logo",{
    method:"DELETE",credentials:"same-origin",
   });
   if(!response.ok)throw Error("Could not remove the logo.");
   setSavedUrl(null);setConfirmRemove(false);setMessage("Uploaded logo removed.");router.refresh();
  }catch(error){setMessage(error instanceof Error?error.message:"Could not remove logo.");}
  finally{setBusy(false);}
 }
 async function upload(){
  if(!file||!canEdit||busy)return;
  setBusy(true);setMessage("");
  try{
   if(!["image/png","image/jpeg","image/webp"].includes(file.type))throw Error("Select a PNG, JPEG or WebP image.");
   if(file.size>10*1024*1024)throw Error("Choose an image under 10 MiB before cropping.");
   const bitmap=await createImageBitmap(file);
   try{
    if(bitmap.width<200||bitmap.height<200)throw Error("Logo must be at least 200 × 200 pixels.");
    const side=Math.min(1024,bitmap.width,bitmap.height);
    const naturalSquare=Math.min(bitmap.width,bitmap.height)/zoom;
    const sourceX=(bitmap.width-naturalSquare)*positionX/100;
    const sourceY=(bitmap.height-naturalSquare)*positionY/100;
    const canvas=document.createElement("canvas");
    canvas.width=side;canvas.height=side;
    const ctx=canvas.getContext("2d");
    if(!ctx)throw Error("Image cropping is not available in this browser.");
    ctx.drawImage(bitmap,sourceX,sourceY,naturalSquare,naturalSquare,0,0,side,side);
    const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,"image/png"));
    if(!blob)throw Error("Could not crop the selected image.");
    if(blob.size>2*1024*1024)throw Error("The cropped PNG is over 2 MiB. Choose a simpler or smaller image.");
    const body=new FormData();body.set("file",blob,"college-logo.png");
    const response=await fetch("/api/colleges/"+encodeURIComponent(collegeId)+"/branding/logo",{
     method:"POST",credentials:"same-origin",body,
    });
    if(!response.ok){
     const error=await response.json().catch(()=>({error:"UPLOAD_FAILED"})) as {error?:string};
     throw Error(error.error==="LOGO_INVALID"?"Logo must be a square PNG at least 200 × 200.":"Logo upload failed. Check storage configuration and try again.");
    }
    const result=await response.json() as {logoUrl:string};
    setSavedUrl(result.logoUrl+"?v="+Date.now());
    select(null);setMessage("College logo uploaded and saved.");router.refresh();
   }finally{bitmap.close();}
  }catch(error){setMessage(error instanceof Error?error.message:"Upload failed.");}
  finally{setBusy(false);}
 }
 return <section aria-label="College logo upload" className="space-y-3 border-t border-border pt-4">
  <h3 className="font-semibold">College logo</h3>
  <p className="text-sm text-body">Upload a square logo. Choose a crop area; the saved image is a 200-pixel-or-larger PNG. Original files are not made public.</p>
  {(savedUrl||currentUrl)?<div className="w-fit rounded-[var(--lms-control-radius)] border border-border p-3">
   <img src={savedUrl||currentUrl!} alt="Current college logo" className="h-24 w-24 object-contain"/>
  </div>:null}
  {canEdit?<><label className="block text-sm font-medium">Select logo to crop
    <Input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy}
     onChange={e=>select(e.target.files?.[0]??null)}
     className="mt-2 block min-h-11 w-full rounded-[var(--lms-control-radius,9px)] border border-border bg-surface p-2"/>
   </label>
   {file&&preview?<div className="space-y-3">
    <div className="relative h-52 w-52 overflow-hidden rounded-[var(--lms-control-radius,9px)] border border-border bg-surface-subtle">
      <img src={preview} alt="Selected logo crop preview" className="h-full w-full object-cover"
       style={{objectPosition:positionX+"% "+positionY+"%",transform:"scale("+zoom+")"}}/>
    </div>
    <label className="block text-sm">Horizontal crop position ({positionX}%)
     <Input aria-label="Horizontal crop position" className="block !min-h-0 !h-5 !w-52 !border-0 !bg-transparent !p-0 !shadow-none accent-[var(--lms-primary)]" type="range" min={0} max={100} value={positionX} onChange={e=>setPositionX(Number(e.target.value))}/>
    </label>
    <label className="block text-sm">Vertical crop position ({positionY}%)
     <Input aria-label="Vertical crop position" className="block !min-h-0 !h-5 !w-52 !border-0 !bg-transparent !p-0 !shadow-none accent-[var(--lms-primary)]" type="range" min={0} max={100} value={positionY} onChange={e=>setPositionY(Number(e.target.value))}/>
    </label>
    <label className="block text-sm">Zoom ({Math.round(zoom*100)}%)
     <Input aria-label="Crop zoom" className="block !min-h-0 !h-5 !w-52 !border-0 !bg-transparent !p-0 !shadow-none accent-[var(--lms-primary)]" type="range" min={1} max={2} step={0.1} value={zoom} onChange={e=>setZoom(Number(e.target.value))}/>
    </label>
    <Button type="button" disabled={busy} onClick={()=>void upload()}
     className="disabled:opacity-50">
      {busy?"Uploading…":"Crop and upload logo"}
    </Button>
   </div>:null}</>:<p className="text-sm text-muted-foreground">View-only access.</p>}
  {canEdit&&(savedUrl||currentUrl)?<Button type="button" variant="secondary" disabled={busy} onClick={()=>setConfirmRemove(true)}
   className="disabled:opacity-50">
   Remove uploaded logo
  </Button>:null}
  <ConfirmDialog open={confirmRemove} onOpenChange={setConfirmRemove} title="Remove this college's uploaded logo?" description="The uploaded logo will be removed from this college." confirmLabel="Remove uploaded logo" confirmVariant="danger" pending={busy} onConfirm={()=>void remove()}/>
  {message?<p role="status" className="text-sm text-body">{message}</p>:null}
 </section>;
}
