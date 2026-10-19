"use client";
import { Button } from "@/components/ui/button";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {LessonResourceMaterialsControl} from "./lesson-resource-materials-control";
type Lesson={id:string;name:string;course:string;courseCode:string;offeringId:string;nextSequence:number};
type Existing={id:string;lessonId:string;offeringId:string;lessonName:string;courseCode:string;deliveryId:string|null;title:string;externalUrl:string|null;notes:string|null;
 durationSeconds:number|null;startsAt:string|null;endsAt:string|null;status:string;sequence:number};
type Kind="YOUTUBE"|"LIVE_CLASS"|"RESOURCE";
type Delivery={deliveryId:string;offeringId:string;sectionName:string;sectionCode:string};
type MeetingZone="Asia/Kolkata"|"UTC";
const dateInput=(iso:string|null,zone:MeetingZone="Asia/Kolkata")=>iso?new Intl.DateTimeFormat("sv-SE",{
 timeZone:zone,year:"numeric",month:"2-digit",day:"2-digit",
 hour:"2-digit",minute:"2-digit",hourCycle:"h23",
 }).format(new Date(iso)).replace(" ","T"):"";
function isoIst(local:string,zone:MeetingZone="Asia/Kolkata"){if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local))throw Error("Enter date and time");
 const date=new Date(local+":00"+(zone==="UTC"?"+00:00":"+05:30"));
 if(Number.isNaN(date.getTime()))throw Error("Enter a valid date and time");
 return date.toISOString();
}
export function CollegeContentAuthoringControl({kind,lessons,deliveries,existing,existingTruncated=false,materialsEnabled=false}:{
 kind:Kind;lessons:Lesson[];deliveries:Delivery[];existing:Existing[];existingTruncated?:boolean;
 materialsEnabled?:boolean;
}){
 const router=useRouter(),[editing,setEditing]=useState<string|null>(null),[open,setOpen]=useState(false);
 const [lessonId,setLessonId]=useState(lessons[0]?.id??""),[title,setTitle]=useState(""),
  [url,setUrl]=useState(""),[notes,setNotes]=useState(""),[duration,setDuration]=useState(""),
  [start,setStart]=useState(""),[end,setEnd]=useState(""),
  [busy,setBusy]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState("");
 const [nextOverride,setNextOverride]=useState<Record<string,number>>({});
 const [orderDraft,setOrderDraft]=useState<Record<string,string>>({});
 const [listLessonId,setListLessonId]=useState("");
 const [listQuery,setListQuery]=useState("");
 const [listSectionId,setListSectionId]=useState("");
 const [removeLink,setRemoveLink]=useState(false);
 const [openMaterialsId,setOpenMaterialsId]=useState<string|null>(null);
 const [deliveryId,setDeliveryId]=useState("");
 const [timeZone,setTimeZone]=useState<MeetingZone>("Asia/Kolkata");
 const selectedLesson=lessons.find(row=>row.id===lessonId);
 const allowedDeliveries=deliveries.filter(row=>row.offeringId===selectedLesson?.offeringId);
 const listOfferingId=lessons.find(lesson=>lesson.id===listLessonId)?.offeringId??
   existing.find(item=>item.lessonId===listLessonId)?.offeringId;
 const listSections=deliveries.filter(row=>!listLessonId||listOfferingId===row.offeringId);
 const matching=existing.filter(item=>(!listQuery.trim()||[item.title,item.lessonName,item.courseCode].some(value=>
  value.toLocaleLowerCase().includes(listQuery.trim().toLocaleLowerCase())))&&
  (!listLessonId||item.lessonId===listLessonId)&&
  (!listSectionId||!item.deliveryId||item.deliveryId===listSectionId)&&
  (!listSectionId||item.offeringId===deliveries.find(row=>row.deliveryId===listSectionId)?.offeringId));
 const text=kind==="YOUTUBE"?"Import from link":kind==="RESOURCE"?"Add Resource":"Schedule live class";
 function select(item:Existing){
  setEditing(item.id);setOpen(true);setLessonId(item.lessonId);setTitle(item.title);
  setUrl("");setNotes(item.notes??"");setDuration(item.durationSeconds===null?"":String(item.durationSeconds));
  setTimeZone("Asia/Kolkata");setStart(dateInput(item.startsAt));setEnd(dateInput(item.endsAt));setDeliveryId(item.deliveryId??"");setRemoveLink(false);setError("");setMessage("");
 }
 function fresh(){
  setEditing(null);setOpen(true);setTitle("");setUrl("");setNotes("");setDuration("");setStart("");setEnd("");setTimeZone("Asia/Kolkata");setDeliveryId("");
  setError("");setMessage("");setRemoveLink(false);
 }
 async function save(){
  if(busy)return;
  if(!title.trim()||!lessonId){setError("Choose a Lesson and enter a Title.");return;}
  if(kind==="LIVE_CLASS"&&!editing&&!url.trim()){setError("Enter a Meeting Link.");return;}
  if(kind==="YOUTUBE"&&!editing&&!url.trim()){setError("Enter a YouTube URL.");return;}
  if(kind==="RESOURCE"&&!editing&&!url.trim()&&!notes.trim()){setError("Add resource notes or an HTTPS link.");return;}
  if(kind==="RESOURCE"&&editing&&removeLink&&!notes.trim()){setError("Add resource notes before removing the last link.");return;}
  setBusy(true);setError("");setMessage("");
  try{
   if(url.trim()){
    if(url.trim().length>2048)throw Error("Link must be at most 2048 characters.");
    let target:URL;
    try{target=new URL(url);}catch{throw Error("Enter a valid HTTPS link.");}
    if(target.protocol!=="https:")throw Error("Enter a valid HTTPS link.");
    if(target.username||target.password||target.hash)
      throw Error("Remove credentials and fragments from the HTTPS link.");
    const host=target.hostname.toLowerCase().replace(/^\[|\]$/g,"");
    if(host==="localhost"||host.endsWith(".localhost")||host==="::1"||
       host==="0.0.0.0"||host==="::"||host.startsWith("fe80:")||
       /^127(?:\.\d{1,3}){3}$/.test(host)||/^10(?:\.\d{1,3}){3}$/.test(host)||
       /^192\.168(?:\.\d{1,3}){2}$/.test(host)||/^169\.254(?:\.\d{1,3}){2}$/.test(host)||
       /^172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}$/.test(host))
      throw Error("Use a publicly reachable HTTPS link.");

    if(kind==="YOUTUBE"&&!["youtube.com","youtu.be"].includes(target.hostname.toLowerCase())&&
      !target.hostname.toLowerCase().endsWith(".youtube.com"))throw Error("Enter a YouTube URL.");
   }
   if(kind==="LIVE_CLASS"&&(!start||!end))throw Error("Enter Start Date and End Date.");
   const extra=kind==="YOUTUBE"?{durationSeconds:Number(duration)}:kind==="RESOURCE"?{notes:notes.trim()||null}:{startsAt:isoIst(start,timeZone),endsAt:isoIst(end,timeZone)};
   if(kind==="YOUTUBE"&&(!duration.trim()||!Number.isInteger(Number(duration))||Number(duration)<1||
    Number(duration)>86400))throw Error("Video length must be 1–86400 seconds.");
   if(kind==="LIVE_CLASS"&&new Date(isoIst(end,timeZone)).getTime()<=new Date(isoIst(start,timeZone)).getTime())
    throw Error("End time must be after start time");
   if(!editing&&deliveryId&&!allowedDeliveries.some(row=>row.deliveryId===deliveryId)){
    setError("Select a Section for this Course.");return;
   }
   if(!editing&&(nextOverride[lessonId]??selectedLesson?.nextSequence??0)>10000){
    setError("This Lesson has reached the content ordering limit.");return;
   }
   if(!window.confirm(editing?"Save changes?":"Create this content?"))return;
   const res=await fetch(editing?"/api/courses/lesson-contents/"+encodeURIComponent(editing):
    "/api/courses/lesson-contents",{method:editing?"PATCH":"POST",
     headers:{"Content-Type":"application/json"},body:JSON.stringify(editing?
      {title:title.trim(),...(kind==="RESOURCE"?(removeLink?{externalUrl:null}:(url.trim()?{externalUrl:url.trim()}:{})):(url.trim()?{externalUrl:url.trim()}:{})),...extra}:
      {lessonId,deliveryId:deliveryId||null,title:title.trim(),contentType:kind,externalUrl:url.trim()||null,
       sequence:nextOverride[lessonId]??lessons.find(row=>row.id===lessonId)?.nextSequence??0,...extra})});
   if(!res.ok){const problem=await res.json().catch(()=>({error:"Unable to save content"}));
    throw Error(problem.error??"Unable to save content");}
   if(!editing)setNextOverride(old=>({...old,[lessonId]:(nextOverride[lessonId]??lessons.find(row=>row.id===lessonId)?.nextSequence??0)+1}));
   setMessage(editing?"Content updated.":"Content created.");setOpen(false);router.refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:"Unable to save content");}
  finally{setBusy(false);}
 }
 async function saveOrder(item:Existing){
  if(busy)return;
  const entered=Number(orderDraft[item.id]??item.sequence+1);
  if(!Number.isInteger(entered)||entered<1||entered>10001){setError("Enter a valid Order.");return;}
  setBusy(true);setError("");setMessage("");
  try{
   const response=await fetch("/api/courses/lesson-contents/"+encodeURIComponent(item.id),{
    method:"PATCH",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({sequence:entered-1}),
   });
   if(!response.ok){const result=await response.json().catch(()=>null);
    throw Error(result?.error??"Unable to save Order.");}
   setMessage("Order saved.");router.refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:"Unable to save Order.");}
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
   <Button variant="secondary" type="button" className="min-h-10 rounded border px-3 text-sm" disabled={!lessons.length}
    onClick={fresh}>{text}</Button>
  </div>
  {!lessons.length&&<p className="text-sm">Create a course offering, learning path and lesson before adding content.</p>}
  {open&&<div className="grid max-w-3xl gap-3 md:grid-cols-2">
   <label className="text-sm">Lesson
    <select className="mt-1 w-full rounded border bg-background p-2" value={selectedLesson?lessonId:""}
     onChange={e=>{setLessonId(e.target.value);setDeliveryId("");}} disabled={Boolean(editing)}>
     {editing&&!selectedLesson?<option value="">Saved Lesson outside authoring picker</option>:null}
     {lessons.map(lesson=><option key={lesson.id} value={lesson.id}>
      {lesson.courseCode} · {lesson.course} · {lesson.name}</option>)}
    </select></label>
   {editing&&!selectedLesson?<p role="status" className="text-xs text-muted-foreground md:col-span-2">
    This saved Lesson is outside the first 250 authoring choices. Its Course and Section association cannot be changed; metadata can still be edited.
   </p>:null}
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
    <input type="url" maxLength={2048} required={kind!=="RESOURCE"&&!editing} className="mt-1 w-full rounded border bg-background p-2"
     value={url} onChange={e=>setUrl(e.target.value)} placeholder={editing?"Leave blank to keep saved link":"https://"}/></label>
   {kind==="RESOURCE"?<label className="text-sm">Notes
     <textarea rows={3} maxLength={5000} value={notes} onChange={e=>setNotes(e.target.value)}
       className="mt-1 w-full rounded border bg-background p-2"/>
    </label>:kind==="YOUTUBE"?<label className="text-sm">Video length (seconds)
    <input type="number" required placeholder="Actual video duration" min={1} max={86400} value={duration} onChange={e=>setDuration(e.target.value)}
     className="mt-1 w-full rounded border bg-background p-2"/></label>:<>
    <label className="text-sm">Time Zone
     <select value={timeZone} onChange={event=>{
       const next=event.target.value as MeetingZone;
       if(next===timeZone)return;
       try{
        const startNext=start?dateInput(isoIst(start,timeZone),next):"";
        const endNext=end?dateInput(isoIst(end,timeZone),next):"";
        setStart(startNext);setEnd(endNext);setTimeZone(next);setError("");
       }catch{setError("Fix the Start and End dates before changing Time Zone.");}
      }}
      className="mt-1 w-full rounded border bg-background p-2">
      <option value="Asia/Kolkata">India Standard Time (IST)</option>
      <option value="UTC">UTC</option>
     </select>
     <span className="mt-1 block text-xs text-muted-foreground">Changing Time Zone preserves the scheduled instant and converts the displayed dates.</span>
    </label>
    <label className="text-sm">Start Date and Time
     <input type="datetime-local" required value={start} onChange={e=>setStart(e.target.value)}
      className="mt-1 w-full rounded border bg-background p-2"/></label>
    <label className="text-sm">End Date and Time
     <input type="datetime-local" required value={end} onChange={e=>setEnd(e.target.value)}
      className="mt-1 w-full rounded border bg-background p-2"/></label>
   </>}
   {kind==="RESOURCE"&&editing?<label className="flex items-center gap-2 text-sm md:col-span-2">
    <input type="checkbox" checked={removeLink} onChange={e=>setRemoveLink(e.target.checked)}/>
    Remove existing resource link
   </label>:null}
   <div className="flex gap-2 md:col-span-2">
    <Button variant="primary" type="button" className="rounded bg-primary px-3 py-2 text-on-primary" disabled={busy} onClick={()=>void save()}>
     {busy?"Saving…":"Save"}</Button>
    <Button variant="secondary" type="button" className="rounded border px-3 py-2" onClick={()=>setOpen(false)}>Cancel</Button>
   </div>
  </div>}
  {existing.length>0&&<div className="space-y-2">
   <h3 className="text-sm font-semibold">Existing Content</h3>
   {kind==="RESOURCE"&&!materialsEnabled?<p className="text-xs text-muted-foreground">
    Additional link and file materials are unavailable until the Resource Materials database runtime is verified.
    You can still edit Resource notes and its saved HTTPS link.
   </p>:null}
   {existingTruncated?<p role="status" className="text-xs text-muted-foreground">
    Showing the first 250 saved items. Use the filtered catalogue to find additional content; the list below is not complete.
   </p>:null}
   <label className="grid gap-1 text-sm font-semibold">Search Existing Content
    <input type="search" maxLength={100} value={listQuery} onChange={event=>setListQuery(event.target.value)}
     placeholder="Content title, Lesson or Course code"
     className="min-h-10 max-w-2xl rounded border border-border bg-background p-2"/>
   </label>
   <label className="grid gap-1 text-sm font-semibold">Lesson
    <select value={listLessonId} onChange={event=>{setListLessonId(event.target.value);setListSectionId("");}}
     className="min-h-10 max-w-2xl rounded border border-border bg-background p-2">
     <option value="">All Lessons</option>
     {lessons.map(row=><option key={row.id} value={row.id}>{row.courseCode} · {row.name}</option>)}
    </select>
   </label>
   <label className="grid gap-1 text-sm font-semibold">Section
    <select value={listSections.some(row=>row.deliveryId===listSectionId)?listSectionId:""}
     onChange={e=>setListSectionId(e.target.value)}
     className="min-h-10 max-w-2xl rounded border border-border bg-background p-2">
     <option value="">Showing every section&apos;s content together</option>
     {listSections.map(row=><option key={row.deliveryId} value={row.deliveryId}>
      {row.sectionName} ({row.sectionCode})</option>)}
    </select>
   </label>
   {listSectionId?<p className="text-xs text-muted-foreground">
    Showing shared offering items and content specific to the selected Section.
    The Order field below is the authored default order, not a Section-specific override.
   </p>:null}
   <p className="text-xs text-muted-foreground">{matching.length} matching content items{existingTruncated?" among the first 250 saved items":""}.</p>
   {matching.length===0?<p className="text-xs text-muted-foreground">No saved items match this Lesson and Section.</p>:null}
   <ul className="space-y-1">{matching.map(item=><li key={item.id} className="flex flex-wrap items-center justify-between gap-2 border-b p-2 text-sm">
    <span className="break-words">{item.title} <span className="text-xs text-muted-foreground">({item.courseCode} · {item.lessonName} · {item.status} · {item.deliveryId?deliveries.find(row=>row.deliveryId===item.deliveryId)?
        ((deliveries.find(row=>row.deliveryId===item.deliveryId)?.sectionName??"Section")+" ("+
         (deliveries.find(row=>row.deliveryId===item.deliveryId)?.sectionCode??"")+")"):"One section":"All sections taking this course"})</span></span>
    <div className="flex gap-2">
     {item.externalUrl&&<a className="underline" target="_blank" rel="noopener noreferrer" href={item.externalUrl}>
      {kind==="YOUTUBE"?"View":kind==="RESOURCE"?"Open link":"Join"}</a>}
     <label className="flex items-center gap-1 text-xs">Order
      <input type="number" min={1} max={10001} value={orderDraft[item.id]??String(item.sequence+1)}
       onChange={e=>setOrderDraft(old=>({...old,[item.id]:e.target.value}))}
       className="w-16 rounded border border-border bg-background p-1"/>
     </label>
     <Button variant="ghost" type="button" className="underline" disabled={busy} onClick={()=>void saveOrder(item)}>Save order</Button>
     {kind==="RESOURCE"&&materialsEnabled?<Button variant="ghost" type="button" className="underline"
      aria-expanded={openMaterialsId===item.id} disabled={busy}
      onClick={()=>setOpenMaterialsId(openMaterialsId===item.id?null:item.id)}>Materials</Button>:null}
     <Button variant="ghost" type="button" className="underline" disabled={busy} onClick={()=>select(item)}>Edit</Button>
     {item.status==="DRAFT"&&<Button variant="ghost" type="button" className="underline" disabled={busy}
       onClick={()=>void transition(item,"PUBLISH")}>Publish</Button>}
     <Button variant="secondary" type="button" className="underline text-error" disabled={busy}
       onClick={()=>void transition(item,"ARCHIVE")}>Delete</Button>
    </div>
    {kind==="RESOURCE"&&materialsEnabled&&openMaterialsId===item.id?
      <LessonResourceMaterialsControl key={item.id} contentId={item.id}
       deliveryId={item.deliveryId} editable/>:null}
   </li>)}</ul>
  </div>}
  {error&&<p role="alert" className="text-sm text-error">{error}</p>}
  {message&&<p role="status" className="text-sm">{message}</p>}
 </section>;
}
