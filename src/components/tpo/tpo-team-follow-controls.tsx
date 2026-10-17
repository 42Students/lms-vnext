"use client";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
export function TpoTeamFollowControls({threadId,following,muted,ready}:{
 threadId:string;following:boolean;muted:boolean;ready:boolean;
}){
 const router=useRouter();
 const pending=useRef(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [state,setState]=useState({following,muted});
 async function change(action:"FOLLOW"|"UNFOLLOW"|"MUTE"|"UNMUTE"){
  if(pending.current||!ready)return;
  pending.current=true;setBusy(true);setError("");
  const controller=new AbortController();
  const timer=window.setTimeout(()=>controller.abort(),30000);
  try{
   const response=await fetch("/api/placements/tpo/team/threads/"+encodeURIComponent(threadId)+"/preferences",{
    method:"POST",credentials:"same-origin",
    headers:{"Content-Type":"application/json"},body:JSON.stringify({action}),
    signal:controller.signal,
   });
   if(!response.ok)throw new Error("Team preferences could not be changed. Please try again.");
   const result=await response.json() as {following:boolean;muted:boolean};
   setState(result);router.refresh();
  }catch{setError("Team preferences could not be changed. Please try again.");}
  finally{window.clearTimeout(timer);pending.current=false;setBusy(false);}
 }
 return <section className="flex flex-wrap items-center gap-2" aria-label="Conversation preferences">
  <button type="button" disabled={busy||!ready} onClick={()=>void change(state.following?"UNFOLLOW":"FOLLOW")}
   className="min-h-11 rounded-md border border-border px-3 text-sm font-semibold text-primary-text disabled:opacity-50">
   {state.following?"Stop following":"Follow"}
  </button>
  <button type="button" disabled={busy||!ready} onClick={()=>void change(state.muted?"UNMUTE":"MUTE")}
   className="min-h-11 rounded-md border border-border px-3 text-sm font-semibold text-primary-text disabled:opacity-50">
   {state.muted?"Unmute":"Mute"}
  </button>
  {!ready?<p role="status" className="text-xs text-muted-foreground">
   Follow and mute controls are unavailable until team preferences are ready.
  </p>:null}
  {error?<p role="alert" className="text-sm text-danger">{error}</p>:null}
 </section>;
}
