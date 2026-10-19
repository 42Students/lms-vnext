"use client";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {Button} from "@/components/ui/button";
type Preview={eligible:number;ignored:number;excluded:number;pendingLettersWithdrawn:number};
type Result={updated:number;skipped:number;results:{status:string;reason:string}[]};
/** Same locked writer and impact check as bulk drives, scoped to one drive. */
export function CollegeDriveRowLifecycleAction({jobId,title,status}:{
 jobId:string;title:string;status:string;
}){
 const router=useRouter();
 const action=status==="PUBLISHED"?"CLOSE":status==="CLOSED"?"OPEN":null;
 const [preview,setPreview]=useState<Preview|null>(null);
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState("");
 if(!action)return null;
 async function perform(confirm:boolean){
  if(busy)return;
  setBusy(true);setError("");setMessage("");
  try{
   const response=await fetch("/api/placements/college/drives/bulk",{
    method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},
    body:JSON.stringify({jobIds:[jobId],action,
      ...(confirm?{confirmed:true}:{confirmStage:"PREVIEW"})}),
   });
   const result=await response.json().catch(()=>null);
   if(!response.ok)throw Error(result?.error??"Unable to change drive");
   if(!confirm){setPreview(result as Preview);return;}
   const applied=result as Result;
   if(!applied.updated)throw Error(applied.results?.[0]?.reason??"Drive was not changed");
   setPreview(null);setMessage(action==="CLOSE"?"Drive closed":"Drive opened");
   router.refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:"Drive action unavailable");}
  finally{setBusy(false);}
 }
 return <div className="inline-flex flex-col gap-2 text-sm">
  {!preview?<Button variant="secondary" type="button" onClick={()=>void perform(false)} disabled={busy}
    >
    {action==="CLOSE"?"Close":"Open"}</Button>:<div role="group" aria-label={"Confirm "+action.toLowerCase()+" "+title}
    className="space-y-2 rounded border border-border bg-surface p-3">
   <p className="text-xs font-semibold">{action==="CLOSE"?"Close":"Reopen"} {title}?</p>
   {action==="CLOSE"?<p className="text-xs">{preview.pendingLettersWithdrawn} issued offers may be withdrawn. Audit and application history remain.</p>:
    <p className="text-xs">Previously withdrawn offers will not be reissued.</p>}
   <Button type="button" disabled={busy||!preview.eligible} onClick={()=>void perform(true)}
    >Confirm</Button>
   <Button variant="secondary" type="button" disabled={busy} onClick={()=>setPreview(null)}
    className="ml-2">Cancel</Button>
  </div>}
  {error?<p role="alert" className="max-w-48 text-xs text-error">{error}</p>:null}
  {message?<p role="status" className="text-xs">{message}</p>:null}
 </div>;
}
