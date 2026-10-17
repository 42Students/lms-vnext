"use client";
import {useRouter} from "next/navigation";
import {useState} from "react";

type Content={id:string;title:string;contentType:string;status:string;sequence:number;
 durationSeconds:number|null;startsAt:Date|null;endsAt:Date|null};
function localDate(value:Date|null){
 if(!value)return "";
 return new Intl.DateTimeFormat("sv-SE",{
  timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",
  hour:"2-digit",minute:"2-digit",hourCycle:"h23",
 }).format(new Date(value)).replace(" ","T");
}
function toInstant(value:string){
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))throw Error("Enter a valid date and time.");
 const time=new Date(value+":00+05:30");
 if(!Number.isFinite(time.getTime()))throw Error("Enter a valid date and time.");
 return time.toISOString();
}
export function SuperAdminContentActions({item}:{item:Content}){
 const router=useRouter();
 const [editing,setEditing]=useState(false),[busy,setBusy]=useState(false);
 const [error,setError]=useState(""),[notice,setNotice]=useState("");
 const [title,setTitle]=useState(item.title),[order,setOrder]=useState(String(item.sequence+1));
 const [duration,setDuration]=useState(item.durationSeconds===null?"":String(item.durationSeconds));
 const [startsAt,setStartsAt]=useState(localDate(item.startsAt)),[endsAt,setEndsAt]=useState(localDate(item.endsAt));
 async function save(){
  if(busy)return;
  const index=Number(order);
  if(!title.trim()||title.length>255||!Number.isInteger(index)||index<1||index>10001){
   setError("Enter a title and valid Order.");return;
  }
  let changes:Record<string,unknown>={title:title.trim(),sequence:index-1};
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
   const startTime=new Date(startsAt+":00+05:30"),endTime=new Date(endsAt+":00+05:30");
   if(!Number.isFinite(startTime.getTime())||!Number.isFinite(endTime.getTime())){
    setError("Enter a valid date and time.");return;
   }
   if(endTime.getTime()<=startTime.getTime()){setError("End time must be after start time");return;}
   const start=toInstant(startsAt),end=toInstant(endsAt);
   changes={...changes,startsAt:start,endsAt:end};
  }
  if(!window.confirm("Save changes?"))return;
  setBusy(true);setError("");setNotice("");
  try{
   const response=await fetch("/api/courses/lesson-contents/"+encodeURIComponent(item.id),{
    method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(changes),
   });
   const data=await response.json().catch(()=>null);
   if(!response.ok)throw Error(data?.error??"Unable to update content.");
   setEditing(false);setNotice("Content updated.");router.refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:"Unable to update content.");}
  finally{setBusy(false);}
 }
 async function transition(action:"PUBLISH"|"ARCHIVE"){
  if(busy)return;
  if(!window.confirm(action==="PUBLISH"?"Publish this content to enrolled students?":
    "Delete this content from student access? The record will be archived."))return;
  setBusy(true);setError("");setNotice("");
  try{
   const response=await fetch("/api/courses/lesson-contents/"+encodeURIComponent(item.id)+"/transition",{
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action}),
   });
   const data=await response.json().catch(()=>null);
   if(!response.ok)throw Error(data?.error??"Unable to update content.");
   setEditing(false);setNotice(action==="PUBLISH"?"Content published.":"Content archived.");router.refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:"Unable to update content.");}
  finally{setBusy(false);}
 }
 if(item.status==="ARCHIVED")return <p className="text-xs text-muted-foreground">Archived content is read-only.</p>;
 return <div className="space-y-2">
  <div className="flex flex-wrap gap-2">
   <button type="button" disabled={busy} onClick={()=>setEditing(v=>!v)}
    className="min-h-10 rounded border border-border px-3 text-xs font-semibold text-primary-text">Edit</button>
   {item.status==="DRAFT"?<button type="button" disabled={busy} onClick={()=>void transition("PUBLISH")}
    className="min-h-10 rounded border border-border px-3 text-xs font-semibold text-primary-text">Publish</button>:null}
   <button type="button" disabled={busy} onClick={()=>void transition("ARCHIVE")}
    className="min-h-10 rounded border border-border px-3 text-xs font-semibold text-error">Delete</button>
  </div>
  {editing?<div className="grid gap-2 rounded border border-border p-3">
   <label className="grid gap-1 text-xs font-semibold">Title
    <input value={title} maxLength={255} onChange={e=>setTitle(e.target.value)}
     className="min-h-10 rounded border border-border bg-background p-2"/></label>
   <label className="grid gap-1 text-xs font-semibold">Order
    <input type="number" min={1} max={10001} value={order} onChange={e=>setOrder(e.target.value)}
     className="min-h-10 rounded border border-border bg-background p-2"/></label>
   {item.contentType==="YOUTUBE"?<label className="grid gap-1 text-xs font-semibold">Video length (seconds)
    <input type="number" min={1} max={86400} value={duration} onChange={e=>setDuration(e.target.value)}
     className="min-h-10 rounded border border-border bg-background p-2"/></label>:null}
   {item.contentType==="LIVE_CLASS"?<>
    <label className="grid gap-1 text-xs font-semibold">Start Date and Time (IST)
     <input type="datetime-local" value={startsAt} onChange={e=>setStartsAt(e.target.value)}
      className="min-h-10 rounded border border-border bg-background p-2"/></label>
    <label className="grid gap-1 text-xs font-semibold">End Date and Time (IST)
     <input type="datetime-local" value={endsAt} onChange={e=>setEndsAt(e.target.value)}
      className="min-h-10 rounded border border-border bg-background p-2"/></label>
   </>:null}
   <button type="button" disabled={busy} onClick={()=>void save()}
    className="min-h-10 rounded bg-primary px-3 text-xs font-semibold text-on-primary">
    {busy?"Saving…":"Save"}</button>
  </div>:null}
  {error?<p role="alert" className="text-xs text-error">{error}</p>:null}
  {notice?<p role="status" className="text-xs text-success">{notice}</p>:null}
 </div>;
}
