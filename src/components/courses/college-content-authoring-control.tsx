"use client";
import {useRouter} from "next/navigation";
import {useState} from "react";
type Lesson={id:string;name:string;course:string;courseCode:string;offeringId:string;nextSequence:number};
type Existing={id:string;lessonId:string;deliveryId:string|null;title:string;externalUrl:string|null;notes:string|null;
 durationSeconds:number|null;startsAt:string|null;endsAt:string|null;status:string;sequence:number};
type Kind="YOUTUBE"|"LIVE_CLASS"|"RESOURCE";
type Delivery={deliveryId:string;offeringId:string;sectionName:string;sectionCode:string};
const dateInput=(iso:string|null)=>iso?new Intl.DateTimeFormat("sv-SE",{
 timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",
 hour:"2-digit",minute:"2-digit",hourCycle:"h23",
 }).format(new Date(iso)).replace(" ","T"):"";
function isoIst(local:string){if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local))throw Error("Enter date and time");
 const date=new Date(local+":00+05:30");
 if(Number.isNaN(date.getTime()))throw Error("Enter a valid date and time");
 return date.toISOString();
}
export function CollegeContentAuthoringControl({kind,lessons,deliveries,existing}:{
 kind:Kind;lessons:Lesson[];deliveries:Delivery[];existing:Existing[];
}){
 const router=useRouter(),[editing,setEditing]=useState<string|null>(null),[open,setOpen]=useState(false);
 const [lessonId,setLessonId]=useState(lessons[0]?.id??""),[title,setTitle]=useState(""),
  [url,setUrl]=useState(""),[notes,setNotes]=useState(""),[duration,setDuration]=useState(""),
  [start,setStart]=useState(""),[end,setEnd]=useState(""),
  [busy,setBusy]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState("");
 const [nextOverride,setNextOverride]=useState<Record<string,number>>({});
 const [deliveryId,setDeliveryId]=useState("");
 const selectedLesson=lessons.find(row=>row.id===lessonId);
 const allowedDeliveries=deliveries.filter(row=>row.offeringId===selectedLesson?.offeringId);
 const text=kind==="YOUTUBE"?"Import from link":kind==="RESOURCE"?"Add Resource":"Schedule live class";
 function select(item:Existing){
  setEditing(item.id);setOpen(true);setLessonId(item.lessonId);setTitle(item.title);
  setUrl(item.externalUrl??"");setNotes(item.notes??"");setDuration(item.durationSeconds===null?"":String(item.durationSeconds));
  setStart(dateInput(item.startsAt));setEnd(dateInput(item.endsAt));setDeliveryId(item.deliveryId??"");setError("");setMessage("");
 }
 function fresh(){
  setEditing(null);setOpen(true);setTitle("");setUrl("");setNotes("");setDuration("");setStart("");setEnd("");setDeliveryId("");
  setError("");setMessage("");
 }
 async function save(){
  if(busy||!title.trim()||!lessonId||(kind!=="RESOURCE"&&!editing&&!url.trim()))return;
  if(kind==="RESOURCE"&&!url.trim()&&!notes.trim()){setError("Add resource notes or an HTTPS link.");return;}
  setBusy(true);setError("");setMessage("");
  try{
   if(url.trim()){
    let target:URL;
    try{target=new URL(url);}catch{throw Error("Enter a valid HTTPS link.");}
    if(target.protocol!=="https:")throw Error("Enter a valid HTTPS link.");
    if(target.username||target.password||target.hash)
      throw Error("Remove credentials and fragments from the HTTPS link.");
    const host=target.hostname.toLowerCase().replace(/^\[|\]$/g,"");
    if(host==="localhost"||host.endsWith(".localhost")||host==="::1"||
       host==="0.0.0.0"||/^127(?:\.\d{1,3}){3}$/.test(host))
      throw Error("Use a publicly reachable HTTPS link.");

    if(kind==="YOUTUBE"&&!["youtube.com","youtu.be"].includes(target.hostname.toLowerCase())&&
      !target.hostname.toLowerCase().endsWith(".youtube.com"))throw Error("Enter a YouTube URL.");
   }
   const extra=kind==="YOUTUBE"?{durationSeconds:Number(duration)}:kind==="RESOURCE"?{notes:notes.trim()||null}:{startsAt:isoIst(start),endsAt:isoIst(end)};
   if(kind==="YOUTUBE"&&(!duration.trim()||!Number.isInteger(Number(duration))||Number(duration)<1||
    Number(duration)>86400))throw Error("Video length must be 1–86400 seconds.");
   if(kind==="LIVE_CLASS"&&new Date(isoIst(end)).getTime()<=new Date(isoIst(start)).getTime())
    throw Error("End time must be after start time");
   if(!window.confirm(editing?"Save changes?":"Create this content?"))return;
   const res=await fetch(editing?"/api/courses/lesson-contents/"+encodeURIComponent(editing):
    "/api/courses/lesson-contents",{method:editing?"PATCH":"POST",
     headers:{"Content-Type":"application/json"},body:JSON.stringify(editing?
      {title:title.trim(),...(kind==="RESOURCE"?{externalUrl:url.trim()||null}:(url.trim()?{externalUrl:url.trim()}:{})),...extra}:
      {lessonId,deliveryId:deliveryId||null,title:title.trim(),contentType:kind,externalUrl:url.trim()||null,
       sequence:nextOverride[lessonId]??lessons.find(row=>row.id===lessonId)?.nextSequence??0,...extra})});
   if(!res.ok){const problem=await res.json().catch(()=>({error:"Unable to save content"}));
    throw Error(problem.error??"Unable to save content");}
   if(!editing)setNextOverride(old=>({...old,[lessonId]:(nextOverride[lessonId]??lessons.find(row=>row.id===lessonId)?.nextSequence??0)+1}));
   setMessage(editing?"Content updated.":"Content created.");setOpen(false);router.refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:"Unable to save content");}
  finally{setBusy(false);}
 }
 async function transition(item:Existing,action:"PUBLISH"|"ARCHIVE"){
  if(busy)return;
  if(!window.confirm(action==="PUBLISH"?
    "Publish this content to enrolled students?":
    "Delete this content from student access? The record will be archived."))return;
  setBusy(true);setError("");setMessage("");
  try{
   const response=await fetch("/api/courses/lesson-contents/"+encodeURIComponent(item.id)+"/transition",{
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action}),
   });
   if(!response.ok){
    const body=await response.json().catch(()=>({error:"Unable to update content"}));
    throw Error(body.error??"Unable to update content");
   }
   if(editing===item.id){setOpen(false);setEditing(null);}
   setMessage(action==="PUBLISH"?"Content published.":"Content removed from student access.");
   router.refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:"Unable to update content");}
  finally{setBusy(false);}
 }
 return <section className="space-y-3 rounded border border-border bg-surface p-4">
  <div className="flex flex-wrap items-center gap-3">
   <h2 className="font-semibold">{kind==="YOUTUBE"?"Video Content":kind==="RESOURCE"?"Resources":"Live Classes"}</h2>
   <button type="button" className="min-h-10 rounded border px-3 text-sm" disabled={!lessons.length}
    onClick={fresh}>{text}</button>
  </div>
  {!lessons.length&&<p className="text-sm">Create a course offering, learning path and lesson before adding content.</p>}
  {open&&<div className="grid max-w-3xl gap-3 md:grid-cols-2">
   <label className="text-sm">Lesson
    <select className="mt-1 w-full rounded border bg-background p-2" value={lessonId}
     onChange={e=>{setLessonId(e.target.value);setDeliveryId("");}} disabled={Boolean(editing)}>
     {lessons.map(lesson=><option key={lesson.id} value={lesson.id}>
      {lesson.courseCode} · {lesson.course} · {lesson.name}</option>)}
    </select></label>
   <label className="text-sm">Section
    <select value={deliveryId} disabled={Boolean(editing)} onChange={e=>setDeliveryId(e.target.value)}
      className="mt-1 w-full rounded border bg-background p-2">
     <option value="">All sections taking this course</option>
     {allowedDeliveries.map(row=><option key={row.deliveryId} value={row.deliveryId}>
      {row.sectionName} ({row.sectionCode})</option>)}
    </select></label>
   <label className="text-sm">Title
    <input required maxLength={200} className="mt-1 w-full rounded border bg-background p-2"
     value={title} onChange={e=>setTitle(e.target.value)}/></label>
   <label className="text-sm">{kind==="YOUTUBE"?"YouTube URL":kind==="RESOURCE"?"HTTPS resource link (optional with notes)":"Meeting Link"}
    <input type="url" required={kind!=="RESOURCE"&&!editing} className="mt-1 w-full rounded border bg-background p-2"
     value={url} onChange={e=>setUrl(e.target.value)} placeholder={editing?"Leave blank to keep saved link":"https://"}/></label>
   {kind==="RESOURCE"?<label className="text-sm">Notes
     <textarea rows={3} maxLength={5000} value={notes} onChange={e=>setNotes(e.target.value)}
       className="mt-1 w-full rounded border bg-background p-2"/>
    </label>:kind==="YOUTUBE"?<label className="text-sm">Video length (seconds)
    <input type="number" required placeholder="Actual video duration" min={1} max={86400} value={duration} onChange={e=>setDuration(e.target.value)}
     className="mt-1 w-full rounded border bg-background p-2"/></label>:<>
    <label className="text-sm">Start date and time (IST)
     <input type="datetime-local" required value={start} onChange={e=>setStart(e.target.value)}
      className="mt-1 w-full rounded border bg-background p-2"/></label>
    <label className="text-sm">End date and time (IST)
     <input type="datetime-local" required value={end} onChange={e=>setEnd(e.target.value)}
      className="mt-1 w-full rounded border bg-background p-2"/></label>
   </>}
   <div className="flex gap-2 md:col-span-2">
    <button type="button" className="rounded bg-primary px-3 py-2 text-on-primary" disabled={busy} onClick={()=>void save()}>
     {busy?"Saving…":"Save"}</button>
    <button type="button" className="rounded border px-3 py-2" onClick={()=>setOpen(false)}>Cancel</button>
   </div>
  </div>}
  {existing.length>0&&<div className="space-y-2">
   <h3 className="text-sm font-semibold">Existing Content</h3>
   <ul className="space-y-1">{existing.map(item=><li key={item.id} className="flex flex-wrap items-center justify-between gap-2 border-b p-2 text-sm">
    <span className="break-words">{item.title} <span className="text-xs text-muted-foreground">({item.status} · {item.deliveryId?deliveries.find(row=>row.deliveryId===item.deliveryId)?.sectionName??"One section":"All sections taking this course"})</span></span>
    <div className="flex gap-2">
     {item.externalUrl&&<a className="underline" target="_blank" rel="noopener noreferrer" href={item.externalUrl}>
      {kind==="YOUTUBE"?"View":kind==="RESOURCE"?"Open link":"Join"}</a>}
     <button type="button" className="underline" disabled={busy} onClick={()=>select(item)}>Edit</button>
     {item.status==="DRAFT"&&<button type="button" className="underline" disabled={busy}
       onClick={()=>void transition(item,"PUBLISH")}>Publish</button>}
     <button type="button" className="underline text-error" disabled={busy}
       onClick={()=>void transition(item,"ARCHIVE")}>Delete</button>
    </div>
   </li>)}</ul>
  </div>}
  {error&&<p role="alert" className="text-sm text-error">{error}</p>}
  {message&&<p role="status" className="text-sm">{message}</p>}
 </section>;
}
