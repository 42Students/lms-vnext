"use client";
import {useState} from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {useRouter} from "next/navigation";
type Drive={id:string;title:string;status:string;companyName:string};
type Preview={eligible:number;ignored:number;excluded:number;pendingLettersWithdrawn:number};
type Result={updated:number;skipped:number;results:{jobId:string;status:string;reason:string}[]};
export function CollegeDriveBulkActions({drives}:{drives:Drive[]}){
 const router=useRouter();
 const [selected,setSelected]=useState<string[]>([]);
 const [action,setAction]=useState<"OPEN"|"CLOSE">("CLOSE");
 const [preview,setPreview]=useState<Preview|null>(null);
 const [result,setResult]=useState<Result|null>(null);
 const [error,setError]=useState("");
 const [busy,setBusy]=useState(false);
 const eligible=drives.filter(row=>action==="CLOSE"?row.status==="PUBLISHED":row.status==="CLOSED");
 function toggle(id:string){setSelected(ids=>ids.includes(id)?ids.filter(x=>x!==id):[...ids,id]);setPreview(null);setResult(null);}
 async function send(stage:"PREVIEW"|"CONFIRM"){
  if(busy||selected.length===0)return;
  setBusy(true);setError("");
  try{
   const response=await fetch("/api/placements/college/drives/bulk",{
    method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({confirmStage:stage==="PREVIEW"?"PREVIEW":undefined,
      confirmed:stage==="CONFIRM"?true:undefined,action,jobIds:selected}),
   });
   const body=await response.json().catch(()=>null);
   if(!response.ok)throw Error(body?.error??"Bulk drive operation failed");
   if(stage==="PREVIEW"){setPreview(body as Preview);setResult(null);}
   else{setResult(body as Result);setPreview(null);
    setSelected((body as Result).results.filter(row=>row.status==="SKIPPED").map(row=>row.jobId));
    router.refresh();}
  }catch(e){setError(e instanceof Error?e.message:"Bulk drive operation failed");}
  finally{setBusy(false);}
 }
 const canProcess=selected.length>0&&selected.length<=25&&!busy;
 return <section className="space-y-3 border-t border-border pt-4" aria-label="Bulk drive actions">
  <div className="flex flex-wrap items-center gap-3">
   <h2 className="font-semibold">Bulk drives</h2>
   <label className="flex min-h-11 items-center gap-2 text-sm">
    <Checkbox disabled={!eligible.length||busy}
     checked={eligible.length>0&&eligible.every(row=>selected.includes(row.id))}
     onChange={e=>{setSelected(e.target.checked?eligible.map(row=>row.id).slice(0,25):[]);
      setPreview(null);setResult(null);}}/>
    Select all eligible on this page ({eligible.length})
   </label>
   <span className="text-sm">{selected.length} selected</span>
   <Select aria-label="Drive bulk action" value={action} onChange={e=>{setAction(e.target.value as "OPEN"|"CLOSE");setSelected([]);setPreview(null);setResult(null);setError("");}}
    className="w-auto">
    <option value="CLOSE">Close selected</option><option value="OPEN">Open closed drives</option>
   </Select>
   <Button variant="primary" type="button" disabled={!canProcess} onClick={()=>void send("PREVIEW")}>Preview change</Button>
  </div>
  <div className="grid max-h-40 gap-2 overflow-auto sm:grid-cols-2 lg:grid-cols-4">
   {eligible.map(row=><label key={row.id} className="flex gap-2 rounded border border-border p-2 text-xs">
     <Checkbox checked={selected.includes(row.id)} onChange={()=>toggle(row.id)}/>
     <span><strong>{row.title}</strong><span className="block text-muted-foreground">
      {row.companyName} · {row.status}</span></span>
    </label>)}
  </div>
  <p className="text-xs text-muted-foreground">Open is available for closed drives; drafts must pass publish preflight in the drive workspace. Close withdraws still-issued offers.</p>
  {preview?<div className="space-y-3 rounded border border-border p-4 text-sm" role="group" aria-label="Bulk action impact">
   <p className="font-semibold">Review impact: {preview.eligible} eligible, {preview.ignored+preview.excluded} skipped.</p>
   {action==="CLOSE"?<p>{preview.pendingLettersWithdrawn} issued offers will be withdrawn across these drives.</p>:
    <p>Previously withdrawn offers will not be reissued when a drive is reopened.</p>}
   <p>Confirm {action.toLowerCase()} for these {preview.eligible} eligible drives?</p>
   <Button variant="primary" type="button" disabled={busy||!preview.eligible} onClick={()=>void send("CONFIRM")}>
     {busy?"Processing…":"Confirm "+action.toLowerCase()}</Button>
  </div>:null}
  {result?<div role="status" className="space-y-2 text-sm">
   <p>{result.updated} drive(s) updated; {result.skipped} skipped.</p>
   {result.results.filter(row=>row.status==="SKIPPED").map(row=><p key={row.jobId} className="text-warning-text">
    {drives.find(d=>d.id===row.jobId)?.title??row.jobId}: {row.reason}</p>)}
   {result.skipped>0?<Button variant="ghost" type="button" onClick={()=>void send("PREVIEW")} className="underline">
    Retry failed</Button>:null}
  </div>:null}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
 </section>;
}
