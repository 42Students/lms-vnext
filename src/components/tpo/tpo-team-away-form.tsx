"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {InlineNotice} from "@/components/ui/inline-notice";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import { Label } from "@/components/ui/label";
import { TIMEOUT_MS } from "@/security/limits";
export function TpoTeamAwayForm({until}:{until:string|null}){
 const pending=useRef(false),router=useRouter();
 const [date,setDate]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 async function submit(next:string|null){
  if(pending.current)return;
  pending.current=true;setBusy(true);setError("");setNotice("");
  try{
   await apiFetch("/api/placements/tpo/team/away",{
    method:"POST",credentials:"same-origin",timeoutMs:TIMEOUT_MS.REQUEST,
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({until:next,expectedUntil:until}),
   });
   setDate("");setNotice(next?"Away until saved":"Back now");
   router.refresh();
  }catch(reason){
   setError(reason instanceof FriendlyFetchError&&reason.status===409
    ?"Your away status changed elsewhere. Refresh the page before changing it."
    :reason instanceof FriendlyFetchError&&reason.status===403
     ?"You no longer have permission to update your away status."
     :reason instanceof Error?reason.message:"Could not save away status. Try again.");
  }
  finally{pending.current=false;setBusy(false);}
 }
 return <form className="mt-3 min-w-0 space-y-2 pt-3"
  onSubmit={event=>{event.preventDefault();
   if(!date)return;
   const parsed=new Date(date+"+05:30");
   if(!Number.isFinite(parsed.getTime())){setError("Choose a valid date and time in IST.");return;}
   if(parsed.getTime()<=Date.now()){
    setError("Choose a future date and time in IST. Past away periods cannot be saved.");
    return;
   }
   void submit(parsed.toISOString());}}>
  <Label stack>Away until (IST)
   <Input type="datetime-local" value={date} required disabled={busy}
    onChange={event=>{setDate(event.target.value);setError("");setNotice("");}}
    className="min-h-11 md:min-h-9" />
  </Label>
  <p className="text-xs text-muted-foreground">Choose when you will be back, using India Standard Time (UTC+05:30).</p>
  {error?<InlineNotice tone="error" role="alert" message={error}/>:null}
  {notice?<InlineNotice tone="success" message={notice}/>:null}
  <div className="flex flex-wrap gap-2">
   <Button type="submit" variant="secondary" disabled={busy||!date} className="min-h-11 md:min-h-9 text-xs">{busy?"Saving…":"Set away"}</Button>
   {until?<Button type="button" variant="secondary" disabled={busy} className="min-h-11 md:min-h-9 text-xs"
    onClick={()=>void submit(null)}>Back now</Button>:null}
  </div>
 </form>;
}
