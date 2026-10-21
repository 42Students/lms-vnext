"use client";
import { Alert } from "@/components/ui/alert";
import { Dialog } from "@/components/ui/dialog";
import { LessonResourceMaterialsControl } from "@/components/courses/lesson-resource-materials-control";

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
 durationSeconds:number|null;startsAt:Date|null;endsAt:Date|null;deliveryId?:string|null};
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
 const [pendingAction,setPendingAction]=useState<"PUBLISH"|"ARCHIVE"|null>(null);
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
  submissionLock.current=true;setBusy(true);setError("");setNotice("");
  try{
   await apiFetch("/api/courses/lesson-contents/"+encodeURIComponent(item.id)+"/transition",{
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action}),
   });
   setEditing(false);setPendingAction(null);setNotice(action==="PUBLISH"?"Content published":
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
   if(dirty&&!window.confirm(item.contentType==="RESOURCE"
     ?"Discard the changes to this resource? Unsaved links and material changes will be lost."
     :"Discard lesson-content edits? Any unsaved replacement file or link will be lost."))return;
   setTitle(item.title);setOrder(String(item.sequence+1));
   setDuration(item.durationSeconds===null?"":String(item.durationSeconds));
   setNotes(item.notes??"");setReplacementUrl("");setTimeZone("Asia/Kolkata");
   setStartsAt(localDate(item.startsAt));setEndsAt(localDate(item.endsAt));
  }
  setEditing(!editing);
  setError("");
 }
 if(item.status==="ARCHIVED")return <p className="text-xs text-muted-foreground">Archived content is read-only.</p>;
 return <div className="min-w-0 space-y-2">
  <div className="flex min-w-0 flex-wrap items-center gap-1" aria-label={`Actions for ${item.title}`}>
   <Button variant="secondary" size="icon-sm" type="button" disabled={busy}
    aria-label={`Edit ${item.title}`} title={`Edit ${item.title}`} onClick={toggleEditor}>
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L9 17l-4 1 1-4z"/></svg>
    <span className="sr-only">Edit</span>
   </Button>
   {item.status==="DRAFT"?<Button variant="secondary" size="sm" disabled={busy}
    aria-label={`Publish ${item.title}`} onClick={()=>setPendingAction("PUBLISH")}>Publish</Button>:null}
   <Button variant="danger" size="icon-sm" disabled={busy}
    aria-label={`Delete ${item.title}`} title={`Delete ${item.title}`} onClick={()=>setPendingAction("ARCHIVE")}>
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M5 6l1 14h12l1-14M10 10v6m4-6v6"/></svg>
    <span className="sr-only">Delete</span>
   </Button>
  </div>
  <Dialog open={editing} onOpenChange={open=>{if(!open)toggleEditor();}}
   title={item.contentType==="RESOURCE"?"Edit Resource":"Edit Content: "+item.title}
   className={item.contentType==="RESOURCE"?"max-w-[700px]":"max-w-[600px]"}
   dismissible={false}
   footer={<>
    <Button variant="secondary" disabled={busy} onClick={toggleEditor}>Cancel</Button>
    <Button loading={busy} disabled={busy} onClick={()=>void save()}>{item.contentType==="RESOURCE"?"Save changes":"Save changes"}</Button>
   </>}>
   <fieldset disabled={busy} className="grid min-w-0 grid-cols-1 gap-[var(--lms-space-3)] sm:grid-cols-2">
    <p className="text-xs text-muted-foreground sm:col-span-2">Existing uploaded files and unrelated materials are retained. Replacing a private file requires a verified lesson-bound upload.</p>
    <label className="grid min-w-0 gap-1.5 text-[13px] font-semibold text-body">Title
     <Input value={title} maxLength={255} onChange={e=>setTitle(e.target.value)}/></label>
    <label className="grid min-w-0 gap-1.5 text-[13px] font-semibold text-body">Order
     <Input type="number" min={1} max={10001} value={order} onChange={e=>setOrder(e.target.value)}/></label>
    {["YOUTUBE","LIVE_CLASS","RESOURCE"].includes(item.contentType)?
     <label className="grid min-w-0 gap-1.5 text-[13px] font-semibold text-body">{item.contentType==="LIVE_CLASS"?"Meeting Link":item.contentType==="YOUTUBE"?"YouTube URL":"Link title (optional) / HTTPS link"}
      <Input type="url" maxLength={2048} value={replacementUrl} onChange={e=>setReplacementUrl(e.target.value)}
       placeholder={item.contentType==="YOUTUBE"?"https://www.youtube.com/watch?v=...":item.contentType==="LIVE_CLASS"?"e.g., https://zoom.us/j/... or https://meet.google.com/...":"https://example.org/reading"}/>
      <span className="text-xs font-normal text-muted-foreground">Leave blank to retain the saved link.</span>
     </label>:null}
    {item.contentType==="RESOURCE"?<label className="grid min-w-0 gap-1.5 text-[13px] font-semibold text-body">Notes
     <Textarea rows={3} maxLength={5000} value={notes} onChange={e=>setNotes(e.target.value)}/>
    </label>:null}
    {item.contentType==="YOUTUBE"?<label className="grid min-w-0 gap-1.5 text-[13px] font-semibold text-body">Video length (seconds)
     <Input type="number" min={1} max={86400} value={duration} onChange={e=>setDuration(e.target.value)}/></label>:null}
    {item.contentType==="LIVE_CLASS"?<>
     <label className="grid min-w-0 gap-1.5 text-[13px] font-semibold text-body">Time Zone
      <Select value={timeZone} onChange={e=>{
       const zone=e.target.value as MeetingZone;
       if((startsAt!==localDate(item.startsAt,timeZone)||endsAt!==localDate(item.endsAt,timeZone))&&
          !window.confirm("Changing Time Zone will reset unsaved date and time edits. Continue?"))return;
       setTimeZone(zone);setStartsAt(localDate(item.startsAt,zone));setEndsAt(localDate(item.endsAt,zone));
      }}>
       <option value="Asia/Kolkata">India Standard Time (IST)</option>
       <option value="UTC">UTC</option>
       <option value="America/New_York">America/New_York</option>
       <option value="America/Los_Angeles">America/Los_Angeles</option>
       <option value="Europe/London">Europe/London</option>
      </Select>
     </label>
     <label className="grid min-w-0 gap-1.5 text-[13px] font-semibold text-body">Start Date and Time
      <Input type="datetime-local" step={900} value={startsAt} onChange={e=>setStartsAt(e.target.value)}/></label>
     <label className="grid min-w-0 gap-1.5 text-[13px] font-semibold text-body">End Date and Time
      <Input type="datetime-local" step={900} value={endsAt} onChange={e=>setEndsAt(e.target.value)}/></label>
     <p className="text-xs text-muted-foreground sm:col-span-2">Times use the selected meeting time zone. Invalid and ambiguous daylight-saving times cannot be saved.</p>
    </>:null}
    {item.contentType==="RESOURCE"?<div className="sm:col-span-2">
     <p className="text-xs text-muted-foreground">Visible to students when published. Update individual links without replacing other materials.</p>
     <LessonResourceMaterialsControl contentId={item.id} deliveryId={item.deliveryId??null} editable/>
    </div>:null}
   </fieldset>
   {error?<Alert tone="error">{error}</Alert>:null}
  </Dialog>
  <Dialog open={pendingAction!==null} onOpenChange={open=>{if(!open)setPendingAction(null);}}
   title={pendingAction==="ARCHIVE"?(item.contentType==="RESOURCE"?"Delete this resource?":"Are you sure to delete this content?"):"Publish this content?"}
   description={pendingAction==="ARCHIVE"?(item.contentType==="RESOURCE"?"Students will no longer see it. The record and private files are retained for authorized recovery.":"Students will no longer see this content. Its record is archived for authorized recovery."):"Published content becomes available to eligible students when its lesson and course are published."}
   footer={<>
    <Button variant="secondary" disabled={busy} onClick={()=>setPendingAction(null)}>No</Button>
    <Button variant={pendingAction==="ARCHIVE"?"danger":"primary"} loading={busy} disabled={busy}
     onClick={()=>{if(pendingAction)void transition(pendingAction);}}>{pendingAction==="ARCHIVE"?"Delete":"Yes"}</Button>
   </>}>
   <p className="text-sm text-body"> {pendingAction==="ARCHIVE"?"This action hides the content from students.":"Confirm publication for this content."}</p>
  </Dialog>
  {error&&!editing?<Alert tone="error">{error}</Alert>:null}
  {notice?<Alert tone="success">{notice}</Alert>:null}
 </div>;
}
