"use client";
import { Button } from "@/components/ui/button";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";
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
  try{
   const result=await apiFetch<{following:boolean;muted:boolean}>(
    "/api/placements/tpo/team/threads/"+encodeURIComponent(threadId)+"/preferences",{
     method:"POST",credentials:"same-origin",timeoutMs:30000,
     headers:{"Content-Type":"application/json"},body:JSON.stringify({action}),
    });
   setState(result);router.refresh();
  }catch(reason){setError(reason instanceof Error?reason.message:friendlyApiError({network:true}));}
  finally{pending.current=false;setBusy(false);}
 }
 return <section className="flex flex-wrap items-center gap-2" aria-label="Conversation preferences">
  <Button type="button" variant="secondary" disabled={busy||!ready} onClick={()=>void change(state.following?"UNFOLLOW":"FOLLOW")}
   className="min-h-11 sm:min-h-9">
   {state.following?"Stop following":"Follow"}
  </Button>
  <Button type="button" variant="secondary" disabled={busy||!ready} onClick={()=>void change(state.muted?"UNMUTE":"MUTE")}
   className="min-h-11 sm:min-h-9">
   {state.muted?"Unmute":"Mute"}
  </Button>
  {!ready?<p role="status" className="text-xs text-muted-foreground">
   Follow and mute controls are unavailable until team preferences are ready.
  </p>:null}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
 </section>;
}
