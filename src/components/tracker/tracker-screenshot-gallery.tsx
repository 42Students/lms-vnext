"use client";
import {useState} from "react";
import {Dialog} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";

type Screenshot={
 id:string;originalFilename:string;contentType:string;sizeBytes:number;
};
/** Images are fetched on demand through an authenticated, non-cacheable GET.
 * Neither object keys nor reusable private signed URLs enter this component. */
export function TrackerScreenshotGallery({publicId,screenshots}:{
 publicId:string;screenshots:readonly Screenshot[];
}){
 const [selected,setSelected]=useState<number|null>(null);
 const url=(file:Screenshot)=>"/api/tracker/issues/"+encodeURIComponent(publicId)+
   "/screenshots/"+encodeURIComponent(file.id)+"/view";
 return <div className="space-y-3">
  <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
   {screenshots.map((file,index)=><Button key={file.id} variant="ghost"
    type="button" aria-label={"Enlarge "+file.originalFilename}
    className="h-auto min-w-0 flex-col items-stretch gap-2 rounded-[var(--lms-control-radius)] border border-border p-3 text-left"
    onClick={()=>setSelected(index)}>
    <span className="block overflow-hidden rounded bg-muted">
     {/* eslint-disable-next-line @next/next/no-img-element */}
     <img src={url(file)} alt={"Screenshot "+(index+1)+": "+file.originalFilename}
      referrerPolicy="no-referrer" loading="lazy"
      className="aspect-video h-auto w-full object-contain"/>
    </span>
    <span className="block break-words text-sm font-semibold">{file.originalFilename}</span>
    <span className="text-xs text-muted-foreground">{file.contentType} · {Math.ceil(file.sizeBytes/1024)} KiB</span>
   </Button>)}
  </div>
  <Dialog open={selected!==null} onOpenChange={value=>{if(!value)setSelected(null);}}
   title={selected===null?"Screenshot":screenshots[selected]?.originalFilename??"Screenshot"}
   description={selected===null?undefined:
    "Image "+(selected+1)+" of "+screenshots.length+" · private report evidence"}
   className="!max-w-[min(960px,calc(100vw-24px))]"
   footer={<div className="flex flex-wrap justify-end gap-2">
    <Button type="button" variant="secondary" disabled={selected===null||selected===0}
     onClick={()=>setSelected(index=>index===null?null:Math.max(0,index-1))}>Previous</Button>
    <Button type="button" variant="secondary" disabled={selected===null||selected===screenshots.length-1}
     onClick={()=>setSelected(index=>index===null?null:Math.min(screenshots.length-1,index+1))}>Next</Button>
    <Button type="button" variant="secondary" onClick={()=>setSelected(null)}>Close</Button>
   </div>}>
   {selected!==null&&screenshots[selected]?<div className="overflow-auto rounded bg-muted">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={url(screenshots[selected])}
      alt={"Full-size screenshot: "+screenshots[selected]!.originalFilename}
      referrerPolicy="no-referrer" className="mx-auto max-h-[72dvh] max-w-full object-contain"/>
   </div>:null}
  </Dialog>
 </div>;
}
