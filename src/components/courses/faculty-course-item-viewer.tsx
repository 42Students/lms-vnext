"use client";

import {useState} from "react";
import {Dialog} from "@/components/ui/dialog";
import {Drawer} from "@/components/ui/drawer";
import {Button} from "@/components/ui/button";

type ContentKind="VIDEO"|"YOUTUBE"|"RESOURCE"|"LIVE_CLASS"|"ASSIGNMENT"|"QUIZ";
type Props={
 title:string;kind:ContentKind;notes:string|null;
 externalHref?:string|null;youtubeEmbed?:string|null;
 startsAt?:string|null;endsAt?:string|null;dueAt?:string|null;
};
/** Legacy content opens in a wide viewer; assignment details use a separate
 * side drawer. No raw stored-video key is ever passed to a client. */
export function FacultyCourseItemViewer({title,kind,notes,externalHref,youtubeEmbed,
 startsAt=null,endsAt=null,dueAt=null}:Props){
 const [open,setOpen]=useState(false);
 const isAssessment=kind==="ASSIGNMENT",isVideo=kind==="VIDEO"||kind==="YOUTUBE";
 const start=startsAt?new Date(startsAt):null,end=endsAt?new Date(endsAt):null;
 const status=kind==="LIVE_CLASS"&&start&&end?
  (Date.now()>=end.getTime()?"Ended":Date.now()>=start.getTime()?"Live now":"Scheduled"):null;
 const content=<div className="space-y-4 text-sm text-body">
   <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{kind.replaceAll("_"," ")}{status?" · "+status:""}</p>
   {notes?<p className="whitespace-pre-wrap">{notes}</p>:null}
   {dueAt?<p>Due {new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",
     timeZone:"Asia/Kolkata"}).format(new Date(dueAt))} IST</p>:null}
   {start?<p>Starts {new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",
     timeZone:"Asia/Kolkata"}).format(start)} IST</p>:null}
   {end?<p>Ends {new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",
     timeZone:"Asia/Kolkata"}).format(end)} IST</p>:null}
   {youtubeEmbed?<iframe title={"Preview "+title} src={youtubeEmbed}
     className="aspect-video w-full rounded-[var(--lms-control-radius)] border border-border"
     referrerPolicy="strict-origin-when-cross-origin" loading="lazy"
     allow="encrypted-media; picture-in-picture" allowFullScreen/>:null}
   {externalHref?<a href={externalHref} target="_blank" rel="noopener noreferrer"
     className="inline-flex min-h-11 items-center font-semibold text-primary-text underline">
     {kind==="LIVE_CLASS"?"Join meeting":"Open content"}
   </a>:null}
   {kind==="VIDEO"&&!externalHref?<p role="note">Stored videos require an authorised signed playback link. No private file key is displayed.</p>:null}
 </div>;
 return <>
  <Button type="button" variant="secondary" size="sm"
    onClick={()=>setOpen(true)} aria-haspopup="dialog">
    {isAssessment?"View assignment":kind==="QUIZ"?"View quiz":"View content"}
  </Button>
  {isAssessment?<Drawer title={title} description="Assignment details" open={open}
    onOpenChange={setOpen}
    footer={<Button variant="secondary" onClick={()=>setOpen(false)}>Close</Button>}>
    {content}
  </Drawer>:<Dialog title={title} description="Lesson content" open={open}
    onOpenChange={setOpen} className={isVideo?"!max-w-[1120px]":"!max-w-[760px]"}
    footer={<Button variant="secondary" onClick={()=>setOpen(false)}>Close</Button>}>
    {content}
  </Dialog>}
 </>;
}
