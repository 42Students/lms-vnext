"use client";
import {useEffect,useRef,useState,type FormEvent} from "react";
import {useGuardedAction} from "@/hooks/use-guarded-action";
type Review={rating:number|null;note:string;updatedAt:string|null};
const empty:Review={rating:null,note:"",updatedAt:null};
export function RecruiterPrivateRatingEditor({jobId,applicationId}:{jobId:string;applicationId:string}){
 const endpoint="/api/placements/recruiter/jobs/"+encodeURIComponent(jobId)+
  "/applicants/"+encodeURIComponent(applicationId)+"/private-rating";
 const [saved,setSaved]=useState<Review>(empty);
 const [rating,setRating]=useState<number|null>(null),[note,setNote]=useState("");
 const [ready,setReady]=useState(false),[message,setMessage]=useState("");
 const {run,pending}=useGuardedAction({timeoutMs:15000});
 const mounted=useRef(true);
 useEffect(()=>{
  mounted.current=true;
  const controller=new AbortController();
  void (async()=>{
   try{
    const response=await fetch(endpoint,{cache:"no-store",credentials:"same-origin",signal:controller.signal});
    if(!response.ok)throw new Error("READ_FAILED");
    const body=await response.json() as Review;
    if(mounted.current){setSaved(body);setRating(body.rating);setNote(body.note);setReady(true);setMessage("");}
   }catch{
    if(mounted.current&&!controller.signal.aborted)setMessage("Your private review could not be loaded. Reload this applicant to try again.");
   }
  })();
  return ()=>{mounted.current=false;controller.abort();};
 },[endpoint]);
 async function save(event?:FormEvent<HTMLFormElement>,clear=false){
  event?.preventDefault();
  if(pending||!ready)return;
  setMessage("");
  try{
   const response=await run(()=>fetch(endpoint,{
    method:"PATCH",headers:{"Content-Type":"application/json"},
    credentials:"same-origin",
    body:JSON.stringify({rating:clear?null:rating,note:clear?"":note,
     expectedUpdatedAt:saved.updatedAt}),
   }));
   if(!response)throw new Error("NOT_CONFIRMED");
   if(response.status===409){
    setMessage("Your private review changed. Your edits are kept here. Reload this applicant before saving again.");
    return;
   }
   if(!response.ok)throw new Error("SAVE_FAILED");
   const body=await response.json() as Review;
   setSaved(body);setRating(body.rating);setNote(body.note);
   setMessage(clear?"Rating and note cleared.":"Private review saved.");
  }catch{setMessage("Private review was not saved. Your changes are still here; try again.");}
 }
 const dirty=rating!==saved.rating||note!==saved.note;
 return <form onSubmit={event=>void save(event)}
  className="mt-5 space-y-3 rounded-lg border border-border bg-surface-secondary p-4">
  <h4 className="font-semibold text-foreground">Your private rating</h4>
  <p className="text-xs text-body">Only you can read or change this rating and note.</p>
  <label className="grid gap-1 text-sm text-body">Your rating
   <select value={rating===null?"":String(rating)} disabled={!ready||pending}
    onChange={event=>setRating(event.target.value===""?null:Number(event.target.value))}
    className="min-h-11 rounded-md border border-border bg-surface px-3">
    <option value="">Not rated</option>
    {[1,2,3,4,5].map(value=><option key={value} value={value}>{value} / 5</option>)}
   </select>
  </label>
  <label className="grid gap-1 text-sm text-body">Your note
   <textarea value={note} maxLength={1000} rows={3} disabled={!ready||pending}
    onChange={event=>setNote(event.target.value)}
    className="w-full rounded-md border border-border bg-surface p-3"/>
  </label>
  <p className="text-xs text-muted-foreground">{note.length}/1000 characters</p>
  {message?<p role="status" className="text-sm text-body">{message}</p>:null}
  <div className="flex flex-wrap gap-2">
   <button type="submit" disabled={!ready||!dirty||pending}
    className="min-h-11 rounded-md bg-primary px-4 font-semibold text-on-primary disabled:opacity-50">
    {pending?"Saving…":"Save private review"}</button>
   <button type="button" disabled={!ready||pending||(rating===null&&!note)}
    onClick={()=>void save(undefined,true)}
    className="min-h-11 rounded-md border border-border px-3 text-sm font-semibold text-primary-text disabled:opacity-50">
    Clear rating and note</button>
  </div>
 </form>;
}
