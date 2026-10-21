"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Disclosure } from "@/components/ui/disclosure";

import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";
export function CollegeLogoUploader({collegeId,currentUrl,canEdit}:{
 collegeId:string;currentUrl:string|null;canEdit:boolean;
}){
 const router=useRouter();
 const fileInputRef=useRef<HTMLInputElement>(null);
 const [removed,setRemoved]=useState(false);
 const [file,setFile]=useState<File|null>(null),[preview,setPreview]=useState<string|null>(null);
 const [positionX,setPositionX]=useState(50),[positionY,setPositionY]=useState(50);
 const [zoom,setZoom]=useState(1),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 const [messageTone,setMessageTone]=useState<"success"|"error">("success");
 const [savedUrl,setSavedUrl]=useState<string|null>(null);
 const [confirmRemove,setConfirmRemove]=useState(false);
 const [stagedBlob,setStagedBlob]=useState<Blob|null>(null);
 const [stagedRemoval,setStagedRemoval]=useState(false);
 const committingRef=useRef(false);
 useEffect(()=>()=>{if(preview)URL.revokeObjectURL(preview);},[preview]);
 function select(value:File|null){
  if (!value && fileInputRef.current) fileInputRef.current.value="";
  if (value && !["image/png","image/jpeg","image/webp"].includes(value.type)) {
    setFile(null);setPreview(null);setMessageTone("error");
    setMessage("Select a PNG, JPEG or WebP image.");return;
  }
  if (value && value.size>10*1024*1024) {
    setFile(null);setPreview(null);setMessageTone("error");
    setMessage("Choose an image under 10 MiB before cropping.");return;
  }
  setFile(value);setPreview(value?URL.createObjectURL(value):null);
  setStagedBlob(null);setStagedRemoval(false);
  setPositionX(50);setPositionY(50);setZoom(1);setMessage("");
  setMessageTone("success");
 }
 function remove(){
  if(!canEdit||busy)return;
  select(null);setStagedRemoval(true);setConfirmRemove(false);
  setMessageTone("success");setMessage("Logo removal staged. Use Save in the branding form to apply it.");
 }
 useEffect(()=>{
  if(!canEdit||(!stagedBlob&&!stagedRemoval))return;
  const onBrandingSaved=(event:Event)=>{
   if(!(event instanceof CustomEvent)||event.detail?.collegeId!==collegeId||committingRef.current)return;
   committingRef.current=true;setBusy(true);setMessage("");
   void (async()=>{
    try{
     const endpoint="/api/colleges/"+encodeURIComponent(collegeId)+"/branding/logo";
     const body=new FormData();
     if(stagedBlob)body.set("file",stagedBlob,"college-logo.png");
     const response=await fetch(endpoint,{method:stagedBlob?"POST":"DELETE",credentials:"same-origin",
      ...(stagedBlob?{body}:{})});
     if(!response.ok)throw Error(stagedBlob?"Logo upload failed. Check storage and retry Save.":"Could not remove the logo. Retry Save.");
     if(stagedBlob){
      const result=await response.json() as {logoUrl:string};
      setSavedUrl(result.logoUrl+"?v="+Date.now());setRemoved(false);
     }else{setSavedUrl(null);setRemoved(true);}
     setStagedBlob(null);setStagedRemoval(false);setFile(null);setPreview(null);
     if(fileInputRef.current)fileInputRef.current.value="";
     setMessageTone("success");setMessage(stagedBlob?"College logo uploaded and saved.":"Uploaded logo removed.");
     router.refresh();
    }catch(error){setMessageTone("error");setMessage(error instanceof Error?error.message:"Could not save logo. Retry Save.");}
    finally{committingRef.current=false;setBusy(false);}
   })();
  };
  window.addEventListener("college-branding-saved",onBrandingSaved);
  return ()=>window.removeEventListener("college-branding-saved",onBrandingSaved);
 },[canEdit,collegeId,router,stagedBlob,stagedRemoval]);
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
    select(null);setStagedBlob(blob);setStagedRemoval(false);
    setMessageTone("success");setMessage("Logo crop staged. Use Save in the branding form to publish this logo.");
   }finally{bitmap.close();}
  }catch(error){setMessageTone("error");setMessage(error instanceof Error?error.message:"Upload failed.");}
  finally{setBusy(false);}
 }
 return <section aria-label="College logo upload" className="min-w-0 space-y-[var(--lms-space-3)]">
  <h2 className="m-0 text-[var(--lms-font-lg)] font-semibold leading-7 text-[var(--lms-heading)]">College logo</h2>
  <p className="max-w-[75ch] text-sm leading-[22px] text-body">Choose a square logo, crop it, then select Save in the branding form. The current login logo stays active unless the branding save succeeds.</p>
  <p className="text-xs leading-5 text-muted-foreground">Legacy logo links are not imported as active storage objects. To migrate an older logo, choose the original image here, crop it and save; the new private upload and college branding lifecycle then take ownership.</p>
  {stagedBlob||stagedRemoval?<Alert tone="warning">Unsaved logo {stagedRemoval?"removal":"replacement"} is staged. Save the branding form to apply it, or leave this page to discard it. Your current logo is still live.</Alert>:null}
  {(savedUrl||(!removed&&currentUrl))?<div className="flex min-w-0 items-center gap-3 border-b border-[var(--lms-canvas-border)] pb-3">
   <Card as="div" className="w-fit shrink-0 p-2">
    <img src={(savedUrl||currentUrl)!} alt="Current college logo" className="aspect-square w-20 max-w-full object-contain"/>
   </Card>
   <p className="min-w-0 text-sm text-muted-foreground leading-[22px]">Current college logo</p>
  </div>:null}
  {canEdit?<><label className="block print:hidden text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Select logo to crop
    <Input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" disabled={busy}
     onChange={e=>select(e.target.files?.[0]??null)}
     className="mt-2 min-h-11 md:min-h-9 w-full"/>
   </label>
   {file&&preview?<div className="min-w-0 space-y-[var(--lms-space-4)] print:hidden">
    <p className="text-sm font-semibold text-body">Logo crop and preview</p>
    <div className="grid min-w-0 items-start gap-[var(--lms-space-4)] md:grid-cols-[208px_minmax(0,1fr)]">
      <div className="relative aspect-square w-full max-w-52 overflow-hidden rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface-subtle">
        <img src={preview} alt="Selected logo crop preview" className="h-full w-full object-cover"
          style={{objectPosition:positionX+"% "+positionY+"%",transform:"scale("+zoom+")"}}/>
      </div>
      <div className="grid min-w-0 max-w-[480px] gap-[var(--lms-space-3)]">
        <label className="grid min-w-0 gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Horizontal crop position ({positionX}%)
          <Input aria-label="Horizontal crop position" className="!min-h-11 !w-full !min-w-0 !border-0 !bg-transparent !px-0 accent-[var(--lms-primary)]" type="range" min={0} max={100} value={positionX} onChange={e=>setPositionX(Number(e.target.value))}/>
        </label>
        <label className="grid min-w-0 gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Vertical crop position ({positionY}%)
          <Input aria-label="Vertical crop position" className="!min-h-11 !w-full !min-w-0 !border-0 !bg-transparent !px-0 accent-[var(--lms-primary)]" type="range" min={0} max={100} value={positionY} onChange={e=>setPositionY(Number(e.target.value))}/>
        </label>
        <label className="grid min-w-0 gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Zoom ({Math.round(zoom*100)}%)
          <Input aria-label="Crop zoom" className="!min-h-11 !w-full !min-w-0 !border-0 !bg-transparent !px-0 accent-[var(--lms-primary)]" type="range" min={1} max={2} step={0.1} value={zoom} onChange={e=>setZoom(Number(e.target.value))}/>
        </label>
      </div>
    </div>
    <Button type="button" disabled={busy} onClick={()=>void upload()}
      className="min-h-11 w-full justify-center sm:w-auto md:min-h-9">
      {busy?"Preparing…":"Crop and stage logo"}
    </Button>
   </div>:null}</>:<Alert tone="info">You can view the logo, but cannot change it.</Alert>}
  {canEdit&&(savedUrl||(!removed&&currentUrl))?<Disclosure title="Logo management"
    className="min-w-0 border-t border-[var(--lms-canvas-border)] pt-2 print:hidden"
    contentClassName="pb-2 pt-2">
    <Button type="button" variant="secondary" disabled={busy} onClick={()=>setConfirmRemove(true)}
      className="min-h-11 w-full justify-center sm:w-auto md:min-h-9">
      Remove uploaded logo
    </Button>
  </Disclosure>:null}
  <ConfirmDialog open={confirmRemove} onOpenChange={setConfirmRemove} title="Remove this college's uploaded logo?" description="Removal will be staged and applied only after you save the branding form." confirmLabel="Stage logo removal" confirmVariant="danger" pending={busy} onConfirm={remove}/>
  {message?<Alert tone={messageTone}>{message}</Alert>:null}
 </section>;
}
