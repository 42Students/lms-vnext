"use client";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {useEffect,useRef,useState,type FormEvent} from "react";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {Select} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import {parseRecruiterPrivateReviewReceipt,isConfirmedRecruiterPrivateReview,
 type RecruiterPrivateReviewReceipt} from "@/modules/placements/recruiter-private-rating-receipt-model";
type Review=RecruiterPrivateReviewReceipt;
const empty:Review={rating:null,note:"",updatedAt:null};
type PrivateRatingEditorProps={jobId:string;applicationId:string};
/** The App Router can reuse this component as focused applicant changes.
 * Remount private state for each job AND candidate to prevent cross-person
 * notes or optimistic tokens from appearing in another candidate's editor. */
export function RecruiterPrivateRatingEditor(props:PrivateRatingEditorProps){
 return <RecruiterPrivateRatingEditorState
  key={props.jobId+":"+props.applicationId} {...props}/>;
}
function RecruiterPrivateRatingEditorState({jobId,applicationId}:PrivateRatingEditorProps){
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
    const response=await fetch(endpoint,{cache:"no-store",credentials:"same-origin",
     redirect:"error",signal:controller.signal});
    if(!response.ok||response.redirected)throw new Error("READ_FAILED");
    const payload:unknown=await response.json();
    const body=parseRecruiterPrivateReviewReceipt(payload);
    if(!body)throw new Error("UNVERIFIED_REVIEW");
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
   const requested={rating:clear?null:rating,note:clear?"":note.trim()};
   const response=await run(()=>fetch(endpoint,{
    method:"PATCH",headers:{"Content-Type":"application/json"},
    credentials:"same-origin",redirect:"error",
    body:JSON.stringify({...requested,expectedUpdatedAt:saved.updatedAt}),
   }));
   if(!response||response.redirected)throw new Error("NOT_CONFIRMED");
   if(response.status===409){
    setMessage("Your private review changed. Your edits are kept here. Reload this applicant before saving again.");
    return;
   }
   if(!response.ok)throw new Error("SAVE_FAILED");
   const payload:unknown=await response.json();
   const body=parseRecruiterPrivateReviewReceipt(payload);
   if(!isConfirmedRecruiterPrivateReview(body,requested))throw new Error("UNVERIFIED_SAVE");
   setSaved(body);setRating(body.rating);setNote(body.note);
   setMessage(clear?"Rating and note cleared.":"Private review saved.");
  }catch{setMessage("Private review was not saved. Your changes are still here; try again.");}
 }
 const dirty=rating!==saved.rating||note!==saved.note;
 return <form onSubmit={event=>void save(event)}
  className="mt-5 space-y-3 rounded-[var(--lms-control-radius)] border border-border bg-surface-secondary p-4">
  <h4 className="font-semibold text-foreground">Your private rating</h4>
  <p className="text-xs text-body">Only you can read or change this rating and note.</p>
  <label className="grid gap-1 text-sm text-body">Your rating
   <Select value={rating===null?"":String(rating)} disabled={!ready||pending}
    onChange={event=>setRating(event.target.value===""?null:Number(event.target.value))}
    className="w-full">
    <option value="">Not rated</option>
    {[1,2,3,4,5].map(value=><option key={value} value={value}>{value} / 5</option>)}
   </Select>
  </label>
  <label className="grid gap-1 text-sm text-body">Your note
   <Textarea value={note} maxLength={1000} rows={3} disabled={!ready||pending}
    onChange={event=>setNote(event.target.value)}
    className="w-full"/>
  </label>
  <p className="text-xs text-muted-foreground">{note.length}/1000 characters</p>
  {message?<p role="status" className="text-sm text-body">{message}</p>:null}
  <div className="flex flex-wrap gap-2">
   <Button variant="primary" type="submit" disabled={!ready||!dirty||pending}
   >
    {pending?"Saving…":"Save private review"}</Button>
   <Button variant="primary" type="button" disabled={!ready||pending||(rating===null&&!note)}
    onClick={()=>void save(undefined,true)}
   >
    Clear rating and note</Button>
  </div>
 </form>;
}
