"use client";
import { Alert } from "@/components/ui/alert";

import {useRouter} from "next/navigation";
import {useRef,useState} from "react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import {apiFetch} from "@/lib/api-fetch";
import {facultyContentExternalHref} from "@/modules/courses/faculty-content-preview-model";
import {parseAdminContentLocalMoment,type AdminContentTimeZone} from "@/modules/courses/super-admin-content-datetime-model";

type Content={id:string;title:string;contentType:string;status:string;sequence:number;notes?:string|null;
 durationSeconds:number|null;startsAt:Date|null;endsAt:Date|null};
type MeetingZone=AdminContentTimeZone;
function localDate(value:Date|null,zone:MeetingZone="Asia/Kolkata"){
 if(!value)return "";
 return new Intl.DateTimeFormat("sv-SE",{
  timeZone:zone,year:"numeric",month:"2-digit",day:"2-digit",
  hour:"2-digit",minute:"2-digit",hourCycle:"h23",
 }).format(new Date(value)).replace(" ","T");
}
export function SuperAdminContentActions({item}:{item:Content}){
 const router=useRouter();
 const submissionLock=useRef(false);
 const [editing,setEditing]=useState(false),[busy,setBusy]=useState(false);
 const [error,setError]=useState(""),[notice,setNotice]=useState("");
 const [title,setTitle]=useState(item.title),[order,setOrder]=useState(String(item.sequence+1));
 const [duration,setDuration]=useState(item.durationSeconds===null?"":String(item.durationSeconds));
 const [notes,setNotes]=useState(item.notes??"");
 const [replacementUrl,setReplacementUrl]=useState("");
 const [timeZone,setTimeZone]=useState<MeetingZone>("Asia/Kolkata");
 const [startsAt,setStartsAt]=useState(localDate(item.startsAt)),[endsAt,setEndsAt]=useState(localDate(item.endsAt));
 async function save(){
  if(busy||submissionLock.current)return;
  const index=Number(order);
  if(!title.trim()){setError("Please enter a content title");return;}
  if(title.trim().length>255){setError("Content title must not exceed 255 characters");return;}
  if(!Number.isInteger(index)||index<1||index>10001){
   setError("Order must be at least 1 and at most 10001");return;
  }
  let changes:Record<string,unknown>={title:title.trim(),sequence:index-1};
  if(["YOUTUBE","LIVE_CLASS","RESOURCE"].includes(item.contentType)&&replacementUrl.trim()){
   const href=facultyContentExternalHref(item.contentType,replacementUrl.trim());
   if(!href){setError("Enter a valid HTTPS link without credentials or spaces.");return;}
   const parsed=new URL(href),host=parsed.hostname.toLowerCase();
   if(item.contentType==="YOUTUBE"&&host!=="youtube.com"&&host!=="youtu.be"&&
      !host.endsWith(".youtube.com")){
    setError("Enter a valid YouTube URL.");return;
   }
   if(parsed.hash||host==="localhost"||host.endsWith(".localhost")||
    host==="0.0.0.0"||host==="::1"||/^127\./.test(host)||/^10\./.test(host)||
    /^192\.168\./.test(host)||/^169\.254\./.test(host)||
    /^172\.(?:1[6-9]|2\d|3[01])\./.test(host)){
    setError("Use a publicly reachable HTTPS link without fragments.");return;
   }
   changes={...changes,externalUrl:href};
  }
  if(item.contentType==="RESOURCE"){
   if(!notes.trim()&&!(item.notes??"").trim()){
    // The database may still hold private FILE/LINK materials. Keep them untouched.
    changes={...changes};
   }else if(notes.trim())changes={...changes,notes:notes.trim()};
  }
  if(item.contentType==="YOUTUBE"){
   const seconds=Number(duration);
   if(!duration||!Number.isInteger(seconds)||seconds<1||seconds>86400){
    setError("Video length must be 1–86400 seconds.");return;
   }
   changes={...changes,durationSeconds:seconds};
  }
  if(item.contentType==="LIVE_CLASS"){
   if(!startsAt||!endsAt){setError("Enter Start Date and End Date.");return;}
   if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(startsAt)||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(endsAt)){
    setError("Enter a valid date and time.");return;
   }
   const start=parseAdminContentLocalMoment(startsAt,timeZone);
   const end=parseAdminContentLocalMoment(endsAt,timeZone);
   if(!start||!end){setError("Enter a valid date and time.");return;}
   if(Date.parse(end)<=Date.parse(start)){setError("End time must be after start time");return;}
   changes={...changes,startsAt:start,endsAt:end};
  }
  if(!window.confirm("Save changes?"))return;
  submissionLock.current=true;setBusy(true);setError("");setNotice("");
  try{
   await apiFetch("/api/courses/lesson-contents/"+encodeURIComponent(item.id),{
    method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(changes),
   });
   setEditing(false);setReplacementUrl("");
   setNotice(item.contentType==="RESOURCE"?"Resource updated":"Lesson content updated successfully!");
   router.refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:"Unable to update content.");}
  finally{submissionLock.current=false;setBusy(false);}
 }
 async function transition(action:"PUBLISH"|"ARCHIVE"){
  if(busy||submissionLock.current)return;
  if(!window.confirm(action==="PUBLISH"?"Publish this content to enrolled students?":
    item.contentType==="RESOURCE"?"Delete this resource? Students will no longer see it.":"Delete this content from student access? The record will be archived."))return;
  submissionLock.current=true;setBusy(true);setError("");setNotice("");
  try{
   await apiFetch("/api/courses/lesson-contents/"+encodeURIComponent(item.id)+"/transition",{
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action}),
   });
   setEditing(false);setNotice(action==="PUBLISH"?"Content published":
    item.contentType==="RESOURCE"?"Resource deleted":"Lesson content archived. Uploaded files have been kept for restoration.");
   router.refresh();
  }catch(cause){setError(action==="ARCHIVE"&&item.contentType==="RESOURCE"?
    "Could not delete resource. "+(cause instanceof Error?cause.message:"Try again."):
    cause instanceof Error?cause.message:"Unable to update content.");}
  finally{submissionLock.current=false;setBusy(false);}
 }
 function toggleEditor(){
  if(editing){
   const dirty=title!==item.title||order!==String(item.sequence+1)||
    duration!==(item.durationSeconds===null?"":String(item.durationSeconds))||
    notes!==(item.notes??"")||replacementUrl.trim().length>0||
    startsAt!==localDate(item.startsAt,timeZone)||endsAt!==localDate(item.endsAt,timeZone);
   if(dirty&&!window.confirm(item.contentType==="RESOURCE"?"Discard resource changes?":"Discard content changes?"))return;
   setTitle(item.title);setOrder(String(item.sequence+1));
   setDuration(item.durationSeconds===null?"":String(item.durationSeconds));
   setNotes(item.notes??"");setReplacementUrl("");setTimeZone("Asia/Kolkata");
   setStartsAt(localDate(item.startsAt));setEndsAt(localDate(item.endsAt));
  }
  setEditing(!editing);
 }
 if(item.status==="ARCHIVED")return <p className="text-xs text-muted-foreground">Archived content is read-only.</p>;
 return <div className="space-y-2">
  <div className="flex min-w-0 flex-col gap-[var(--lms-space-2)] sm:flex-row">
   <Button variant="secondary" type="button" disabled={busy} onClick={toggleEditor}
    className="min-h-11 w-full sm:w-auto md:min-h-9">Edit</Button>
   {item.status==="DRAFT"?<Button variant="primary" type="button" disabled={busy} onClick={()=>void transition("PUBLISH")}
    className="min-h-11 w-full sm:w-auto md:min-h-9">Publish</Button>:null}
   <Button variant="danger" type="button" disabled={busy} onClick={()=>void transition("ARCHIVE")}
    className="min-h-11 w-full sm:w-auto md:min-h-9">Delete</Button>
  </div>
  {editing?<fieldset disabled={busy} className="grid min-w-0 grid-cols-1 gap-[var(--lms-space-3)] border-t border-border pt-[var(--lms-space-3)] sm:grid-cols-2">
   <p className="text-xs text-muted-foreground">Edit saved metadata or replace a link.
    Existing uploaded media is retained. Private-file replacement must use a verified, lesson-bound upload; never reuse another content item&apos;s file or object key.</p>
   <p className="text-xs text-muted-foreground sm:col-span-2">
    Visibility is enabled by default, but a draft is hidden from learners until explicitly published.
    Delete archives the content and preserves uploaded files for authorized recovery.
   </p>
   <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Title
    <Input value={title} maxLength={255} onChange={e=>setTitle(e.target.value)}
     className="min-h-11 w-full sm:w-auto md:min-h-9"/></label>
   <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Order
    <Input type="number" min={1} max={10001} value={order} onChange={e=>setOrder(e.target.value)}
     className="min-h-11 w-full sm:w-auto md:min-h-9"/></label>
   {["YOUTUBE","LIVE_CLASS","RESOURCE"].includes(item.contentType)?
    <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">{item.contentType==="LIVE_CLASS"?"Meeting Link":item.contentType==="YOUTUBE"?"YouTube URL":"Resource HTTPS link"}
     <Input type="url" maxLength={2048} value={replacementUrl} onChange={e=>setReplacementUrl(e.target.value)}
      placeholder="New HTTPS link (blank keeps saved link)" className="min-h-11 w-full sm:w-auto md:min-h-9"/>
    </label>:null}
   {item.contentType==="RESOURCE"?<label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Notes
    <Textarea rows={3} maxLength={5000} value={notes} onChange={e=>setNotes(e.target.value)}
     className="w-full"/>
   </label>:null}
   {item.contentType==="YOUTUBE"?<label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Video length (seconds)
    <Input type="number" min={1} max={86400} value={duration} onChange={e=>setDuration(e.target.value)}
     className="min-h-11 w-full sm:w-auto md:min-h-9"/></label>:null}
   {item.contentType==="LIVE_CLASS"?<>
    <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Time Zone
     <Select className="min-h-11 w-full sm:w-auto md:min-h-9" value={timeZone}
      onChange={e=>{
       const zone=e.target.value as MeetingZone;
       if((startsAt!==localDate(item.startsAt,timeZone)||endsAt!==localDate(item.endsAt,timeZone))&&
         !window.confirm("Changing Time Zone will reset unsaved date and time edits. Continue?"))return;
       setTimeZone(zone);setStartsAt(localDate(item.startsAt,zone));setEndsAt(localDate(item.endsAt,zone));
      }}>
      <option value="Asia/Kolkata">India Standard Time (IST)</option><option value="UTC">UTC</option>
     </Select>
    </label>
    <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Start Date and Time
     <Input type="datetime-local" value={startsAt} onChange={e=>setStartsAt(e.target.value)}
      className="min-h-11 w-full sm:w-auto md:min-h-9"/></label>
    <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">End Date and Time
     <Input type="datetime-local" value={endsAt} onChange={e=>setEndsAt(e.target.value)}
      className="min-h-11 w-full sm:w-auto md:min-h-9"/></label>
   </>:null}
   <Button type="button" loading={busy} disabled={busy} onClick={()=>void save()} className="min-h-11 w-full sm:w-auto md:min-h-9">
    {busy?"Saving…":"Save"}</Button>
  </fieldset>:null}
  {error?<Alert tone="error">{error}</Alert>:null}
  {notice?<Alert tone="success">{notice}</Alert>:null}
 </div>;
}
