"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {InlineNotice} from "@/components/ui/inline-notice";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
export function TpoTeamAwayForm({until}:{until:string|null}){
 const pending=useRef(false),router=useRouter();
 const [date,setDate]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 async function submit(next:string|null){
  if(pending.current)return;
  pending.current=true;setBusy(true);setError("");setNotice("");
  try{
   await apiFetch("/api/placements/tpo/team/away",{
    method:"POST",credentials:"same-origin",timeoutMs:12000,
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({until:next,expectedUntil:until}),
   });
   setNotice(next?"Away until saved":"Back now");
   router.refresh();
  }catch(reason){setError(reason instanceof Error?reason.message:"Could not save away status. Try again.");}
  finally{pending.current=false;setBusy(false);}
 }
 return <form className="mt-3 min-w-0 space-y-2 border-t border-border pt-3"
  onSubmit={event=>{event.preventDefault();
   if(!date)return;const parsed=new Date(date+"+05:30");
   if(!Number.isFinite(parsed.getTime())){setError("Choose when you will be back.");return;}
   void submit(parsed.toISOString());}}>
  <label className="grid gap-1 text-xs font-semibold">Away until (IST)
   <Input type="datetime-local" value={date} disabled={busy} onChange={event=>setDate(event.target.value)}
    className="min-h-11 md:min-h-9" />
  </label>
  {error?<InlineNotice tone="error" message={error}/>:null}
  {notice?<InlineNotice tone="success" message={notice}/>:null}
  <div className="flex flex-wrap gap-2">
   <Button type="submit" variant="secondary" disabled={busy||!date} className="min-h-11 md:min-h-9 text-xs">{busy?"Saving…":"Set away"}</Button>
   {until?<Button type="button" variant="secondary" disabled={busy} className="min-h-11 md:min-h-9 text-xs"
    onClick={()=>void submit(null)}>Back now</Button>:null}
  </div>
 </form>;
}
