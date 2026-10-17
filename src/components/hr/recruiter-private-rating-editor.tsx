"use client";
import {useState,type FormEvent} from "react";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";
type Rating={rating:number|null;note:string};
export function RecruiterPrivateRatingEditor({jobId,applicationId,initial}:{
 jobId:string;applicationId:string;initial:Rating;
}){
 const [rating,setRating]=useState<number|null>(initial.rating);
 const [note,setNote]=useState(initial.note);
 const [saved,setSaved]=useState(initial);
 const [message,setMessage]=useState("");
 const {pending,run}=useGuardedAction();
 const dirty=rating!==saved.rating||note!==saved.note;
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setMessage("");
  try{
   await run(async()=>{
    const result=await apiFetch<Rating>(
     "/api/placements/recruiter/jobs/"+encodeURIComponent(jobId)+
     "/applicants/"+encodeURIComponent(applicationId)+"/private-rating",{
      method:"PATCH",credentials:"same-origin",headers:{"content-type":"application/json"},
      body:JSON.stringify({rating,note}),timeoutMs:25000,
     });
    setSaved(result);setRating(result.rating);setNote(result.note);
    setMessage("Your private rating and note were saved.");
   });
  }catch(error){setMessage(error instanceof FriendlyFetchError&&error.status===409
    ?"Your rating changed. Review and try again."
    :"Couldn't save your private note. Your draft is still here.");}
 }
 return <form onSubmit={e=>void submit(e)}
  className="mt-5 space-y-3 rounded-lg border border-border bg-surface-secondary p-4">
  <h4 className="font-semibold text-foreground">Your rating</h4>
  <p className="text-xs text-body">Only you can read or change this rating and note. The placement cell and other recruiters cannot see it.</p>
  <label className="grid gap-1 text-sm text-body">Rating (1 to 5)
   <select value={rating??""} onChange={e=>setRating(e.target.value?Number(e.target.value):null)}
    className="min-h-11 rounded-md border border-border bg-surface px-3">
    <option value="">No rating</option>
    {[1,2,3,4,5].map(value=><option value={value} key={value}>{value}</option>)}
   </select>
  </label>
  <label className="grid gap-1 text-sm text-body">Private note
   <textarea rows={3} maxLength={1000} value={note} onChange={e=>setNote(e.target.value)}
    className="rounded-md border border-border bg-surface p-3"/>
  </label>
  <p className="text-xs text-muted-foreground">{note.length}/1000 characters</p>
  <div className="flex flex-wrap gap-2">
   <button type="submit" disabled={pending||!dirty}
    className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50">
    {pending?"Saving…":"Save private review"}</button>
   <button type="button" disabled={pending||(!note&&!rating)} onClick={()=>{
    setRating(null);setNote("");
   }} className="min-h-11 rounded-md border border-border px-4 text-sm text-body">
    Clear rating and note</button>
  </div>
  {message?<p role="status" className="text-sm text-body">{message}</p>:null}
 </form>;
}
